import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_SEATS } from '../mock/mockData';

const LOCAL_STORAGE_SEATS_KEY = 'quietdesk_seats_v1';

export const getLocalSeats = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_SEATS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local seats', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_SEATS_KEY, JSON.stringify(MOCK_SEATS));
  return MOCK_SEATS;
};

export const saveLocalSeats = (seats) => {
  localStorage.setItem(LOCAL_STORAGE_SEATS_KEY, JSON.stringify(seats));
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
  let unsub = () => {};
  try {
    const seatsRef = collection(db, 'seats');
    unsub = onSnapshot(seatsRef, (snapshot) => {
      if (snapshot.empty && !localStorage.getItem(LOCAL_STORAGE_SEATS_KEY)) {
        seedSeatsToFirestore();
        onSeatsUpdate(getLocalSeats());
      } else {
        const firestoreSeats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        firestoreSeats.sort((a, b) => parseInt(a.seatNumber || 0) - parseInt(b.seatNumber || 0));
        saveLocalSeats(firestoreSeats);
        onSeatsUpdate(firestoreSeats);
      }
    }, (error) => {
      console.warn('Firestore subscription fallback to local state:', error.message);
      onSeatsUpdate(getLocalSeats());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for seats:', e);
    onSeatsUpdate(getLocalSeats());
  }

  const handleLocalChange = () => onSeatsUpdate(getLocalSeats());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const updateSeatStatusInFirestore = async (seatId, newStatus) => {
  const localSeats = getLocalSeats().map(seat => 
    seat.id === seatId ? { ...seat, status: newStatus } : seat
  );
  saveLocalSeats(localSeats);

  try {
    const seatRef = doc(db, 'seats', seatId);
    await updateDoc(seatRef, { status: newStatus, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn('Updating Firestore seat failed, local fallback used:', error.message);
    return false;
  }
};

export const updateSeatDetailsInFirestore = async (seatId, updatedFields) => {
  const localSeats = getLocalSeats().map(seat => 
    seat.id === seatId ? { ...seat, ...updatedFields, updatedAt: new Date().toISOString() } : seat
  );
  saveLocalSeats(localSeats);

  try {
    const seatRef = doc(db, 'seats', seatId);
    await updateDoc(seatRef, { ...updatedFields, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn('Updating Firestore seat details failed, local fallback used:', error.message);
    return false;
  }
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

  const localSeats = [...getLocalSeats(), newSeat];
  saveLocalSeats(localSeats);

  try {
    const seatRef = doc(db, 'seats', newId);
    await setDoc(seatRef, newSeat, { merge: true });
    return newSeat;
  } catch (error) {
    console.warn('Creating Firestore seat failed, local fallback used:', error.message);
    return newSeat;
  }
};

export const deleteSeatInFirestore = async (seatId) => {
  if (!seatId) return false;
  const stringId = String(seatId);
  const localSeats = getLocalSeats().filter(seat => String(seat.id) !== stringId);
  saveLocalSeats(localSeats);

  try {
    const seatRef = doc(db, 'seats', stringId);
    await deleteDoc(seatRef);
    console.log(`Successfully deleted seat ${stringId} from Firestore`);
    return true;
  } catch (error) {
    console.warn('Deleting Firestore seat failed, local fallback used:', error.message);
    return true;
  }
};

