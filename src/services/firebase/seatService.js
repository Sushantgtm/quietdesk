import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_SEATS } from '../mock/mockData';

const LOCAL_STORAGE_SEATS_KEY = 'quietdesk_seats_v4';

export const getLocalSeats = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_SEATS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return MOCK_SEATS;
};

export const saveLocalSeats = (seats) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SEATS_KEY, JSON.stringify(seats));
  } catch (e) {}
};

export const seedSeatsToFirestore = async () => {
  try {
    for (const seat of MOCK_SEATS) {
      await setDoc(doc(db, 'seats', seat.id), seat, { merge: true });
    }
    console.log('Successfully seeded seats to Firestore');
  } catch (e) {
    console.warn('Unable to seed Firestore seats:', e.message);
  }
};

export const subscribeSeatAvailability = (onSeatsUpdate) => {
  const seatsRef = collection(db, 'seats');
  return onSnapshot(
    seatsRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedSeatsToFirestore();
        onSeatsUpdate(getLocalSeats());
      } else {
        const firestoreSeats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        saveLocalSeats(firestoreSeats);
        onSeatsUpdate(firestoreSeats);
      }
    },
    (error) => {
      console.error('Firestore seats subscription error:', error.message);
      onSeatsUpdate(getLocalSeats());
    }
  );
};

export const updateSeatStatusInFirestore = async (seatId, newStatus) => {
  const seatRef = doc(db, 'seats', seatId);
  await updateDoc(seatRef, { status: newStatus, updatedAt: new Date().toISOString() });

  const localSeats = getLocalSeats().map(seat => 
    seat.id === seatId ? { ...seat, status: newStatus } : seat
  );
  saveLocalSeats(localSeats);
  return true;
};

export const updateSeatDetailsInFirestore = async (seatId, updatedFields) => {
  const seatRef = doc(db, 'seats', seatId);
  await updateDoc(seatRef, { ...updatedFields, updatedAt: new Date().toISOString() });

  const localSeats = getLocalSeats().map(seat => 
    seat.id === seatId ? { ...seat, ...updatedFields, updatedAt: new Date().toISOString() } : seat
  );
  saveLocalSeats(localSeats);
  return true;
};

export const createSeatInFirestore = async (seatData) => {
  const newId = seatData.id || `seat_${Date.now()}`;
  const newSeat = {
    id: newId,
    seatNumber: seatData.seatNumber || 'A1',
    zone: seatData.zone || 'Left Quiet Row (Zone A)',
    type: seatData.type || 'Single Desk',
    pricePerDay: Number(seatData.pricePerDay) || 500,
    status: seatData.status || 'AVAILABLE',
    features: Array.isArray(seatData.features) ? seatData.features : (seatData.features ? seatData.features.split(',').map(s => s.trim()) : ['Power Outlet', 'Reading Light']),
    createdAt: new Date().toISOString()
  };

  const seatRef = doc(db, 'seats', newId);
  await setDoc(seatRef, newSeat, { merge: true });

  const localSeats = [...getLocalSeats().filter(s => s.id !== newId), newSeat];
  saveLocalSeats(localSeats);
  return newSeat;
};

export const deleteSeatInFirestore = async (seatId) => {
  if (!seatId) return false;
  const stringId = String(seatId);
  const seatRef = doc(db, 'seats', stringId);
  await deleteDoc(seatRef);

  const localSeats = getLocalSeats().filter(seat => String(seat.id) !== stringId);
  saveLocalSeats(localSeats);
  return true;
};

/**
 * Scans all seats in Firestore and ensures seats with no active non-cancelled/non-rejected
 * student bookings are set to AVAILABLE. Does NOT delete or reset all seats blindly.
 */
export const reconcileSeatAvailabilityInFirestore = async () => {
  try {
    const seatsSnap = await getDocs(collection(db, 'seats'));
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const usersSnap = await getDocs(collection(db, 'users'));

    const todayStr = new Date().toISOString().split('T')[0];

    // Collect active user IDs & normalized phones
    const activeUserIds = new Set();
    const activeUserPhones = new Set();
    usersSnap.docs.forEach(d => {
      const u = d.data();
      if (!u.deleted && u.status !== 'DELETED' && u.membershipStatus !== 'DELETED') {
        activeUserIds.add(d.id);
        if (u.id) activeUserIds.add(u.id);
        if (u.phone) activeUserPhones.add(u.phone.replace(/\D/g, ''));
      }
    });

    // Collect occupied/reserved seatIds from active, non-expired bookings
    const activeSeatIds = new Set();
    const activeSeatNumbers = new Set();

    bookingsSnap.docs.forEach(d => {
      const b = d.data();
      // Only consideration: active non-cancelled bookings
      const isActiveStatus = ['APPROVED', 'CONFIRMED', 'CHECKED_IN'].includes(b.status);
      if (!isActiveStatus) return;

      // Check if student is active
      const bPhone = (b.userPhone || '').replace(/\D/g, '');
      const studentIsActive = (b.userId && activeUserIds.has(b.userId)) || (bPhone && activeUserPhones.has(bPhone));
      // If student is explicitly deleted/missing and users collection has data, don't hold the seat
      if (!studentIsActive && usersSnap.docs.length > 0) return;

      // Check date validity (booking has not expired past today)
      const bEnd = b.endDate || b.startDate || todayStr;
      if (bEnd < todayStr) return; // expired booking

      if (b.seatId) activeSeatIds.add(String(b.seatId));
      if (b.seatNumber) activeSeatNumbers.add(String(b.seatNumber));
    });

    // Check each seat in Firestore
    const updates = [];
    for (const seatDoc of seatsSnap.docs) {
      const seat = seatDoc.data();
      const seatId = String(seatDoc.id);
      const seatNum = String(seat.seatNumber || '');
      const isClaimed = activeSeatIds.has(seatId) || (seatNum && activeSeatNumbers.has(seatNum));

      if (!isClaimed && (seat.status === 'OCCUPIED' || seat.status === 'RESERVED' || seat.status === 'BOOKED')) {
        updates.push(
          updateDoc(doc(db, 'seats', seatDoc.id), {
            status: 'AVAILABLE',
            updatedAt: new Date().toISOString()
          })
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      // Synchronize local seats
      const updatedLocal = getLocalSeats().map(s => {
        const isClaimed = activeSeatIds.has(String(s.id)) || (s.seatNumber && activeSeatNumbers.has(String(s.seatNumber)));
        return !isClaimed && (s.status === 'OCCUPIED' || s.status === 'RESERVED' || s.status === 'BOOKED')
          ? { ...s, status: 'AVAILABLE', updatedAt: new Date().toISOString() }
          : s;
      });
      saveLocalSeats(updatedLocal);
    }

    return updates.length;
  } catch (err) {
    console.error('Error reconciling seat availability:', err);
    return 0;
  }
};

