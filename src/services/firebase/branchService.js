import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const INITIAL_BRANCH_INFO = {
  id: 'branch_lazimpat',
  name: 'The Quiet Desk - Lazimpat Main Branch',
  city: 'Kathmandu',
  address: 'Lazimpat Road (Near Standard Chartered Bank), Kathmandu 44600',
  phone: '+977 9864826810',
  email: 'lazimpat@quietdesk.np',
  hours: '7:00 AM - 10:00 PM (Seven days a week)',
  totalCapacity: 16,
  acousticPolicy: 'Strict Silence Enforced in Main Study Zones',
  facilities: ['Enterprise Wi-Fi', '24/7 Power Backup', 'Ergonomic Desk Stations']
};

const LOCAL_STORAGE_BRANCH_KEY = 'quietdesk_branch_v1';

export const getLocalBranchInfo = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_BRANCH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local branch info', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_BRANCH_KEY, JSON.stringify(INITIAL_BRANCH_INFO));
  return INITIAL_BRANCH_INFO;
};

export const saveLocalBranchInfo = (info) => {
  localStorage.setItem(LOCAL_STORAGE_BRANCH_KEY, JSON.stringify(info));
};

export const seedBranchToFirestore = async () => {
  try {
    await setDoc(doc(db, 'branches', INITIAL_BRANCH_INFO.id), INITIAL_BRANCH_INFO, { merge: true });
    console.log('Successfully seeded branch info to Firestore');
  } catch (e) {
    console.warn('Unable to seed Firestore branch:', e.message);
  }
};

export const subscribeBranchInfo = (onBranchUpdate) => {
  let unsub = () => {};
  try {
    const ref = collection(db, 'branches');
    unsub = onSnapshot(ref, (snapshot) => {
      if (snapshot.empty) {
        seedBranchToFirestore();
        onBranchUpdate(getLocalBranchInfo());
      } else {
        const branchDoc = snapshot.docs.find(d => d.id === INITIAL_BRANCH_INFO.id) || snapshot.docs[0];
        const data = branchDoc ? { id: branchDoc.id, ...branchDoc.data() } : getLocalBranchInfo();
        saveLocalBranchInfo(data);
        onBranchUpdate(data);
      }
    }, (error) => {
      console.warn('Firestore branch subscription fallback:', error.message);
      onBranchUpdate(getLocalBranchInfo());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for branch:', e);
    onBranchUpdate(getLocalBranchInfo());
  }

  return unsub;
};
