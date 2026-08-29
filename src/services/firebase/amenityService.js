import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export const INITIAL_AMENITIES = [
  { id: 'amenity_ac', iconName: 'Wind', title: 'AC Available', desc: 'Fully air-conditioned and climate-controlled rooms for year-round focus.' },
  { id: 'amenity_chair', iconName: 'Armchair', title: 'Comfortable Chairs', desc: 'High-comfort ergonomic chairs designed for long hours of fatigue-free study.' },
  { id: 'amenity_power', iconName: 'Zap', title: 'Charging Plug in Each Seat', desc: 'Dedicated dual power outlets at every desk for your laptops and devices.' },
  { id: 'amenity_lockers', iconName: 'Key', title: 'Private Key Lockers', desc: 'Physical key-operated secure lockers to safely store your books and belongings.' },
  { id: 'amenity_wifi', iconName: 'Wifi', title: 'Gigabit Fiber Internet', desc: 'Dual-band enterprise Wi-Fi with uninterrupted uptime & speed.' },
  { id: 'amenity_backup', iconName: 'ShieldAlert', title: '100% Inverter Backup', desc: 'Kathmandu power cut proof. Automated instant generator and inverter backup.' }
];

const LOCAL_STORAGE_AMENITIES_KEY = 'quietdesk_amenities_v2';

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

export const createAmenityInFirestore = async (amenityData) => {
  const id = amenityData.id || `amenity_${Date.now()}`;
  const newAmenity = { ...amenityData, id };

  const currentLocal = getLocalAmenities();
  const updatedLocal = [...currentLocal, newAmenity];
  saveLocalAmenities(updatedLocal);

  try {
    await setDoc(doc(db, 'amenities', id), newAmenity, { merge: true });
    return newAmenity;
  } catch (e) {
    console.warn('Firestore createAmenity fallback to local:', e.message);
    return newAmenity;
  }
};

export const updateAmenityInFirestore = async (id, updatedFields) => {
  const currentLocal = getLocalAmenities();
  const updatedLocal = currentLocal.map(a => a.id === id ? { ...a, ...updatedFields } : a);
  saveLocalAmenities(updatedLocal);

  try {
    const ref = doc(db, 'amenities', id);
    await updateDoc(ref, { ...updatedFields, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.warn('Firestore updateAmenity fallback to local:', e.message);
    return false;
  }
};

export const deleteAmenityFromFirestore = async (id) => {
  const currentLocal = getLocalAmenities();
  const updatedLocal = currentLocal.filter(a => a.id !== id);
  saveLocalAmenities(updatedLocal);

  try {
    const ref = doc(db, 'amenities', id);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.warn('Firestore deleteAmenity fallback to local:', e.message);
    return false;
  }
};

