import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPJ2pzg4zTmCPfgoOycCgA70HrOBC7F4w",
  authDomain: "thequietdesk-63f05.firebaseapp.com",
  projectId: "thequietdesk-63f05",
  storageBucket: "thequietdesk-63f05.firebasestorage.app",
  messagingSenderId: "780957484603",
  appId: "1:780957484603:web:be108adb8e2731fca0fe1e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const bookingsSnap = await getDocs(collection(db, 'bookings'));
  const seatsSnap = await getDocs(collection(db, 'seats'));

  console.log(`=== USERS (${usersSnap.docs.length}) ===`);
  usersSnap.docs.forEach(d => {
    const u = d.data();
    console.log(`- ${d.id}: ${u.fullName || u.name} | ${u.phone} | Status: ${u.status || u.membershipStatus} | Seat: ${u.seatNumber || u.assignedSeat || 'None'}`);
  });

  console.log(`\n=== BOOKINGS (${bookingsSnap.docs.length}) ===`);
  bookingsSnap.docs.forEach(d => {
    const b = d.data();
    console.log(`- ${d.id} (${b.bookingCode}): ${b.userName} | Desk: ${b.seatNumber} (id: ${b.seatId}) | Status: ${b.status} | Dates: ${b.startDate} to ${b.endDate}`);
  });

  console.log(`\n=== SEATS NON-AVAILABLE (${seatsSnap.docs.length} total) ===`);
  let nonAvail = 0;
  seatsSnap.docs.forEach(d => {
    const s = d.data();
    if (s.status !== 'AVAILABLE') {
      nonAvail++;
      console.log(`- Desk ${s.seatNumber} (id: ${d.id}): Status = ${s.status}`);
    }
  });
  console.log(`Total non-available seats: ${nonAvail}`);
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
