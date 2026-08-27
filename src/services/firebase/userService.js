import { collection, onSnapshot, doc, setDoc, updateDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export const MOCK_USERS = [];

const LOCAL_STORAGE_USERS_KEY = 'quietdesk_users_v5';

// Automatically purge legacy cache keys on initial load
try {
  ['v1', 'v2', 'v3', 'v4'].forEach(v => {
    localStorage.removeItem(`quietdesk_users_${v}`);
    localStorage.removeItem(`quietdesk_bookings_${v}`);
  });
} catch (e) {}

export const getLocalUsers = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local users', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(MOCK_USERS));
  return MOCK_USERS;
};

export const saveLocalUsers = (users) => {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
};

export const resetLocalUsers = () => {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(MOCK_USERS));
  return MOCK_USERS;
};

// Normalize a raw user doc so name & fullName always agree
const normalizeUser = (raw) => {
  const base = { ...raw };
  // Ensure both fields exist
  base.fullName = base.fullName || base.name || '';
  base.name = base.fullName;
  // Ensure status field exists
  base.status = base.status || base.membershipStatus || 'ACTIVE';
  base.membershipStatus = base.status;
  return base;
};

export const subscribeUsers = (onUsersUpdate) => {
  let unsub = () => {};
  try {
    const usersRef = collection(db, 'users');
    unsub = onSnapshot(usersRef, (snapshot) => {
      const firestoreUsers = snapshot.docs.map(d => normalizeUser({ id: d.id, ...d.data() }));
      saveLocalUsers(firestoreUsers);
      onUsersUpdate(firestoreUsers);
    }, (error) => {
      console.warn('Firestore users subscription error, using local fallback:', error.message);
      onUsersUpdate(getLocalUsers().map(normalizeUser));
    });
  } catch (e) {
    console.warn('Firestore offline fallback for users:', e);
    onUsersUpdate(getLocalUsers().map(normalizeUser));
  }

  const handleLocalChange = () => onUsersUpdate(getLocalUsers().map(normalizeUser));
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const createUser = async (userData) => {
  const userId = 'usr_' + Date.now();
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

  const currentLocal = getLocalUsers();
  const updatedLocal = [newUser, ...currentLocal];
  saveLocalUsers(updatedLocal);

  try {
    await setDoc(doc(db, 'users', userId), newUser);
    console.log('User registered in Firestore:', userId);
    return newUser;
  } catch (e) {
    console.warn('Firestore user registration fallback to local:', e.message);
    return newUser;
  }
};

export const updateUser = async (userId, updatedFields) => {
  // Keep name & fullName in sync if either is updated
  if (updatedFields.fullName && !updatedFields.name) updatedFields.name = updatedFields.fullName;
  if (updatedFields.name && !updatedFields.fullName) updatedFields.fullName = updatedFields.name;
  if (updatedFields.status && !updatedFields.membershipStatus) updatedFields.membershipStatus = updatedFields.status;
  if (updatedFields.membershipStatus && !updatedFields.status) updatedFields.status = updatedFields.membershipStatus;

  const currentLocal = getLocalUsers();
  const updatedLocal = currentLocal.map(u => u.id === userId ? normalizeUser({ ...u, ...updatedFields }) : u);
  saveLocalUsers(updatedLocal);

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { ...updatedFields, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.warn('Firestore user update fallback to local:', e.message);
    return false;
  }
};

export const findOrCreateStudent = async (studentData) => {
  const users = getLocalUsers();
  const phoneClean = (studentData.phone || '').trim().replace(/\D/g, '');
  const emailClean = (studentData.email || '').trim().toLowerCase();

  let existing = users.find(u => {
    const uPhone = (u.phone || '').trim().replace(/\D/g, '');
    const uEmail = (u.email || '').trim().toLowerCase();
    return (phoneClean && uPhone && phoneClean === uPhone) ||
           (emailClean && uEmail && emailClean === uEmail);
  });

  if (existing) {
    const updated = {
      ...existing,
      ...studentData,
      id: existing.id,
      userCode: existing.userCode || `QD-STU-${Math.floor(1000 + Math.random() * 9000)}`,
      updatedAt: new Date().toISOString()
    };
    await updateUser(existing.id, updated);
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

export const deleteUser = async (userId) => {
  const currentLocal = getLocalUsers();
  const updated = currentLocal.filter(u => u.id !== userId);
  saveLocalUsers(updated);
  try {
    await deleteDoc(doc(db, 'users', userId));
    console.log('User deleted from Firestore:', userId);
    return true;
  } catch (e) {
    console.warn('Firestore user delete error:', e.message);
    return false;
  }
};

export const purgeAllUsersFromFirestore = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  const deletes = snapshot.docs.map(d => deleteDoc(doc(db, 'users', d.id)));
  await Promise.all(deletes);
  saveLocalUsers([]);
  console.log(`Purged ${snapshot.docs.length} users from Firestore.`);
  return snapshot.docs.length;
};
