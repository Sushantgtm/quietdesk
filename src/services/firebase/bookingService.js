import { collection, onSnapshot, doc, setDoc, updateDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { updateSeatStatusInFirestore } from './seatService';
import { MOCK_BOOKINGS } from '../mock/mockData';

const LOCAL_STORAGE_BOOKINGS_KEY = 'quietdesk_bookings_v5';

// Automatically purge legacy cache keys on initial load
try {
  ['v1', 'v2', 'v3', 'v4'].forEach(v => {
    localStorage.removeItem(`quietdesk_bookings_${v}`);
  });
} catch (e) {}

export const getLocalBookings = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local bookings', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(MOCK_BOOKINGS));
  return MOCK_BOOKINGS;
};

export const saveLocalBookings = (bookings) => {
  localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
};

export const resetLocalBookings = () => {
  localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(MOCK_BOOKINGS));
  return MOCK_BOOKINGS;
};

export const subscribeBookings = (onBookingsUpdate) => {
  let unsub = () => {};
  try {
    const bookingsRef = collection(db, 'bookings');
    unsub = onSnapshot(bookingsRef, (snapshot) => {
      const firestoreBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalBookings(firestoreBookings);
      onBookingsUpdate(firestoreBookings);
    }, (error) => {
      console.warn('Firestore bookings subscription error, using local fallback:', error.message);
      onBookingsUpdate(getLocalBookings());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for bookings:', e);
    onBookingsUpdate(getLocalBookings());
  }

  const handleLocalChange = () => onBookingsUpdate(getLocalBookings());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const fetchAllBookings = async () => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsRef);
    if (!snapshot.empty) {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalBookings(data);
      return data;
    }
  } catch (e) {
    console.warn('Error fetching bookings from Firestore, returning local data:', e);
  }
  return getLocalBookings();
};

import { findOrCreateStudent } from './userService';

export const createBooking = async (bookingData) => {
  const bookingId = bookingData.id || ('BK-' + Date.now());
  const bookingCode = bookingData.bookingCode || ('QD-' + Math.floor(1000 + Math.random() * 9000));
  
  // 1. Enforce: A student cannot book two active seats simultaneously
  const currentLocal = getLocalBookings();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const studentPhone = (bookingData.userPhone || '').trim().replace(/\D/g, '');
  const studentEmail = (bookingData.userEmail || '').trim().toLowerCase();
  const studentUserId = bookingData.userId || null;
  const requestedSeatId = bookingData.seatId;

  const existingActiveBooking = currentLocal.find(b => {
    if (bookingData.id && b.id === bookingData.id) return false;
    if (['CANCELLED', 'COMPLETED'].includes(b.status)) return false;
    if (b.endDate && b.endDate < todayStr) return false; // expired
    
    // If the booking is for the exact same seat extension or renewal, allow
    if (requestedSeatId && b.seatId === requestedSeatId) return false;

    const bPhone = (b.userPhone || '').trim().replace(/\D/g, '');
    const bEmail = (b.userEmail || '').trim().toLowerCase();
    const bUserId = b.userId || null;

    const matchesPhone = studentPhone && bPhone && studentPhone === bPhone;
    const matchesEmail = studentEmail && bEmail && studentEmail === bEmail;
    const matchesUserId = studentUserId && bUserId && studentUserId === bUserId;

    return (matchesPhone || matchesEmail || matchesUserId);
  });

  if (existingActiveBooking) {
    const desk = existingActiveBooking.seatNumber || 'another desk';
    const until = existingActiveBooking.endDate || 'active';
    throw new Error(`Scholar "${bookingData.userName || 'Student'}" already has an active desk assigned (Desk ${desk}, valid until ${until}). A student cannot hold multiple active cabins.`);
  }

  // 2. Ensure user is created/updated in the users table first
  let userId = bookingData.userId || null;
  let userCode = bookingData.userCode || null;
  let userName = bookingData.userName || 'Scholar';

  try {
    const studentRes = await findOrCreateStudent({
      fullName: bookingData.userName || 'Scholar',
      name: bookingData.userName || 'Scholar',
      email: bookingData.userEmail || '',
      phone: bookingData.userPhone || '',
      passType: bookingData.passType || 'DAILY',
      assignedSeat: bookingData.seatNumber ? `Desk ${bookingData.seatNumber}` : '',
      seatNumber: bookingData.seatNumber || '',
      status: 'ACTIVE',
      membershipStatus: 'ACTIVE'
    });

    if (studentRes && studentRes.user) {
      userId = studentRes.user.id;
      userCode = studentRes.user.userCode;
      userName = studentRes.user.fullName || studentRes.user.name || userName;
    }
  } catch (userErr) {
    console.warn('Unable to sync user record prior to booking creation:', userErr.message);
  }

  // 3. Build booking object linked to the user record
  const newBooking = {
    id: bookingId,
    bookingCode,
    userId,
    userCode,
    userName,
    createdAt: new Date().toISOString(),
    status: bookingData.status || 'PENDING_CONFIRMATION',
    paymentStatus: bookingData.paymentStatus || 'PENDING',
    ...bookingData
  };

  // Update local storage for immediate reflection
  const updatedLocal = [newBooking, ...currentLocal.filter(b => b.id !== bookingId)];
  saveLocalBookings(updatedLocal);

  // Update seat status in Firestore
  if (bookingData.seatId) {
    const targetSeatStatus = newBooking.status === 'CONFIRMED' || newBooking.status === 'CHECKED_IN' ? 'OCCUPIED' : 'RESERVED';
    await updateSeatStatusInFirestore(bookingData.seatId, targetSeatStatus);
  }

  try {
    await setDoc(doc(db, 'bookings', bookingId), newBooking, { merge: true });
    console.log(`✅ Reservation ${bookingCode} linked to user ${userId} committed to Firestore:`, bookingId);
    return newBooking;
  } catch (e) {
    console.warn('Firestore write failed, stored locally:', e.message);
    return newBooking;
  }
};

// Admin-only: confirm a pending reservation → marks booking CONFIRMED + seat OCCUPIED
export const confirmBooking = async (bookingId, seatId) => {
  const currentLocal = getLocalBookings();
  const updatedLocal = currentLocal.map(b =>
    b.id === bookingId ? { ...b, status: 'CONFIRMED', paymentStatus: 'PAID' } : b
  );
  saveLocalBookings(updatedLocal);

  await updateSeatStatusInFirestore(seatId, 'OCCUPIED');

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      confirmedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.warn('Firestore confirm failed, local state updated:', e.message);
    return false;
  }
};

export const updateBookingStatus = async (bookingId, seatId, newStatus) => {
  // Update local storage
  const currentLocal = getLocalBookings();
  const updatedLocal = currentLocal.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
  saveLocalBookings(updatedLocal);

  // Seat status transitions
  if (newStatus === 'CANCELLED' || newStatus === 'COMPLETED') {
    await updateSeatStatusInFirestore(seatId, 'AVAILABLE');
  } else if (newStatus === 'CHECKED_IN') {
    await updateSeatStatusInFirestore(seatId, 'OCCUPIED');
  } else if (newStatus === 'CONFIRMED') {
    await updateSeatStatusInFirestore(seatId, 'OCCUPIED');
  }

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status: newStatus, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.warn('Firestore booking status update failed, local state updated:', e.message);
    return false;
  }
};

export const updateBookingPaymentStatus = async (bookingId, newPaymentStatus) => {
  const currentLocal = getLocalBookings();
  const updatedLocal = currentLocal.map(b => b.id === bookingId ? { ...b, paymentStatus: newPaymentStatus } : b);
  saveLocalBookings(updatedLocal);

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { paymentStatus: newPaymentStatus, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.warn('Firestore payment status update failed, local state updated:', e.message);
    return false;
  }
};

// Admin Edit Booking: modify seat, shift, bookingTime, dates, status, paymentStatus, etc.
export const updateBookingDetails = async (bookingId, updatedFields) => {
  const currentLocal = getLocalBookings();
  const existingBooking = currentLocal.find(b => b.id === bookingId);
  
  if (!existingBooking) {
    console.error('Booking not found:', bookingId);
    return false;
  }

  // Handle seat change if seatId is updated
  if (updatedFields.seatId && updatedFields.seatId !== existingBooking.seatId) {
    await updateSeatStatusInFirestore(existingBooking.seatId, 'AVAILABLE');
    const newSeatStatus = (updatedFields.status === 'CHECKED_IN' || updatedFields.status === 'CONFIRMED') ? 'OCCUPIED' : 'RESERVED';
    await updateSeatStatusInFirestore(updatedFields.seatId, newSeatStatus);
  } else if (updatedFields.status && updatedFields.status !== existingBooking.status) {
    const currentSeatId = updatedFields.seatId || existingBooking.seatId;
    if (updatedFields.status === 'CANCELLED' || updatedFields.status === 'COMPLETED') {
      await updateSeatStatusInFirestore(currentSeatId, 'AVAILABLE');
    } else if (updatedFields.status === 'CHECKED_IN' || updatedFields.status === 'CONFIRMED') {
      await updateSeatStatusInFirestore(currentSeatId, 'OCCUPIED');
    }
  }

  const updatedBooking = {
    ...existingBooking,
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  const updatedLocal = currentLocal.map(b => b.id === bookingId ? updatedBooking : b);
  saveLocalBookings(updatedLocal);

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.warn('Firestore updateBookingDetails failed, fallback to local:', e.message);
    return false;
  }
};
export const deleteBooking = async (bookingId) => {
  const { deleteDoc } = await import('firebase/firestore');
  const currentLocal = getLocalBookings();
  const updated = currentLocal.filter(b => b.id !== bookingId);
  saveLocalBookings(updated);
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
    return true;
  } catch (e) {
    console.warn('Firestore booking delete error:', e.message);
    return false;
  }
};

export const purgeAllBookingsFromFirestore = async () => {
  const { deleteDoc, getDocs: gds } = await import('firebase/firestore');
  const snapshot = await gds(collection(db, 'bookings'));
  const deletes = snapshot.docs.map(d => deleteDoc(doc(db, 'bookings', d.id)));
  await Promise.all(deletes);
  saveLocalBookings([]);
  return snapshot.docs.length;
};
