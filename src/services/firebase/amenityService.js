import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const INITIAL_AMENITIES = [
  { id: 'amenity_wifi', iconName: 'Wifi', title: 'Gigabit Fiber Internet', desc: 'Dual-band enterprise Wi-Fi with uninterrupted uptime & battery backup.' },
  { id: 'amenity_power', iconName: 'Zap', title: 'Dedicated Power Outlets', desc: 'Dual AC sockets + USB-C fast charging at every seat.' },
  { id: 'amenity_beverage', iconName: 'Coffee', title: 'Artisanal Beverage Bar', desc: 'Unlimited fresh French press coffee, green tea & filtered spring water.' },
  { id: 'amenity_lockers', iconName: 'Lock', title: 'Private Secure Lockers', desc: 'Keyless digital lockers to safely store your books and laptop.' },
  { id: 'amenity_lighting', iconName: 'Sun', title: 'Natural & Warm Lighting', desc: 'Floor-to-ceiling glass windows and individual warm LED lamps.' },
  { id: 'amenity_print', iconName: 'Printer', title: 'Printing & Scanning', desc: 'High-speed laser printing and document scanning services.' },
  { id: 'amenity_monitors', iconName: 'Monitor', title: 'Monitor Pod Options', desc: 'External 27-inch 4K monitors for programmers and video editors.' },
  { id: 'amenity_backup', iconName: 'ShieldAlert', title: '100% Inverter Backup', desc: 'Kathmandu power cut proof. Automated instant generator backup.' }
];

const LOCAL_STORAGE_AMENITIES_KEY = 'quietdesk_amenities_v1';

export const getLocalAmenities = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_AMENITIES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local amenities', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_AMENITIES_KEY, JSON.stringify(INITIAL_AMENITIES));
  return INITIAL_AMENITIES;
};

export const saveLocalAmenities = (items) => {
  localStorage.setItem(LOCAL_STORAGE_AMENITIES_KEY, JSON.stringify(items));
};

export const seedAmenitiesToFirestore = async () => {
  try {
    for (const item of INITIAL_AMENITIES) {
      await setDoc(doc(db, 'amenities', item.id), item, { merge: true });
    }
    console.log('Successfully seeded amenities to Firestore');
  } catch (e) {
    console.warn('Unable to seed Firestore amenities:', e.message);
  }
};

export const subscribeAmenities = (onAmenitiesUpdate) => {
  let unsub = () => {};
  try {
    const ref = collection(db, 'amenities');
    unsub = onSnapshot(ref, (snapshot) => {
      if (snapshot.empty) {
        seedAmenitiesToFirestore();
        onAmenitiesUpdate(getLocalAmenities());
      } else {
        const firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        saveLocalAmenities(firestoreData);
        onAmenitiesUpdate(firestoreData);
      }
    }, (error) => {
      console.warn('Firestore amenities subscription fallback:', error.message);
      onAmenitiesUpdate(getLocalAmenities());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for amenities:', e);
    onAmenitiesUpdate(getLocalAmenities());
  }

  const handleLocalChange = () => onAmenitiesUpdate(getLocalAmenities());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};
