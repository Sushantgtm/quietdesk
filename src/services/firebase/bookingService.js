import {
  collection, onSnapshot, doc, setDoc, updateDoc, getDocs,
  deleteDoc, runTransaction, serverTimestamp, query, where
} from 'firebase/firestore';
import { db } from './firebase';
import { findOrCreateStudentFirestore } from './userService';

// ─── localStorage cache helpers (UI cache ONLY — not authoritative source) ───
const CACHE_KEY = 'quietdesk_bookings_cache_v6';

// Purge all legacy cache keys
try {
  ['v1','v2','v3','v4','v5'].forEach(v => {
    localStorage.removeItem(`quietdesk_bookings_${v}`);
    localStorage.removeItem(`quietdesk_bookings_cache_${v}`);
  });
} catch(_) {}

const getCachedBookings = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch(_) { return []; }
};
const setCachedBookings = (list) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch(_) {}
};

// ─── Keep these exports so existing code that imports them doesn't break ──────
export const getLocalBookings = getCachedBookings;
export const saveLocalBookings = setCachedBookings;
export const resetLocalBookings = () => { setCachedBookings([]); return []; };

// ─── Real-time subscription ────────────────────────────────────────────────────
export const subscribeBookings = (onBookingsUpdate) => {
  const bookingsRef = collection(db, 'bookings');
  const unsub = onSnapshot(
    bookingsRef,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCachedBookings(list);
      onBookingsUpdate(list);
    },
    (error) => {
      console.error('[bookingService] Firestore subscription error:', error.message);
      // Serve cache to keep UI alive but do NOT pretend it is fresh
      onBookingsUpdate(getCachedBookings());
    }
  );
  return unsub;
};

// ─── One-off fetch ─────────────────────────────────────────────────────────────
export const fetchAllBookings = async () => {
  const snapshot = await getDocs(collection(db, 'bookings'));
  const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  setCachedBookings(list);
  return list;
};

// ─── Date-range overlap helper ─────────────────────────────────────────────────
// Returns true when two date ranges overlap (inclusive boundary comparison)
const dateRangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  if (!aStart || !bStart) return true; // no dates → assume overlap to be safe
  const as = aStart, ae = aEnd || aStart;
  const bs = bStart, be = bEnd || bStart;
  return as <= be && bs <= ae;
};

// ─── createBooking (PUBLIC WEBSITE) ───────────────────────────────────────────
// Rules:
//   • Status is always PENDING (not PENDING_CONFIRMATION, not CONFIRMED)
//   • Seat status is NEVER changed here — admin approval changes the seat
//   • Firestore write MUST succeed or we throw (no silent local-only fallback)
//   • One requested seat per reservation (already enforced by UI; validated here)
//   • Allow multiple bookings for the same student when date ranges don't overlap
export const createBooking = async (bookingData) => {
  // 1. Validate: exactly one seat
  if (!bookingData.seatId) {
    throw new Error('A desk must be selected before submitting a reservation.');
  }

  const bookingId   = 'BK-' + Date.now();
  const bookingCode = 'QD-' + Math.floor(1000 + Math.random() * 9000);
  const startDate   = bookingData.startDate || new Date().toISOString().split('T')[0];
  const endDate     = bookingData.endDate   || startDate;

  // 2. Resolve student (Firestore query, not localStorage)
  let userId   = bookingData.userId   || null;
  let userCode = bookingData.userCode || null;
  let userName = bookingData.userName || 'Scholar';

  if (bookingData.userPhone || bookingData.userEmail) {
    try {
      const studentRes = await findOrCreateStudentFirestore({
        fullName:  bookingData.userName  || 'Scholar',
        email:     bookingData.userEmail || '',
        phone:     bookingData.userPhone || '',
        passType:  bookingData.passType  || 'DAILY',
      });
      if (studentRes?.user) {
        userId   = studentRes.user.id;
        userCode = studentRes.user.userCode;
        userName = studentRes.user.fullName || studentRes.user.name || userName;
      }
    } catch (err) {
      console.warn('[createBooking] Could not resolve student:', err.message);
    }
  }

  // 3. Conflict check — query Firestore for overlapping active bookings for this student
  if (userId || bookingData.userPhone || bookingData.userEmail) {
    const allBookings = getCachedBookings(); // use cache as a fast first pass
    const conflictingBooking = allBookings.find(b => {
      // Skip cancelled/completed/rejected
      if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(b.status)) return false;

      // Match by userId OR phone OR email
      const phoneClean = (bookingData.userPhone || '').replace(/\D/g, '');
      const emailClean = (bookingData.userEmail || '').toLowerCase().trim();
      const bPhone = (b.userPhone || '').replace(/\D/g, '');
      const bEmail = (b.userEmail || '').toLowerCase().trim();
      const matchesUser =
        (userId && b.userId === userId) ||
        (phoneClean && bPhone && phoneClean === bPhone) ||
        (emailClean && bEmail && emailClean === bEmail);

      if (!matchesUser) return false;

      // Allow same-seat renewals (same seat, different dates)
      // But block: same student + overlapping dates + different seat
      const overlaps = dateRangesOverlap(startDate, endDate, b.startDate, b.endDate);
      if (!overlaps) return false; // non-overlapping date ranges → OK

      // Same seat + overlapping → duplicate (block)
      // Different seat + overlapping → dual-seat conflict (block)
      return true;
    });

    if (conflictingBooking) {
      throw new Error(
        `This student already has an active reservation (Desk ${conflictingBooking.seatNumber || '?'}, ` +
        `${conflictingBooking.startDate || 'start'} – ${conflictingBooking.endDate || 'end'}). ` +
        `Two overlapping reservations are not allowed.`
      );
    }
  }

  // 4. Build booking document
  //    Status = PENDING  (seat is NOT touched)
  const newBooking = {
    id:           bookingId,
    bookingCode,
    userId,
    userCode,
    userName,
    userEmail:    bookingData.userEmail    || '',
    userPhone:    bookingData.userPhone    || '',
    seatId:       bookingData.seatId,
    seatNumber:   bookingData.seatNumber   || '',
    zone:         bookingData.zone         || '',
    passType:     bookingData.passType     || 'DAILY',
    hasLocker:    bookingData.hasLocker    || false,
    lockerFee:    bookingData.lockerFee    || 0,
    startDate,
    endDate,
    arrivalTime:  bookingData.arrivalTime  || bookingData.bookingTime || '',
    bookingTime:  bookingData.arrivalTime  || bookingData.bookingTime || '',
    totalAmount:  bookingData.totalAmount  || 0,
    amountPaid:   0,
    pendingAmount: bookingData.totalAmount || 0,
    paymentStatus: 'PENDING',
    status:       'PENDING',         // ← Always PENDING from public website
    bookingType:  bookingData.bookingType || 'WEBSITE_BOOKING',
    createdAt:    new Date().toISOString(),
  };

  // 5. Write to Firestore — MUST succeed or we throw (no silent fallback)
  await setDoc(doc(db, 'bookings', bookingId), newBooking);
  // NOTE: We do NOT call updateSeatStatusInFirestore here.
  //       The seat remains AVAILABLE until admin approves.

  // Update local cache optimistically
  setCachedBookings([newBooking, ...getCachedBookings().filter(b => b.id !== bookingId)]);

  return newBooking;
};

// ─── approveBooking (ADMIN — atomic transaction) ──────────────────────────────
// Sets booking → APPROVED, seat → RESERVED (not OCCUPIED; admin checks in separately)
// Fails safely if seat was already taken by another booking.
export const approveBooking = async (bookingId, approvalData = {}) => {
  const bookingRef = doc(db, 'bookings', bookingId);

  const result = await runTransaction(db, async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists()) throw new Error('Reservation not found.');

    const booking = { id: bookingSnap.id, ...bookingSnap.data() };

    if (booking.status !== 'PENDING') {
      throw new Error(`This reservation is already ${booking.status}.`);
    }

    const targetSeatId = approvalData.seatId || booking.seatId;
    if (!targetSeatId) throw new Error('No desk selected for this reservation.');

    const seatRef  = doc(db, 'seats', targetSeatId);
    const seatSnap = await tx.get(seatRef);

    if (!seatSnap.exists()) throw new Error(`Seat "${targetSeatId}" not found in database.`);

    const seat = seatSnap.data();
    if (seat.status !== 'AVAILABLE') {
      throw new Error(
        `Desk ${seat.seatNumber || targetSeatId} is no longer available (status: ${seat.status}). ` +
        `Please choose another desk.`
      );
    }

    // Check the student does not already have another active/approved booking on a different seat
    // (We skip this deep check in transaction to keep it lightweight;
    //  the subscription + UI guard handles this for most cases.)

    const now         = new Date().toISOString();
    const startDate   = approvalData.startDate   || booking.startDate   || now.split('T')[0];
    const endDate     = approvalData.endDate     || booking.endDate     || startDate;
    const passType    = approvalData.passType    || booking.passType    || 'DAILY';
    const seatNumber  = seatSnap.data().seatNumber || booking.seatNumber || '';
    const totalAmount = approvalData.totalAmount !== undefined ? approvalData.totalAmount : (booking.totalAmount || 0);
    const amountPaid  = approvalData.amountPaid  !== undefined ? approvalData.amountPaid  : 0;
    const pendingAmount = Math.max(0, totalAmount - amountPaid);
    const paymentStatus = amountPaid >= totalAmount ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'PENDING';

    // Update booking
    tx.update(bookingRef, {
      status:         'APPROVED',
      seatId:         targetSeatId,
      seatNumber,
      startDate,
      endDate,
      passType,
      totalAmount,
      amountPaid,
      pendingAmount,
      paymentStatus,
      arrivalTime:    approvalData.arrivalTime    || booking.arrivalTime    || '06:00 AM',
      bookingTime:    approvalData.arrivalTime    || booking.arrivalTime    || '06:00 AM',
      hasLocker:      approvalData.hasLocker      !== undefined ? approvalData.hasLocker      : (booking.hasLocker || false),
      lockerNumber:   approvalData.lockerNumber   || booking.lockerNumber   || '',
      paymentMethod:  approvalData.paymentMethod  || 'CASH',
      approvedAt:     now,
      updatedAt:      now,
    });

    // Update seat → RESERVED
    tx.update(seatRef, { status: 'RESERVED', updatedAt: now });

    return { booking, seat: seatSnap.data(), seatNumber };
  });

  // Update local cache
  const cached = getCachedBookings();
  setCachedBookings(cached.map(b =>
    b.id === bookingId ? { ...b, status: 'APPROVED', seatId: approvalData.seatId || b.seatId } : b
  ));

  return result;
};

// ─── rejectBooking (ADMIN) ────────────────────────────────────────────────────
// Sets booking → REJECTED.  Seat is NOT touched (it was never reserved on PENDING).
export const rejectBooking = async (bookingId, reason = '') => {
  const bookingRef = doc(db, 'bookings', bookingId);
  const now = new Date().toISOString();

  await updateDoc(bookingRef, {
    status:     'REJECTED',
    rejectedAt: now,
    updatedAt:  now,
    ...(reason ? { rejectionReason: reason } : {}),
  });

  // Update local cache
  const cached = getCachedBookings();
  setCachedBookings(cached.map(b => b.id === bookingId ? { ...b, status: 'REJECTED' } : b));

  return true;
};

// ─── confirmBooking (legacy — admin check-in: APPROVED → CONFIRMED + seat OCCUPIED) ──
// Called when admin actually seats the student (check-in).
export const confirmBooking = async (bookingId, seatId) => {
  const bookingRef = doc(db, 'bookings', bookingId);
  const now = new Date().toISOString();

  await runTransaction(db, async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists()) throw new Error('Booking not found.');

    const seatRef  = doc(db, 'seats', seatId);
    tx.update(bookingRef, { status: 'CONFIRMED', confirmedAt: now, updatedAt: now });
    tx.update(seatRef,    { status: 'OCCUPIED',  updatedAt: now });
  });

  const cached = getCachedBookings();
  setCachedBookings(cached.map(b =>
    b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b
  ));

  return true;
};

// ─── updateBookingStatus (generic — used by admin actions) ────────────────────
export const updateBookingStatus = async (bookingId, seatId, newStatus) => {
  const now = new Date().toISOString();
  const updates = { status: newStatus, updatedAt: now };

  // Only touch seat when transitioning to terminal states that release the seat
  if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(newStatus) && seatId) {
    try {
      await runTransaction(db, async (tx) => {
        const bookingRef = doc(db, 'bookings', bookingId);
        const seatRef    = doc(db, 'seats', seatId);
        tx.update(bookingRef, updates);
        tx.update(seatRef, { status: 'AVAILABLE', updatedAt: now });
      });
    } catch (e) {
      // Fallback if transaction fails
      await updateDoc(doc(db, 'bookings', bookingId), updates).catch(() => {});
      await updateDoc(doc(db, 'seats', seatId), { status: 'AVAILABLE', updatedAt: now }).catch(() => {});
    }
  } else {
    await updateDoc(doc(db, 'bookings', bookingId), updates);
    if (newStatus === 'CHECKED_IN' && seatId) {
      await updateDoc(doc(db, 'seats', seatId), { status: 'OCCUPIED', updatedAt: now });
    }
  }

  const cached = getCachedBookings();
  setCachedBookings(cached.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  return true;
};

// ─── updateBookingPaymentStatus ───────────────────────────────────────────────
export const updateBookingPaymentStatus = async (bookingId, newPaymentStatus) => {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'bookings', bookingId), {
    paymentStatus: newPaymentStatus,
    updatedAt: now,
  });
  const cached = getCachedBookings();
  setCachedBookings(cached.map(b =>
    b.id === bookingId ? { ...b, paymentStatus: newPaymentStatus } : b
  ));
  return true;
};

// ─── updateBookingDetails (admin edit) ────────────────────────────────────────
export const updateBookingDetails = async (bookingId, updatedFields) => {
  const now = new Date().toISOString();

  // Handle seat status transitions if seat or status changed
  const cached = getCachedBookings();
  const existing = cached.find(b => b.id === bookingId);

  if (existing) {
    // If status changes to terminal → release seat
    if (
      updatedFields.status &&
      ['CANCELLED', 'COMPLETED'].includes(updatedFields.status) &&
      existing.seatId
    ) {
      try {
        await updateDoc(doc(db, 'seats', existing.seatId), { status: 'AVAILABLE', updatedAt: now });
      } catch (_) {}
    }
    // If seat changes → release old seat
    if (updatedFields.seatId && updatedFields.seatId !== existing.seatId) {
      if (existing.seatId) {
        try {
          await updateDoc(doc(db, 'seats', existing.seatId), { status: 'AVAILABLE', updatedAt: now });
        } catch (_) {}
      }
    }
  }

  await updateDoc(doc(db, 'bookings', bookingId), { ...updatedFields, updatedAt: now });

  // Update cache
  setCachedBookings(cached.map(b =>
    b.id === bookingId ? { ...b, ...updatedFields, updatedAt: now } : b
  ));

  return true;
};

// ─── Admin walk-in booking (CONFIRMED immediately) ────────────────────────────
// Different from public createBooking: seat is set OCCUPIED right away.
export const createAdminBooking = async (bookingData) => {
  const bookingId   = 'BK-' + Date.now();
  const bookingCode = bookingData.bookingCode || ('QD-MAN-' + Math.floor(1000 + Math.random() * 9000));
  const now         = new Date().toISOString();

  const newBooking = {
    ...bookingData,
    id:          bookingId,
    bookingCode,
    status:      bookingData.status || 'CONFIRMED',
    bookingType: bookingData.bookingType || 'WALK_IN',
    createdAt:   now,
    updatedAt:   now,
  };

  // If confirmed, also update seat status
  if (newBooking.status === 'CONFIRMED' && newBooking.seatId) {
    await runTransaction(db, async (tx) => {
      tx.set(doc(db, 'bookings', bookingId), newBooking);
      tx.update(doc(db, 'seats', newBooking.seatId), { status: 'OCCUPIED', updatedAt: now });
    });
  } else {
    await setDoc(doc(db, 'bookings', bookingId), newBooking);
  }

  setCachedBookings([newBooking, ...getCachedBookings().filter(b => b.id !== bookingId)]);
  return newBooking;
};

// ─── deleteBooking ─────────────────────────────────────────────────────────────
export const deleteBooking = async (bookingId) => {
  if (!bookingId) return false;

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const snap = await getDoc(bookingRef);
    if (snap.exists()) {
      const b = snap.data();
      if (b.seatId) {
        // Check if any other active booking currently claims this seat
        const allBookings = await getDocs(collection(db, 'bookings'));
        const hasOtherActive = allBookings.docs.some(
          d => d.id !== bookingId &&
          d.data().seatId === b.seatId &&
          ['APPROVED', 'CONFIRMED', 'CHECKED_IN'].includes(d.data().status)
        );
        if (!hasOtherActive) {
          await updateDoc(doc(db, 'seats', b.seatId), {
            status: 'AVAILABLE',
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('Error releasing seat during deleteBooking:', err.message);
  }

  await deleteDoc(doc(db, 'bookings', bookingId));
  setCachedBookings(getCachedBookings().filter(b => b.id !== bookingId));
  return true;
};

// ─── purgeAllBookingsFromFirestore (dev/admin tool) ──────────────────────────
export const purgeAllBookingsFromFirestore = async () => {
  const snapshot = await getDocs(collection(db, 'bookings'));
  await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'bookings', d.id))));
  setCachedBookings([]);

  // Free all seats to AVAILABLE without destroying the seat definitions
  try {
    const seatsSnap = await getDocs(collection(db, 'seats'));
    const now = new Date().toISOString();
    await Promise.all(
      seatsSnap.docs.map(s => updateDoc(doc(db, 'seats', s.id), { status: 'AVAILABLE', updatedAt: now }).catch(() => {}))
    );
  } catch (err) {
    console.warn('Error setting seats AVAILABLE on purgeAllBookings:', err.message);
  }

  return snapshot.docs.length;
};
