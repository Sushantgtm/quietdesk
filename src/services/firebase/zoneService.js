import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const INITIAL_ZONES = [
  { 
    id: 'zone_a_left', 
    name: 'Left Quiet Row (Zone A)', 
    shortName: 'Zone A (Left Wall)',
    prefix: 'A',
    cabinRange: 'A1 - A13',
    capacity: 13, 
    pricePerDay: 500, 
    features: ['Power Outlet', 'Reading Lamp', 'Ergonomic Chair'],
    description: 'Quiet individual study desks along the left perimeter wall (Desks A1–A13) with private warm lamps and dual AC sockets.' 
  },
  { 
    id: 'zone_c_center', 
    name: 'Center Focus Row (Zone C)', 
    shortName: 'Zone C (Center Focus)',
    prefix: 'C',
    cabinRange: 'C1 - C24',
    capacity: 24, 
    pricePerDay: 600, 
    features: ['Acoustic Soundproof Spine', 'Power Outlet', 'Reading Lamp', 'Ergonomic Chair'],
    description: 'Central acoustic focus cabins (Desks C1–C24) separated by a central soundproof spine for maximum study concentration.' 
  },
  { 
    id: 'zone_t_wing', 
    name: 'Center T-Wing Section (Zone T)', 
    shortName: 'Zone T (T-Wing)',
    prefix: 'T',
    cabinRange: 'T1 - T4',
    capacity: 4, 
    pricePerDay: 550, 
    features: ['Wide Desk Surface', 'Dual Notebook Space', 'Power Outlet', 'Ergonomic Chair'],
    description: 'Spacious reverse-T wing study stations (Desks T1–T4) at the base of the center column, ideal for multiple open textbooks.' 
  },
  { 
    id: 'zone_b_south', 
    name: 'South Baseline Row (Zone B)', 
    shortName: 'Zone B (South Base)',
    prefix: 'B',
    cabinRange: 'B1 - B6',
    capacity: 6, 
    pricePerDay: 450, 
    features: ['Rapid Entrance Access', 'Power Outlet', 'Reading Lamp'],
    description: 'South baseline open study row (Desks B1–B6) with quick reception access and dedicated reading lighting.' 
  },
  { 
    id: 'zone_r_window', 
    name: 'Right Window Wall (Zone R)', 
    shortName: 'Zone R (Window Wall)',
    prefix: 'R',
    cabinRange: 'R1 - R15',
    capacity: 15, 
    pricePerDay: 700, 
    features: ['Kathmandu Panoramic Window View', 'Natural Daylight', 'Power Outlet', 'Ergonomic Chair'],
    description: 'Premium window view stations (Desks R1–R15) along the floor-to-ceiling glass wall overlooking Kathmandu.' 
  }
];

const LOCAL_STORAGE_ZONES_KEY = 'quietdesk_zones_v2';

export const getLocalZones = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_ZONES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate that it has the floor layout zones
      if (Array.isArray(parsed) && parsed.some(z => z.name.includes('Zone A') || z.id === 'zone_a_left')) {
        return parsed;
      }
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

// Delete all existing zones from Firestore and re-seed with the 5 exact floor plan zones
export const resetAndSeedZonesInFirestore = async () => {
  try {
    const zonesRef = collection(db, 'zones');
    const snapshot = await getDocs(zonesRef);
    
    // Delete all existing zone documents
    for (const d of snapshot.docs) {
      try {
        await deleteDoc(doc(db, 'zones', d.id));
      } catch (delErr) {
        console.warn(`Could not delete zone doc ${d.id}:`, delErr.message);
      }
    }

    // Seed the 5 official floor plan zones
    for (const z of INITIAL_ZONES) {
      await setDoc(doc(db, 'zones', z.id), z, { merge: true });
    }

    saveLocalZones(INITIAL_ZONES);
    console.log('✅ Successfully deleted existing Firestore zones and re-seeded 5 exact floor layout zones.');
    return { success: true, count: INITIAL_ZONES.length };
  } catch (e) {
    console.warn('Unable to reset & seed Firestore zones:', e.message);
    saveLocalZones(INITIAL_ZONES);
    return { success: false, error: e.message };
  }
};

export const seedZonesToFirestore = async () => {
  return await resetAndSeedZonesInFirestore();
};

export const subscribeZones = (onZonesUpdate) => {
  let unsub = () => {};
  try {
    const zonesRef = collection(db, 'zones');
    unsub = onSnapshot(zonesRef, (snapshot) => {
      if (snapshot.empty) {
        resetAndSeedZonesInFirestore().then(() => {
          onZonesUpdate(INITIAL_ZONES);
        });
      } else {
        const firestoreZones = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Check if old legacy zones exist in Firestore (e.g. zone_alpha without (Zone A) naming)
        const hasLegacyZones = firestoreZones.some(z => z.id === 'zone_alpha' && !z.name.includes('Zone A'));
        if (hasLegacyZones) {
          resetAndSeedZonesInFirestore().then(() => {
            onZonesUpdate(INITIAL_ZONES);
          });
        } else {
          saveLocalZones(firestoreZones);
          onZonesUpdate(firestoreZones);
        }
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
