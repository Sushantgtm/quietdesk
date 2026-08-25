/**
 * One-shot Firebase seed script
 * Run: node seed-firebase.mjs
 *
 * Seeds all Firestore collections with the exact floor layout data:
 *   - 5 Study Zones (matching architectural floor plan)
 *   - 62 Seats across 5 zones (A1-A13, C1-C24, T1-T4, B1-B6, R1-R15)
 *   - 20 Digital Lockers (L-01 to L-20)
 *   - 6 Sample Users
 *   - Access Plans, Amenities, Branch Info, Admins
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPJ2pzg4zTmCPfgoOycCgA70HrOBC7F4w",
  authDomain: "thequietdesk-63f05.firebaseapp.com",
  projectId: "thequietdesk-63f05",
  storageBucket: "thequietdesk-63f05.firebasestorage.app",
  messagingSenderId: "780957484603",
  appId: "1:780957484603:web:be108adb8e2731fca0fe1e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── HELPER: delete all docs in a collection ───
async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  if (snap.empty) return 0;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`  🗑  Cleared ${snap.size} existing docs from '${name}'`);
  return snap.size;
}

// ─── 1. ZONES ───
const ZONES = [
  { id: 'zone_a_left',   name: 'Left Quiet Row (Zone A)',        shortName: 'Zone A (Left Wall)',     prefix: 'A', cabinRange: 'A1 - A13', capacity: 13, pricePerDay: 500, features: ['Power Outlet', 'Reading Lamp', 'Ergonomic Chair'],           description: 'Quiet individual study desks along the left perimeter wall (A1–A13) with private warm lamps and dual AC sockets.' },
  { id: 'zone_c_center', name: 'Center Focus Row (Zone C)',       shortName: 'Zone C (Center Focus)',  prefix: 'C', cabinRange: 'C1 - C24', capacity: 24, pricePerDay: 600, features: ['Acoustic Soundproof Spine', 'Power Outlet', 'Reading Lamp', 'Ergonomic Chair'], description: 'Central acoustic focus cabins (C1–C24) separated by a soundproof spine for maximum concentration.' },
  { id: 'zone_t_wing',   name: 'Center T-Wing Section (Zone T)', shortName: 'Zone T (T-Wing)',        prefix: 'T', cabinRange: 'T1 - T4',  capacity: 4,  pricePerDay: 550, features: ['Wide Desk Surface', 'Dual Notebook Space', 'Power Outlet', 'Ergonomic Chair'], description: 'Spacious reverse-T wing stations (T1–T4) at the base of the center column, ideal for multiple textbooks.' },
  { id: 'zone_b_south',  name: 'South Baseline Row (Zone B)',    shortName: 'Zone B (South Base)',    prefix: 'B', cabinRange: 'B1 - B6',  capacity: 6,  pricePerDay: 450, features: ['Rapid Entrance Access', 'Power Outlet', 'Reading Lamp'],                        description: 'South baseline open study row (B1–B6) with quick reception access and dedicated reading lighting.' },
  { id: 'zone_r_window', name: 'Right Window Wall (Zone R)',      shortName: 'Zone R (Window Wall)',   prefix: 'R', cabinRange: 'R1 - R15', capacity: 15, pricePerDay: 700, features: ['Kathmandu Panoramic Window View', 'Natural Daylight', 'Power Outlet', 'Ergonomic Chair'], description: 'Premium window view stations (R1–R15) along the floor-to-ceiling glass wall overlooking Kathmandu.' },
];

// ─── 2. SEATS (62 total) ───
const SEATS = [
  // Zone A: Left Quiet Row (A1-A13) — NPR 500/day
  ...Array.from({length: 13}, (_, i) => {
    const n = i + 1;
    const statusMap = {2:'OCCUPIED', 7:'OCCUPIED', 4:'RESERVED'};
    return { id: `seat_A${n}`, seatNumber: `A${n}`, zone: 'Left Quiet Row (Zone A)', type: 'STANDARD', status: statusMap[n] || 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp', 'Ergonomic Chair'] };
  }),
  // Zone C: Center Focus Row (C1-C24) — NPR 600/day
  ...Array.from({length: 24}, (_, i) => {
    const n = i + 1;
    const statusMap = {2:'OCCUPIED', 14:'RESERVED'};
    return { id: `seat_C${n}`, seatNumber: `C${n}`, zone: 'Center Focus Row (Zone C)', type: 'PRIVATE_CABIN', status: statusMap[n] || 'AVAILABLE', pricePerDay: 600, amenities: ['Acoustic Partition', 'Power Outlet', 'Reading Lamp', 'Ergonomic Chair'] };
  }),
  // Zone T: Center T-Wing Section (T1-T4) — NPR 550/day
  ...Array.from({length: 4}, (_, i) => ({
    id: `seat_T${i+1}`, seatNumber: `T${i+1}`, zone: 'Center T-Wing Section (Zone T)', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 550, amenities: ['Power Outlet', 'Wide Desk', 'Ergonomic Chair']
  })),
  // Zone B: South Baseline Row (B1-B6) — NPR 450/day
  ...Array.from({length: 6}, (_, i) => {
    const n = i + 1;
    return { id: `seat_B${n}`, seatNumber: `B${n}`, zone: 'South Baseline Row (Zone B)', type: 'STANDARD', status: n===2 ? 'OCCUPIED' : 'AVAILABLE', pricePerDay: 450, amenities: ['Power Outlet', 'Reading Lamp'] };
  }),
  // Zone R: Right Window Wall (R1-R15) — NPR 700/day
  ...Array.from({length: 15}, (_, i) => ({
    id: `seat_R${i+1}`, seatNumber: `R${i+1}`, zone: 'Right Window Wall (Zone R)', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet', 'Ergonomic Chair']
  })),
];

// ─── 3. LOCKERS (20 total) ───
const LOCKERS = Array.from({length: 20}, (_, idx) => {
  const num = idx + 1;
  const numStr = num < 10 ? `0${num}` : `${num}`;
  const base = { id: `locker_${numStr}`, lockerNumber: `L-${numStr}`, label: `Locker ${numStr}`, location: `South Storage Bank (Unit ${num})`, type: 'DIGITAL_KEYPAD', status: 'AVAILABLE', pinCode: null, assignedToUserId: null, assignedToUserName: null, assignedToUserPhone: null, assignedSeatNumber: null, passType: null, notes: '' };
  if (num === 1) return { ...base, status: 'ASSIGNED', pinCode: '4821', assignedToUserId: 'usr_104', assignedToUserName: 'Sneha Gurung', assignedToUserPhone: '+977 9812345678', assignedSeatNumber: 'C14', passType: 'MONTHLY' };
  if (num === 2) return { ...base, status: 'ASSIGNED', pinCode: '7743', assignedToUserId: 'usr_102', assignedToUserName: 'Pooja Shrestha', assignedToUserPhone: '+977 9851098765', assignedSeatNumber: 'R5',  passType: 'WEEKLY' };
  if (num === 5) return { ...base, status: 'MAINTENANCE', notes: 'Digital keypad faulty – repair scheduled' };
  return base;
});

// ─── 4. USERS ───
const USERS = [
  { id: 'usr_101', name: 'Aarav Sharma',   email: 'aarav.sharma@example.com',  phone: '+977 9841234567', address: 'Lazimpat, Kathmandu',         emergencyContact: 'Sunil Sharma (+977 9841112233)',    passType: 'DAILY',   status: 'ACTIVE',   createdAt: '2026-08-10T10:00:00Z', notes: 'Standard Desk Scholar. Civil Service exam prep.', idProof: 'Citizenship #48910293', userCode: 'QD-STU-1001' },
  { id: 'usr_102', name: 'Pooja Shrestha', email: 'pooja.s@example.com',        phone: '+977 9851098765', address: 'Jhamsikhel, Lalitpur',        emergencyContact: 'Ramesh Shrestha (+977 9851998877)', passType: 'WEEKLY',  status: 'ACTIVE',   createdAt: '2026-08-01T09:30:00Z', notes: 'Prefers Window Wall (R Zone). High Wi-Fi usage.', idProof: 'Passport #N0982314',   userCode: 'QD-STU-1002' },
  { id: 'usr_103', name: 'Rohan Thapa',    email: 'rohan.t@example.com',        phone: '+977 9801122334', address: 'Baluwatar, Kathmandu',        emergencyContact: 'Gita Thapa (+977 9801998877)',       passType: 'DAILY',   status: 'ACTIVE',   createdAt: '2026-08-15T14:20:00Z', notes: 'Engineering Student, IOE Pulchowk.',             idProof: 'College ID #2024-ENG-08', userCode: 'QD-STU-1003' },
  { id: 'usr_104', name: 'Sneha Gurung',   email: 'sneha.g@example.com',        phone: '+977 9812345678', address: 'Lazimpat Height, Kathmandu', emergencyContact: 'Bikram Gurung (+977 9812998877)',    passType: 'MONTHLY', status: 'ACTIVE',   createdAt: '2026-07-20T11:00:00Z', notes: 'Remote Developer. Needs Cabin & Locker.',        idProof: 'National ID #778210923', userCode: 'QD-STU-1004' },
  { id: 'usr_105', name: 'Kiran Adhikari', email: 'kiran.a@example.com',        phone: '+977 9849988776', address: 'Suryabinayak, Bhaktapur',    emergencyContact: 'Niranjan Adhikari (+977 9849112233)',passType: 'DAILY',   status: 'INACTIVE', createdAt: '2026-08-12T08:15:00Z', notes: 'Medical entrance candidate.',                    idProof: 'Citizenship #12093847',  userCode: 'QD-STU-1005' },
  { id: 'usr_106', name: 'Bina Maharjan',  email: 'bina.m@example.com',         phone: '+977 9860112233', address: 'Thamel, Kathmandu',           emergencyContact: 'Prakash Maharjan (+977 9860998877)', passType: 'WEEKLY',  status: 'ACTIVE',   createdAt: '2026-08-18T16:45:00Z', notes: 'Research Fellow, T.U.',                          idProof: 'Faculty Card #TU-9821',  userCode: 'QD-STU-1006' },
];

// ─── 5. BOOKINGS ───
const BOOKINGS = [
  { id: 'BK-001', bookingCode: 'QD-4821', userId: 'usr_104', userName: 'Sneha Gurung', userEmail: 'sneha.g@example.com', userPhone: '+977 9812345678', seatId: 'seat_C14', seatNumber: 'C14', zone: 'Center Focus Row (Zone C)', passType: 'MONTHLY', status: 'CONFIRMED', paymentStatus: 'PAID',    hasLocker: true, lockerNumber: 'L-01', totalAmount: 8500, createdAt: '2026-08-01T09:00:00Z', confirmedAt: '2026-08-01T09:05:00Z', checkIn: '2026-08-01', checkOut: '2026-08-31' },
  { id: 'BK-002', bookingCode: 'QD-7743', userId: 'usr_102', userName: 'Pooja Shrestha', userEmail: 'pooja.s@example.com', userPhone: '+977 9851098765', seatId: 'seat_R5', seatNumber: 'R5', zone: 'Right Window Wall (Zone R)', passType: 'WEEKLY',  status: 'CONFIRMED', paymentStatus: 'PAID',    hasLocker: true, lockerNumber: 'L-02', totalAmount: 3000, createdAt: '2026-08-18T10:00:00Z', confirmedAt: '2026-08-18T10:10:00Z', checkIn: '2026-08-18', checkOut: '2026-08-25' },
  { id: 'BK-003', bookingCode: 'QD-1192', userId: 'usr_101', userName: 'Aarav Sharma',   userEmail: 'aarav.sharma@example.com', userPhone: '+977 9841234567', seatId: 'seat_A2', seatNumber: 'A2', zone: 'Left Quiet Row (Zone A)',   passType: 'DAILY',   status: 'CONFIRMED', paymentStatus: 'PAID',    hasLocker: false, totalAmount: 500,  createdAt: '2026-08-25T07:30:00Z', confirmedAt: '2026-08-25T07:35:00Z', checkIn: '2026-08-25', checkOut: '2026-08-25' },
  { id: 'BK-004', bookingCode: 'QD-5511', userId: 'usr_103', userName: 'Rohan Thapa',    userEmail: 'rohan.t@example.com', userPhone: '+977 9801122334', seatId: 'seat_A7', seatNumber: 'A7', zone: 'Left Quiet Row (Zone A)',   passType: 'DAILY',   status: 'CONFIRMED', paymentStatus: 'PAID',    hasLocker: false, totalAmount: 500,  createdAt: '2026-08-25T08:00:00Z', confirmedAt: '2026-08-25T08:05:00Z', checkIn: '2026-08-25', checkOut: '2026-08-25' },
  { id: 'BK-005', bookingCode: 'QD-9934', userId: 'usr_106', userName: 'Bina Maharjan',  userEmail: 'bina.m@example.com',  userPhone: '+977 9860112233', seatId: 'seat_B2', seatNumber: 'B2', zone: 'South Baseline Row (Zone B)',  passType: 'DAILY',   status: 'CONFIRMED', paymentStatus: 'PAID',    hasLocker: false, totalAmount: 450,  createdAt: '2026-08-25T08:30:00Z', confirmedAt: '2026-08-25T08:35:00Z', checkIn: '2026-08-25', checkOut: '2026-08-25' },
  { id: 'BK-006', bookingCode: 'QD-3317', userId: 'usr_105', userName: 'Kiran Adhikari', userEmail: 'kiran.a@example.com', userPhone: '+977 9849988776', seatId: 'seat_C2',  seatNumber: 'C2', zone: 'Center Focus Row (Zone C)',  passType: 'DAILY',   status: 'PENDING_CONFIRMATION', paymentStatus: 'PENDING', hasLocker: false, totalAmount: 600, createdAt: '2026-08-26T00:00:00Z', checkIn: '2026-08-26', checkOut: '2026-08-26' },
];

// ─── 6. ACCESS PLANS ───
const PLANS = [
  { id: 'plan_daily',   name: 'Day Scholar Pass',   price: 500,  originalPrice: 600,  duration: '1 Day',    lockerEligible: false, features: ['Single day access (7AM–10PM)', 'All study zones', 'Artisanal coffee & tea', 'Gigabit fiber Wi-Fi', 'Power outlet at every seat', 'Printing up to 10 pages'] },
  { id: 'plan_weekly',  name: 'Weekly Scholar Pass', price: 2700, originalPrice: 3500, duration: '7 Days',   lockerEligible: true,  features: ['7 consecutive days (7AM–10PM)', 'All study zones with seat selection', 'Unlimited beverages', 'Gigabit fiber Wi-Fi', 'Optional digital locker (+NPR 300)', 'Printing up to 50 pages', 'Priority seat booking'] },
  { id: 'plan_monthly', name: 'Monthly Scholar Pass',price: 7500, originalPrice: 9000, duration: '30 Days',  lockerEligible: true,  features: ['30 days unlimited access (7AM–10PM)', 'Dedicated assigned cabin', 'Unlimited coffee, tea & spring water', 'Gigabit fiber Wi-Fi', 'Dedicated digital locker included (+NPR 1000)', 'Unlimited printing & scanning', 'Guest pass (2/month)', 'Monitor pod access'] },
];

// ─── 7. AMENITIES ───
const AMENITIES = [
  { id: 'amenity_wifi',     iconName: 'Wifi',       title: 'Gigabit Fiber Internet',      desc: 'Dual-band enterprise Wi-Fi with uninterrupted uptime & battery backup.' },
  { id: 'amenity_power',    iconName: 'Zap',        title: 'Dedicated Power Outlets',     desc: 'Dual AC sockets + USB-C fast charging at every seat.' },
  { id: 'amenity_beverage', iconName: 'Coffee',     title: 'Artisanal Beverage Bar',      desc: 'Unlimited fresh French press coffee, green tea & filtered spring water.' },
  { id: 'amenity_lockers',  iconName: 'Lock',       title: 'Private Secure Lockers',      desc: '20 Keyless digital lockers to safely store your books and laptop.' },
  { id: 'amenity_lighting', iconName: 'Sun',        title: 'Natural & Warm Lighting',     desc: 'Floor-to-ceiling glass windows and individual warm LED lamps.' },
  { id: 'amenity_print',    iconName: 'Printer',    title: 'Printing & Scanning',         desc: 'High-speed laser printing and document scanning services.' },
  { id: 'amenity_monitors', iconName: 'Monitor',    title: 'Monitor Pod Options',         desc: 'External 27-inch 4K monitors for programmers and video editors.' },
  { id: 'amenity_backup',   iconName: 'ShieldAlert',title: '100% Inverter Backup',        desc: 'Kathmandu power cut proof. Automated instant generator backup.' },
];

// ─── 8. BRANCH ───
const BRANCH = {
  id: 'branch_lazimpat',
  name: 'The Quiet Desk - Lazimpat Main Branch',
  city: 'Kathmandu',
  address: 'Lazimpat Road (Near Standard Chartered Bank), Kathmandu 44600',
  phone: '+977 9841234567',
  email: 'lazimpat@quietdesk.np',
  hours: '7:00 AM - 10:00 PM (Seven days a week)',
  totalCapacity: 62,
  acousticPolicy: 'Strict Silence Enforced in Main Study Zones',
  facilities: ['Enterprise Wi-Fi', 'Artisanal Coffee Bar', '24/7 Power Backup', 'Ergonomic Desk Stations', '20 Digital Lockers'],
};

// ─── 9. ADMINS ───
const ADMINS = [
  { id: 'admin_lazimpat_01', uid: 'admin_lazimpat_01', email: 'admin@quietdesk.np', displayName: 'Branch Manager (Lazimpat)', role: 'Branch Manager', branch: 'Lazimpat Branch', lastLogin: new Date().toISOString() }
];

// ─── MAIN SEED RUNNER ───
async function seed() {
  console.log('\n🔥 QuietDesk — Firebase Firestore Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const results = {};

  const collections = [
    { name: 'zones',     docs: ZONES     },
    { name: 'seats',     docs: SEATS     },
    { name: 'lockers',   docs: LOCKERS   },
    { name: 'users',     docs: USERS     },
    { name: 'bookings',  docs: BOOKINGS  },
    { name: 'plans',     docs: PLANS     },
    { name: 'amenities', docs: AMENITIES },
    { name: 'admins',    docs: ADMINS    },
    { name: 'branches',  docs: [BRANCH]  },
  ];

  for (const col of collections) {
    try {
      console.log(`📦 Seeding '${col.name}' (${col.docs.length} docs)...`);
      await clearCollection(col.name);

      // Write in batches of 499
      const batchSize = 499;
      for (let i = 0; i < col.docs.length; i += batchSize) {
        const chunk = col.docs.slice(i, i + batchSize);
        const batch = writeBatch(db);
        for (const d of chunk) {
          batch.set(doc(db, col.name, d.id), { ...d, seededAt: new Date().toISOString() });
        }
        await batch.commit();
      }

      results[col.name] = col.docs.length;
      console.log(`  ✅ ${col.docs.length} docs written to '${col.name}'\n`);
    } catch (err) {
      console.error(`  ❌ Failed to seed '${col.name}':`, err.message);
      results[col.name] = `ERROR: ${err.message}`;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETE — Summary:');
  for (const [col, count] of Object.entries(results)) {
    console.log(`   • ${col.padEnd(12)}: ${count}`);
  }
  console.log('\n🌐 Firestore Project: thequietdesk-63f05\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('\n💥 Seed failed:', err);
  process.exit(1);
});
