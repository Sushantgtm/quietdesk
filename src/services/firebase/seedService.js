import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_USERS } from './userService';

export const MOCK_SEATS_DATA = [
  // --- Quiet Zone Alpha (A1–A20) — NPR 500/day ---
  { id: 'seat_A1',  seatNumber: 'A1',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A2',  seatNumber: 'A2',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'OCCUPIED',  pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A3',  seatNumber: 'A3',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A4',  seatNumber: 'A4',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'RESERVED',  pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A5',  seatNumber: 'A5',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A6',  seatNumber: 'A6',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A7',  seatNumber: 'A7',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'OCCUPIED',  pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A8',  seatNumber: 'A8',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A9',  seatNumber: 'A9',  zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A10', seatNumber: 'A10', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A11', seatNumber: 'A11', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A12', seatNumber: 'A12', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A13', seatNumber: 'A13', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A14', seatNumber: 'A14', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A15', seatNumber: 'A15', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A16', seatNumber: 'A16', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A17', seatNumber: 'A17', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A18', seatNumber: 'A18', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A19', seatNumber: 'A19', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },
  { id: 'seat_A20', seatNumber: 'A20', zone: 'Quiet Zone Alpha', type: 'STANDARD', status: 'AVAILABLE', pricePerDay: 500, amenities: ['Power Outlet', 'Reading Lamp'] },

  // --- Window Nook (B1–B16) — NPR 700/day ---
  { id: 'seat_B1',  seatNumber: 'B1',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B2',  seatNumber: 'B2',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'OCCUPIED',  pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B3',  seatNumber: 'B3',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B4',  seatNumber: 'B4',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B5',  seatNumber: 'B5',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B6',  seatNumber: 'B6',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B7',  seatNumber: 'B7',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B8',  seatNumber: 'B8',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B9',  seatNumber: 'B9',  zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B10', seatNumber: 'B10', zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B11', seatNumber: 'B11', zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B12', seatNumber: 'B12', zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B13', seatNumber: 'B13', zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B14', seatNumber: 'B14', zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B15', seatNumber: 'B15', zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },
  { id: 'seat_B16', seatNumber: 'B16', zone: 'Window Nook', type: 'PREMIUM_WINDOW', status: 'AVAILABLE', pricePerDay: 700, amenities: ['Window View', 'Natural Light', 'Power Outlet'] },

  // --- Private Pods (C1–C10) — NPR 1,200/day ---
  { id: 'seat_C1',  seatNumber: 'C1',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C2',  seatNumber: 'C2',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'RESERVED',  pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C3',  seatNumber: 'C3',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C4',  seatNumber: 'C4',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C5',  seatNumber: 'C5',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C6',  seatNumber: 'C6',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C7',  seatNumber: 'C7',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C8',  seatNumber: 'C8',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C9',  seatNumber: 'C9',  zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },
  { id: 'seat_C10', seatNumber: 'C10', zone: 'Private Pods', type: 'PRIVATE_CABIN', status: 'AVAILABLE', pricePerDay: 1200, amenities: ['Sound Isolation', 'Ergonomic Desk', 'Private Locker'] },

  // --- Collaborative Hub (D1–D16) — NPR 400/day ---
  { id: 'seat_D1',  seatNumber: 'D1',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D2',  seatNumber: 'D2',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D3',  seatNumber: 'D3',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D4',  seatNumber: 'D4',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D5',  seatNumber: 'D5',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D6',  seatNumber: 'D6',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D7',  seatNumber: 'D7',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D8',  seatNumber: 'D8',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D9',  seatNumber: 'D9',  zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D10', seatNumber: 'D10', zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D11', seatNumber: 'D11', zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D12', seatNumber: 'D12', zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D13', seatNumber: 'D13', zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D14', seatNumber: 'D14', zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D15', seatNumber: 'D15', zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
  { id: 'seat_D16', seatNumber: 'D16', zone: 'Collaborative Hub', type: 'OPEN_COLLAB', status: 'AVAILABLE', pricePerDay: 400, amenities: ['Whiteboard', 'Power Outlet', 'Open Layout'] },
];

export const MOCK_BOOKINGS_DATA = [
  {
    id: 'bk_101',
    bookingCode: 'QD-8492',
    seatId: 'seat_A2',
    seatNumber: 'A2',
    userName: 'Aarav Sharma',
    userEmail: 'aarav.sharma@example.com',
    userPhone: '+977 9841234567',
    passType: 'DAILY',
    startDate: '2026-08-19',
    endDate: '2026-08-19',
    status: 'CONFIRMED',
    totalAmount: 500,
    paymentStatus: 'PAID',
    createdAt: '2026-08-19T09:30:00Z'
  },
  {
    id: 'bk_102',
    bookingCode: 'QD-9310',
    seatId: 'seat_B2',
    seatNumber: 'B2',
    userName: 'Pooja Shrestha',
    userEmail: 'pooja.s@example.com',
    userPhone: '+977 9851098765',
    passType: 'WEEKLY',
    startDate: '2026-08-18',
    endDate: '2026-08-25',
    status: 'CHECKED_IN',
    totalAmount: 2800,
    paymentStatus: 'PAID',
    createdAt: '2026-08-18T14:15:00Z'
  },
  {
    id: 'bk_103',
    bookingCode: 'QD-7124',
    seatId: 'seat_A7',
    seatNumber: 'A7',
    userName: 'Rohan Thapa',
    userEmail: 'rohan.t@example.com',
    userPhone: '+977 9801122334',
    passType: 'DAILY',
    startDate: '2026-08-19',
    endDate: '2026-08-19',
    status: 'CHECKED_IN',
    totalAmount: 500,
    paymentStatus: 'PAID',
    createdAt: '2026-08-19T10:00:00Z'
  },
  {
    id: 'bk_104',
    bookingCode: 'QD-4401',
    seatId: 'seat_C2',
    seatNumber: 'C2',
    userName: 'Sneha Gurung',
    userEmail: 'sneha.g@example.com',
    userPhone: '+977 9812345678',
    passType: 'MONTHLY',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'CONFIRMED',
    totalAmount: 9500,
    paymentStatus: 'PAID',
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const MOCK_PLANS_DATA = [
  {
    id: 'daily',
    title: 'Daily Pass',
    price: 'NPR 500',
    period: 'per day',
    description: 'Perfect for drop-in study sessions and urgent deadline sprees.',
    features: [
      'Single day full access',
      'High-speed Enterprise WiFi',
      'Unlimited artisanal tea & coffee',
      'Standard Ergonomic desk',
      'Locker facility optional (upon request)'
    ],
    lockerAvailable: false,
    lockerPrice: 0,
    highlighted: false,
    cta: 'Get Started'
  },
  {
    id: 'weekly',
    title: 'Weekly Pass',
    price: 'NPR 2,800',
    period: 'per week',
    description: 'Ideal for exam preparation weeks and intense research sprints.',
    features: [
      '7-day uninterrupted access',
      'High-speed Enterprise WiFi',
      'Unlimited artisanal tea & coffee',
      'Priority seat reservation',
      'Personal locker available (+NPR 300/wk extra)'
    ],
    lockerAvailable: true,
    lockerPrice: 300,
    lockerNote: '+NPR 300 / week extra charge',
    highlighted: true,
    cta: 'Reserve Week'
  },
  {
    id: 'monthly',
    title: 'Monthly Membership',
    price: 'NPR 9,500',
    period: 'per month',
    description: 'Designed for serious scholars, researchers, and remote professionals.',
    features: [
      'Full 24/7 priority access',
      'Dedicated personal desk option',
      'Unlimited tea, coffee & snacks',
      'Free printing credits (50 pages)',
      'Personal locker available (+NPR 1,000/mo extra)'
    ],
    lockerAvailable: true,
    lockerPrice: 1000,
    lockerNote: '+NPR 1,000 / month extra charge',
    highlighted: false,
    cta: 'Join Membership'
  }
];

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
  { id: 'amenity_lockers', iconName: 'Lock', title: 'Private Secure Lockers', desc: 'Keyless digital lockers to safely store your books and laptop.' },
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
    facilities: ['Enterprise Wi-Fi', 'Artisanal Coffee Bar', '24/7 Power Backup', 'Ergonomic Desk Stations']
  }
];

export const seedAllCollectionsToFirestore = async () => {
  const summary = { seats: 0, bookings: 0, plans: 0, admins: 0, amenities: 0, branches: 0, users: 0 };
  
  try {
    // 1. Seed Seats
    for (const seat of MOCK_SEATS_DATA) {
      await setDoc(doc(db, 'seats', seat.id), seat, { merge: true });
      summary.seats++;
    }

    // 2. Seed Bookings
    for (const booking of MOCK_BOOKINGS_DATA) {
      await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
      summary.bookings++;
    }

    // 3. Seed Plans
    for (const plan of MOCK_PLANS_DATA) {
      await setDoc(doc(db, 'plans', plan.id), plan, { merge: true });
      summary.plans++;
    }

    // 4. Seed Admins
    for (const admin of MOCK_ADMINS_DATA) {
      await setDoc(doc(db, 'admins', admin.id), admin, { merge: true });
      summary.admins++;
    }

    // 5. Seed Amenities
    for (const amenity of MOCK_AMENITIES_DATA) {
      await setDoc(doc(db, 'amenities', amenity.id), amenity, { merge: true });
      summary.amenities++;
    }

    // 6. Seed Branches
    for (const branch of MOCK_BRANCHES_DATA) {
      await setDoc(doc(db, 'branches', branch.id), branch, { merge: true });
      summary.branches++;
    }

    // 7. Seed Users
    for (const user of MOCK_USERS) {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
      summary.users++;
    }

    console.log('✅ Successfully seeded all 7 collections to Firestore:', summary);
    return { success: true, summary };
  } catch (error) {
    console.error('❌ Error seeding collections to Firestore:', error);
    return { success: false, error: error.message };
  }
};

