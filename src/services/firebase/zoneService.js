import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export const INITIAL_ZONES = [
  { id: 'zone_alpha', name: 'Quiet Zone Alpha', capacity: 12, pricePerDay: 500, description: 'Strict silence study area equipped with desk lamps and power sockets.' },
  { id: 'zone_window', name: 'Window Nook', capacity: 6, pricePerDay: 700, description: 'Sunlit desks along the floor-to-ceiling glass windows with Kathmandu valley views.' },
  { id: 'zone_pods', name: 'Private Pods', capacity: 4, pricePerDay: 1200, description: 'Acoustically isolated private cabins for intense focus and exam prep.' },
  { id: 'zone_collab', name: 'Collaborative Hub', capacity: 8, pricePerDay: 450, description: 'Open group discussion and team project study tables.' }
];

const LOCAL_STORAGE_ZONES_KEY = 'quietdesk_zones_v1';

export const getLocalZones = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_ZONES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local zones', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_ZONES_KEY, JSON.stringify(INITIAL_ZONES));
  return INITIAL_ZONES;
};

export const saveLocalZones = (zones) => {
  localStorage.setItem(LOCAL_STORAGE_ZONES_KEY, JSON.stringify(zones));
};

export const seedZonesToFirestore = async () => {
  try {
    for (const z of INITIAL_ZONES) {
      await setDoc(doc(db, 'zones', z.id), z, { merge: true });
    }
    console.log('Successfully seeded zones to Firestore');
  } catch (e) {
    console.warn('Unable to seed Firestore zones:', e.message);
  }
};

export const subscribeZones = (onZonesUpdate) => {
  let unsub = () => {};
  try {
    const zonesRef = collection(db, 'zones');
    unsub = onSnapshot(zonesRef, (snapshot) => {
      if (snapshot.empty && !localStorage.getItem(LOCAL_STORAGE_ZONES_KEY)) {
        seedZonesToFirestore();
        onZonesUpdate(getLocalZones());
      } else {
        const firestoreZones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        saveLocalZones(firestoreZones);
        onZonesUpdate(firestoreZones);
      }
    }, (error) => {
      console.warn('Firestore subscription fallback for zones:', error.message);
      onZonesUpdate(getLocalZones());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for zones:', e);
    onZonesUpdate(getLocalZones());
  }

  const handleLocalChange = () => onZonesUpdate(getLocalZones());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const updateZoneInFirestore = async (zoneId, updatedFields) => {
  const localZones = getLocalZones().map(z =>
    z.id === zoneId ? { ...z, ...updatedFields, updatedAt: new Date().toISOString() } : z
  );
  saveLocalZones(localZones);

  try {
    const ref = doc(db, 'zones', zoneId);
    await updateDoc(ref, { ...updatedFields, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn('Updating Firestore zone failed, local fallback used:', error.message);
    return false;
  }
};

export const createZoneInFirestore = async (zoneData) => {
  const newId = zoneData.id || `zone_${Date.now()}`;
  const newZone = {
    id: newId,
    name: zoneData.name || 'New Study Zone',
    capacity: Number(zoneData.capacity) || 10,
    pricePerDay: Number(zoneData.pricePerDay) || 500,
    description: zoneData.description || 'Standard quiet study zone',
    createdAt: new Date().toISOString()
  };

  const localZones = [...getLocalZones(), newZone];
  saveLocalZones(localZones);

  try {
    const ref = doc(db, 'zones', newId);
    await setDoc(ref, newZone, { merge: true });
    return newZone;
  } catch (error) {
    console.warn('Creating Firestore zone failed, local fallback used:', error.message);
    return newZone;
  }
};

export const deleteZoneInFirestore = async (zoneId) => {
  if (!zoneId) return false;
  const stringId = String(zoneId);
  const localZones = getLocalZones().filter(z => String(z.id) !== stringId);
  saveLocalZones(localZones);

  try {
    const ref = doc(db, 'zones', stringId);
    await deleteDoc(ref);
    console.log(`Successfully deleted zone ${stringId} from Firestore`);
    return true;
  } catch (e) {
    console.warn('Firestore delete zone failed, local fallback used:', e.message);
    return true;
  }
};
