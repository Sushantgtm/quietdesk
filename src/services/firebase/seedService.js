import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_USERS } from './userService';
import { MOCK_SEATS, MOCK_LOCKERS, MOCK_BOOKINGS, ACCESS_PLANS } from '../mock/mockData';
import { INITIAL_ZONES, resetAndSeedZonesInFirestore } from './zoneService';

export const MOCK_SEATS_DATA = MOCK_SEATS;
export const MOCK_LOCKERS_DATA = MOCK_LOCKERS;
export const MOCK_BOOKINGS_DATA = MOCK_BOOKINGS;
export const MOCK_PLANS_DATA = ACCESS_PLANS;

export const MOCK_ADMINS_DATA = [
  {
    id: 'admin_lazimpat_01',
    uid: 'admin_lazimpat_01',
    email: 'admin@quietdesk.np',
    displayName: 'Branch Manager (Lazimpat)',
    role: 'Branch Manager',
    branch: 'Lazimpat Branch',
    lastLogin: new Date().toISOString()
  }
];

export const MOCK_AMENITIES_DATA = [
  { id: 'amenity_wifi', iconName: 'Wifi', title: 'Gigabit Fiber Internet', desc: 'Dual-band enterprise Wi-Fi with uninterrupted uptime & battery backup.' },
  { id: 'amenity_power', iconName: 'Zap', title: 'Dedicated Power Outlets', desc: 'Dual AC sockets + USB-C fast charging at every seat.' },
  { id: 'amenity_beverage', iconName: 'Coffee', title: 'Artisanal Beverage Bar', desc: 'Unlimited fresh French press coffee, green tea & filtered spring water.' },
  { id: 'amenity_lockers', iconName: 'Lock', title: 'Private Secure Lockers', desc: '20 Keyless digital lockers to safely store your books and laptop.' },
  { id: 'amenity_lighting', iconName: 'Sun', title: 'Natural & Warm Lighting', desc: 'Floor-to-ceiling glass windows and individual warm LED lamps.' },
  { id: 'amenity_print', iconName: 'Printer', title: 'Printing & Scanning', desc: 'High-speed laser printing and document scanning services.' },
  { id: 'amenity_monitors', iconName: 'Monitor', title: 'Monitor Pod Options', desc: 'External 27-inch 4K monitors for programmers and video editors.' },
  { id: 'amenity_backup', iconName: 'ShieldAlert', title: '100% Inverter Backup', desc: 'Kathmandu power cut proof. Automated instant generator backup.' }
];

export const MOCK_BRANCHES_DATA = [
  {
    id: 'branch_lazimpat',
    name: 'The Quiet Desk - Lazimpat Main Branch',
    city: 'Kathmandu',
    address: 'Lazimpat Road (Near Standard Chartered Bank), Kathmandu 44600',
    phone: '+977 9841234567',
    email: 'lazimpat@quietdesk.np',
    hours: '7:00 AM - 10:00 PM (Seven days a week)',
    totalCapacity: 62,
    acousticPolicy: 'Strict Silence Enforced in Main Study Zones',
    facilities: ['Enterprise Wi-Fi', 'Artisanal Coffee Bar', '24/7 Power Backup', 'Ergonomic Desk Stations', '20 Digital Lockers']
  }
];

export const seedAllCollectionsToFirestore = async () => {
  const summary = { seats: 0, lockers: 0, zones: 0, bookings: 0, plans: 0, admins: 0, amenities: 0, branches: 0, users: 0 };

  try {
    // 1. Delete legacy zones from Firestore and re-seed the 5 official floor plan zones
    const zoneResetResult = await resetAndSeedZonesInFirestore();
    summary.zones = zoneResetResult.count || INITIAL_ZONES.length;

    // 2. Seed 62 Seats matching exact 5 floor layout zones
    for (const seat of MOCK_SEATS_DATA) {
      await setDoc(doc(db, 'seats', seat.id), seat, { merge: true });
      summary.seats++;
    }

    // 3. Seed 20 Lockers
    for (const locker of MOCK_LOCKERS_DATA) {
      await setDoc(doc(db, 'lockers', locker.id), locker, { merge: true });
      summary.lockers++;
    }

    // 4. Seed Bookings
    for (const booking of MOCK_BOOKINGS_DATA) {
      await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
      summary.bookings++;
    }

    // 5. Seed Plans
    for (const plan of MOCK_PLANS_DATA) {
      await setDoc(doc(db, 'plans', plan.id), plan, { merge: true });
      summary.plans++;
    }

    // 6. Seed Admins
    for (const admin of MOCK_ADMINS_DATA) {
      await setDoc(doc(db, 'admins', admin.id), admin, { merge: true });
      summary.admins++;
    }

    // 7. Seed Amenities
    for (const amenity of MOCK_AMENITIES_DATA) {
      await setDoc(doc(db, 'amenities', amenity.id), amenity, { merge: true });
      summary.amenities++;
    }

    // 8. Seed Branches
    for (const branch of MOCK_BRANCHES_DATA) {
      await setDoc(doc(db, 'branches', branch.id), branch, { merge: true });
      summary.branches++;
    }

    // 9. Seed Users
    for (const user of MOCK_USERS) {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
      summary.users++;
    }

    console.log('✅ Successfully deleted existing legacy zones and seeded all collections to Firestore:', summary);
    return { success: true, summary };
  } catch (error) {
    console.error('❌ Error seeding collections to Firestore:', error);
    return { success: false, error: error.message };
  }
};
