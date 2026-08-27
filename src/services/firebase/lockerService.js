import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_LOCKERS } from '../mock/mockData';

const LOCAL_STORAGE_LOCKERS_KEY = 'quietdesk_lockers_v3';

export const getLocalLockers = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_LOCKERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local lockers', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_LOCKERS_KEY, JSON.stringify(MOCK_LOCKERS));
  return MOCK_LOCKERS;
};

export const saveLocalLockers = (lockers) => {
  localStorage.setItem(LOCAL_STORAGE_LOCKERS_KEY, JSON.stringify(lockers));
};

export const seedLockersToFirestore = async () => {
  try {
    for (const locker of MOCK_LOCKERS) {
      await setDoc(doc(db, 'lockers', locker.id), locker, { merge: true });
    }
    console.log('Successfully seeded 20 lockers (A-T) to Firestore');
  } catch (e) {
    console.warn('Unable to seed Firestore lockers:', e.message);
  }
};

export const subscribeLockers = (onLockersUpdate) => {
  let unsub = () => {};
  try {
    const lockersRef = collection(db, 'lockers');
    unsub = onSnapshot(lockersRef, (snapshot) => {
      if (snapshot.empty) {
        seedLockersToFirestore();
        onLockersUpdate(getLocalLockers());
      } else {
        const firestoreLockers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        firestoreLockers.sort((a, b) => {
          return (a.lockerNumber || a.label || a.id || '').localeCompare(b.lockerNumber || b.label || b.id || '', undefined, { numeric: true, sensitivity: 'base' });
        });
        saveLocalLockers(firestoreLockers);
        onLockersUpdate(firestoreLockers);
      }
    }, (error) => {
      console.warn('Firestore lockers subscription error, using local fallback:', error.message);
      onLockersUpdate(getLocalLockers());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for lockers:', e);
    onLockersUpdate(getLocalLockers());
  }

  const handleLocalChange = () => onLockersUpdate(getLocalLockers());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const updateLockerStatusInFirestore = async (lockerId, newStatus, details = {}) => {
  const localLockers = getLocalLockers().map(l => 
    l.id === lockerId ? { ...l, status: newStatus, ...details, updatedAt: new Date().toISOString() } : l
  );
  saveLocalLockers(localLockers);

  try {
    const lockerRef = doc(db, 'lockers', lockerId);
    await updateDoc(lockerRef, { status: newStatus, ...details, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn('Updating Firestore locker failed, local fallback used:', error.message);
    return false;
  }
};

export const assignLockerInFirestore = async (lockerId, { userId, userName, userPhone, userEmail, seatNumber, passType, pinCode, notes, startDate, endDate }) => {
  const generatedPin = pinCode || `${Math.floor(1000 + Math.random() * 9000)}`;
  const updatedData = {
    status: 'ASSIGNED',
    assignedToUserId: userId || null,
    assignedToUserName: userName || 'Scholar',
    assignedToUserPhone: userPhone || '',
    assignedToUserEmail: userEmail || '',
    assignedSeatNumber: seatNumber || '',
    passType: passType || 'MONTHLY',
    pinCode: generatedPin,
    notes: notes || '',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    updatedAt: new Date().toISOString()
  };

  // Update local state immediately
  const localLockers = getLocalLockers().map(l => 
    l.id === lockerId ? { ...l, ...updatedData } : l
  );
  saveLocalLockers(localLockers);

  // Write to Firestore — use setDoc merge to handle both existing and missing docs
  try {
    const lockerRef = doc(db, 'lockers', lockerId);
    await setDoc(lockerRef, updatedData, { merge: true });
    console.log(`✅ Locker ${lockerId} assigned to ${userName} in Firestore. PIN: ${generatedPin}`);
    return { success: true, pinCode: generatedPin };
  } catch (error) {
    console.warn('Firestore locker assignment failed, local state updated:', error.message);
    return { success: false, pinCode: generatedPin };
  }
};

export const releaseLockerInFirestore = async (lockerId) => {
  const resetData = {
    status: 'AVAILABLE',
    assignedToUserId: null,
    assignedToUserName: null,
    assignedToUserPhone: null,
    assignedToUserEmail: null,
    assignedSeatNumber: null,
    passType: null,
    pinCode: null,
    notes: '',
    startDate: null,
    endDate: null,
    updatedAt: new Date().toISOString()
  };

  const localLockers = getLocalLockers().map(l => 
    l.id === lockerId ? { ...l, ...resetData } : l
  );
  saveLocalLockers(localLockers);

  try {
    const lockerRef = doc(db, 'lockers', lockerId);
    await setDoc(lockerRef, resetData, { merge: true });
    console.log(`✅ Locker ${lockerId} released in Firestore`);
    return true;
  } catch (error) {
    console.warn('Releasing Firestore locker failed, local fallback used:', error.message);
    return false;
  }
};

export const createLockerInFirestore = async (lockerData) => {
  const newId = lockerData.id || `locker_${Date.now()}`;
  const newLocker = {
    id: newId,
    lockerNumber: lockerData.lockerNumber || `L-${Math.floor(10 + Math.random() * 90)}`,
    label: lockerData.label || lockerData.lockerNumber || 'Locker Unit',
    location: lockerData.location || 'Storage Locker Bank (South Wall)',
    type: lockerData.type || 'DIGITAL_KEYPAD',
    status: lockerData.status || 'AVAILABLE',
    pinCode: lockerData.pinCode || null,
    assignedToUserId: lockerData.assignedToUserId || null,
    assignedToUserName: lockerData.assignedToUserName || null,
    assignedSeatNumber: lockerData.assignedSeatNumber || null,
    passType: lockerData.passType || null,
    createdAt: new Date().toISOString()
  };

  const localLockers = [...getLocalLockers(), newLocker];
  saveLocalLockers(localLockers);

  try {
    const ref = doc(db, 'lockers', newId);
    await setDoc(ref, newLocker, { merge: true });
    return newLocker;
  } catch (error) {
    console.warn('Creating Firestore locker failed, local fallback used:', error.message);
    return newLocker;
  }
};
