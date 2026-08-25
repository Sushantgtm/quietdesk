import { collection, onSnapshot, doc, setDoc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const MOCK_USERS = [
  {
    id: 'usr_101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+977 9841234567',
    address: 'Lazimpat, Kathmandu',
    emergencyContact: 'Sunil Sharma (+977 9841112233)',
    passType: 'DAILY',
    status: 'ACTIVE',
    createdAt: '2026-08-10T10:00:00Z',
    notes: 'Standard Desk Scholar. Preparing for Civil Service Exam.',
    idProof: 'Citizenship #48910293'
  },
  {
    id: 'usr_102',
    name: 'Pooja Shrestha',
    email: 'pooja.s@example.com',
    phone: '+977 9851098765',
    address: 'Jhamsikhel, Lalitpur',
    emergencyContact: 'Ramesh Shrestha (+977 9851998877)',
    passType: 'WEEKLY',
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:30:00Z',
    notes: 'Prefers Window Nook seats (B Zone). High Wi-Fi usage.',
    idProof: 'Passport #N0982314'
  },
  {
    id: 'usr_103',
    name: 'Rohan Thapa',
    email: 'rohan.t@example.com',
    phone: '+977 9801122334',
    address: 'Baluwatar, Kathmandu',
    emergencyContact: 'Gita Thapa (+977 9801998877)',
    passType: 'DAILY',
    status: 'ACTIVE',
    createdAt: '2026-08-15T14:20:00Z',
    notes: 'Engineering Student, IOE Pulchowk.',
    idProof: 'College ID #2024-ENG-08'
  },
  {
    id: 'usr_104',
    name: 'Sneha Gurung',
    email: 'sneha.g@example.com',
    phone: '+977 9812345678',
    address: 'Lazimpat Height, Kathmandu',
    emergencyContact: 'Bikram Gurung (+977 9812998877)',
    passType: 'MONTHLY',
    status: 'ACTIVE',
    createdAt: '2026-07-20T11:00:00Z',
    notes: 'Remote Software Developer. Needs Private Cabin & Locker.',
    idProof: 'National ID #778210923'
  },
  {
    id: 'usr_105',
    name: 'Kiran Adhikari',
    email: 'kiran.a@example.com',
    phone: '+977 9849988776',
    address: 'Suryabinayak, Bhaktapur',
    emergencyContact: 'Niranjan Adhikari (+977 9849112233)',
    passType: 'DAILY',
    status: 'INACTIVE',
    createdAt: '2026-08-12T08:15:00Z',
    notes: 'Medical entrance candidate.',
    idProof: 'Citizenship #12093847'
  },
  {
    id: 'usr_106',
    name: 'Bina Maharjan',
    email: 'bina.m@example.com',
    phone: '+977 9860112233',
    address: 'Thamel, Kathmandu',
    emergencyContact: 'Prakash Maharjan (+977 9860998877)',
    passType: 'WEEKLY',
    status: 'ACTIVE',
    createdAt: '2026-08-18T16:45:00Z',
    notes: 'Research Fellow, T.U.',
    idProof: 'Faculty Card #TU-9821'
  }
];

const LOCAL_STORAGE_USERS_KEY = 'quietdesk_users_v1';

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

export const subscribeUsers = (onUsersUpdate) => {
  let unsub = () => {};
  try {
    const usersRef = collection(db, 'users');
    unsub = onSnapshot(usersRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        saveLocalUsers(firestoreUsers);
        onUsersUpdate(firestoreUsers);
      } else {
        onUsersUpdate(getLocalUsers());
      }
    }, (error) => {
      console.warn('Firestore users subscription fallback:', error.message);
      onUsersUpdate(getLocalUsers());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for users:', e);
    onUsersUpdate(getLocalUsers());
  }

  const handleLocalChange = () => onUsersUpdate(getLocalUsers());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const createUser = async (userData) => {
  const userId = 'usr_' + Date.now();
  const newUser = {
    id: userId,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    passType: 'DAILY',
    ...userData
  };

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
  const currentLocal = getLocalUsers();
  const updatedLocal = currentLocal.map(u => u.id === userId ? { ...u, ...updatedFields } : u);
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
