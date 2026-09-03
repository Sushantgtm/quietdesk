import { collection, onSnapshot, doc, setDoc, updateDoc, getDocs, getDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const MOCK_USERS = [];

const LOCAL_STORAGE_USERS_KEY = 'quietdesk_users_v6';

// Purge legacy cache keys
try {
  ['v1', 'v2', 'v3', 'v4', 'v5'].forEach(v => {
    localStorage.removeItem(`quietdesk_users_${v}`);
  });
} catch (e) {}

export const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

export const saveLocalUsers = (users) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {}
};

export const resetLocalUsers = () => {
  saveLocalUsers([]);
  return [];
};

// Normalize a raw user doc so name & fullName always agree
const normalizeUser = (raw) => {
  if (!raw) return raw;
  const base = { ...raw };
  base.fullName = base.fullName || base.name || '';
  base.name = base.fullName;
  base.status = base.status || base.membershipStatus || 'ACTIVE';
  base.membershipStatus = base.status;
  return base;
};

export const subscribeUsers = (onUsersUpdate) => {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const firestoreUsers = snapshot.docs.map(d => normalizeUser({ id: d.id, ...d.data() }));
      saveLocalUsers(firestoreUsers);
      onUsersUpdate(firestoreUsers);
    },
    (error) => {
      console.error('Firestore users subscription error:', error.message);
      onUsersUpdate(getLocalUsers().map(normalizeUser));
    }
  );
};

export const createUser = async (userData) => {
  const userId = userData.id || ('usr_' + Date.now());
  const displayName = userData.fullName || userData.name || '';
  const newUser = normalizeUser({
    id: userId,
    createdAt: new Date().toISOString(),
    joinedDate: new Date().toISOString(),
    status: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    passType: 'DAILY',
    ...userData,
    fullName: displayName,
    name: displayName,
  });

  // Write to Firestore as the single source of truth
  await setDoc(doc(db, 'users', userId), newUser);

  // Update local cache
  const currentLocal = getLocalUsers().filter(u => u.id !== userId);
  saveLocalUsers([newUser, ...currentLocal]);

  return newUser;
};

export const updateUser = async (userId, updatedFields) => {
  if (!userId) throw new Error('User ID is required to update student');

  if (updatedFields.fullName && !updatedFields.name) updatedFields.name = updatedFields.fullName;
  if (updatedFields.name && !updatedFields.fullName) updatedFields.fullName = updatedFields.name;
  if (updatedFields.status && !updatedFields.membershipStatus) updatedFields.membershipStatus = updatedFields.status;
  if (updatedFields.membershipStatus && !updatedFields.status) updatedFields.status = updatedFields.membershipStatus;

  const fieldsToUpdate = { ...updatedFields, updatedAt: new Date().toISOString() };

  // Write directly to Firestore
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, fieldsToUpdate);

  // Update local cache
  const currentLocal = getLocalUsers();
  const updatedLocal = currentLocal.map(u => u.id === userId ? normalizeUser({ ...u, ...fieldsToUpdate }) : u);
  saveLocalUsers(updatedLocal);

  return true;
};

// Query Firestore directly to find an existing student by phone or email
export const findOrCreateStudentFirestore = async (studentData) => {
  const phoneClean = (studentData.phone || '').trim().replace(/\D/g, '');
  const emailClean = (studentData.email || '').trim().toLowerCase();

  let existingUser = null;

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    for (const docSnap of snapshot.docs) {
      const u = docSnap.data();
      const uPhone = (u.phone || '').trim().replace(/\D/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();

      if ((phoneClean && uPhone && phoneClean === uPhone) ||
          (emailClean && uEmail && emailClean === uEmail)) {
        existingUser = normalizeUser({ id: docSnap.id, ...u });
        break;
      }
    }
  } catch (err) {
    console.warn('Direct Firestore student query failed, checking cached users:', err.message);
    const users = getLocalUsers();
    existingUser = users.find(u => {
      const uPhone = (u.phone || '').trim().replace(/\D/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      return (phoneClean && uPhone && phoneClean === uPhone) ||
             (emailClean && uEmail && emailClean === uEmail);
    });
  }

  if (existingUser) {
    const updated = {
      ...existingUser,
      ...studentData,
      id: existingUser.id,
      userCode: existingUser.userCode || `QD-STU-${Math.floor(1000 + Math.random() * 9000)}`,
      updatedAt: new Date().toISOString()
    };
    await updateUser(existingUser.id, updated);
    return { user: updated, isNew: false };
  } else {
    const userCode = `QD-STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await createUser({
      ...studentData,
      userCode,
      status: studentData.status || 'ACTIVE',
      membershipStatus: studentData.membershipStatus || 'ACTIVE',
      joinedDate: studentData.joinedDate || new Date().toISOString()
    });
    return { user: created, isNew: true };
  }
};

export const findOrCreateStudent = findOrCreateStudentFirestore;

export const deleteUser = async (userId) => {
  if (!userId) return false;

  try {
    // 1. Release all active bookings, seats, and lockers for this student
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const now = new Date().toISOString();

    for (const bDoc of bookingsSnap.docs) {
      const b = bDoc.data();
      if (b.userId === userId) {
        // Cancel the booking
        await updateDoc(doc(db, 'bookings', bDoc.id), {
          status: 'CANCELLED',
          updatedAt: now
        }).catch(() => {});

        // Free linked seat
        if (b.seatId) {
          await updateDoc(doc(db, 'seats', b.seatId), {
            status: 'AVAILABLE',
            updatedAt: now
          }).catch(() => {});
        }
      }
    }

    // Check if user has directly linked seatId/assignedSeat
    const userDocSnap = await getDocs(collection(db, 'users'));
    const targetUserDoc = userDocSnap.docs.find(d => d.id === userId);
    if (targetUserDoc) {
      const uData = targetUserDoc.data();
      if (uData.seatId) {
        await updateDoc(doc(db, 'seats', uData.seatId), {
          status: 'AVAILABLE',
          updatedAt: now
        }).catch(() => {});
      }
    }

    // Release lockers
    const lockersSnap = await getDocs(collection(db, 'lockers'));
    for (const lDoc of lockersSnap.docs) {
      const l = lDoc.data();
      if (l.currentStudent === userId || l.studentId === userId) {
        await updateDoc(doc(db, 'lockers', lDoc.id), {
          status: 'AVAILABLE',
          isOccupied: false,
          currentStudent: null,
          currentStudentName: '',
          updatedAt: now
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Error releasing bookings/seats for user:', err.message);
  }

  // 2. Delete user doc
  await deleteDoc(doc(db, 'users', userId));
  const currentLocal = getLocalUsers().filter(u => u.id !== userId);
  saveLocalUsers(currentLocal);
  return true;
};

export const purgeAllUsersFromFirestore = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  const deletes = snapshot.docs.map(d => deleteDoc(doc(db, 'users', d.id)));
  await Promise.all(deletes);
  saveLocalUsers([]);

  // Free seats to AVAILABLE (without deleting seat definitions)
  try {
    const seatsSnap = await getDocs(collection(db, 'seats'));
    const now = new Date().toISOString();
    await Promise.all(
      seatsSnap.docs.map(s => updateDoc(doc(db, 'seats', s.id), { status: 'AVAILABLE', updatedAt: now }).catch(() => {}))
    );
  } catch (e) {
    console.warn('Error setting seats available on purge:', e.message);
  }

  return snapshot.docs.length;
};

