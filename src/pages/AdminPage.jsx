import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { 
  Shield, RefreshCw, LogOut, Search, Database, CheckCircle2, ArrowLeft, 
  LayoutDashboard, Grid, Calendar, DollarSign, Settings, ChevronRight, 
  UserCheck, AlertCircle, Clock, TrendingUp, CreditCard, ChevronDown, Check, X,
  Users, UserPlus, Package, Edit, Edit3, Plus, Eye, Trash2, Lock, Tag, XCircle, Phone, Mail, User,
  PlusCircle, Sparkles, Layers, Sliders, MapPin, FileText, CheckCircle, Printer, Copy, AlertTriangle,
  Compass, DoorOpen, Bookmark
} from 'lucide-react';
import { seedAllCollectionsToFirestore } from '../services/firebase/seedService';
import { deleteUser as deleteUserFromFirestore, purgeAllUsersFromFirestore } from '../services/firebase/userService';
import { deleteBooking as deleteBookingFromFirestore, purgeAllBookingsFromFirestore } from '../services/firebase/bookingService';
import { WalkinStudentModal } from '../components/admin/WalkinStudentModal';
import { RegistrationReceiptModal } from '../components/admin/RegistrationReceiptModal';
import { StudyRoomFloorPlan } from '../components/admin/StudyRoomFloorPlan';
import { CabinStudentSelectModal } from '../components/admin/CabinStudentSelectModal';
import { LockerManageModal } from '../components/admin/LockerManageModal';
import { StudentProfileModal } from '../components/admin/StudentProfileModal';
import { ReservationConfirmModal } from '../components/admin/ReservationConfirmModal';

export const AdminPage = () => {
  const { isAuthenticated, logout, admin } = useAuth();
  const { 
    seats, lockers, bookings, users, plans, zones,
    changeSeatStatus, changeBookingStatus, changePaymentStatus, 
    loadingBookings, loadingUsers, confirmBooking,
    createUser, updateUser, createPlan, updatePlan, deletePlan, 
    createBooking, updateBookingDetails, createSeat, updateSeatDetails, deleteSeat,
    createZone, updateZoneDetails, deleteZone, resetAndSeedZones, findOrCreateStudent,
    assignLocker, releaseLocker, updateLockerStatus, createLocker
  } = useBooking();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, USERS, DESKS, BOOKINGS, PACKAGES, FINANCE, SYSTEM
  const [searchQuery, setSearchQuery] = useState('');
  const [seedingStatus, setSeedingStatus] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showDeveloperSeeder, setShowDeveloperSeeder] = useState(false);

  // Filters for Desks & Users
  const [seatZoneFilter, setSeatZoneFilter] = useState('ALL');
  const [seatStatusFilter, setSeatStatusFilter] = useState('ALL');
  const [seatViewMode, setSeatViewMode] = useState('GRID');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userDueFilter, setUserDueFilter] = useState('ALL'); // ALL | HAS_DUE | NO_DUE
  const [financeStatusFilter, setFinanceStatusFilter] = useState('ALL');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingChannelFilter, setBookingChannelFilter] = useState('WEBSITE_ONLY');

  // Modal States
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});
  const [showWalkinStudentModal, setShowWalkinStudentModal] = useState(false);
  const [preselectedSeatForWalkin, setPreselectedSeatForWalkin] = useState(null);
  const [showRegistrationReceiptModal, setShowRegistrationReceiptModal] = useState(false);
  const [registrationReceiptData, setRegistrationReceiptData] = useState(null);

  const [registerUserForm, setRegisterUserForm] = useState({
    fullName: '', email: '', phone: '', passType: 'DAILY', emergencyContact: '', notes: ''
  });

  const [showReservationConfirmModal, setShowReservationConfirmModal] = useState(false);
  const [selectedBookingForConfirmation, setSelectedBookingForConfirmation] = useState(null);

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    userId: '', userName: '', userEmail: '', userPhone: '',
    seatId: '', seatNumber: '', shift: 'FULL_DAY', bookingTime: '07:00 AM - 10:00 PM',
    passType: 'DAILY', startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0], totalAmount: 350,
    advanceAmount: 0, amountPaid: 0, pendingAmount: 350, paymentStatus: 'PAID', hasLocker: false
  });

  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState(null);
  const [editBookingForm, setEditBookingForm] = useState({
    seatId: '', seatNumber: '', shift: 'FULL_DAY', bookingTime: '', startDate: '', endDate: '',
    status: 'CONFIRMED', paymentStatus: 'PAID', totalAmount: 0, amountPaid: 0, pendingAmount: 0,
    hasLocker: false, lockerNumber: ''
  });

  // Record Payment Modal State
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [paymentModalForm, setPaymentModalForm] = useState({
    paymentAmount: 0, paymentMethod: 'CASH', referenceNote: ''
  });

  // Dashboard: Session Expiry Popup Modal
  const [showSessionExpiryPopup, setShowSessionExpiryPopup] = useState(false);

  // Manage Desk & Zone Navigation - LAYOUT is 1st default, STATIONS is 2nd, ZONES is 3rd, CREATE_STATION is 4th
  const [desksSubTab, setDesksSubTab] = useState('LAYOUT'); // 'LAYOUT' | 'STATIONS' | 'ZONES' | 'CREATE_STATION'
  const [selectedSeatForCabinModal, setSelectedSeatForCabinModal] = useState(null);
  const [showCabinStudentModal, setShowCabinStudentModal] = useState(false);
  const [selectedLockerForModal, setSelectedLockerForModal] = useState(null);
  const [showLockerModal, setShowLockerModal] = useState(false);

  // Overview Table
  const [showPastScholars, setShowPastScholars] = useState(false);
  const [autoExpiredProcessed, setAutoExpiredProcessed] = useState(false);

  // Manage Desk / Station Modal State
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);
  const [seatForm, setSeatForm] = useState({
    id: '', seatNumber: '', zone: 'Left Quiet Row (Zone A)', type: 'Single Desk', pricePerDay: 500, status: 'AVAILABLE', features: 'Power Outlet, Ergonomic Chair'
  });

  // Study Zone Management State
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    id: '', name: '', capacity: 10, pricePerDay: 500, description: ''
  });

  const handleOpenZoneModal = (zone = null) => {
    if (zone) {
      setEditingZone(zone);
      setZoneForm({
        id: zone.id,
        name: zone.name || '',
        capacity: zone.capacity || 10,
        pricePerDay: zone.pricePerDay || 500,
        description: zone.description || ''
      });
    } else {
      setEditingZone(null);
      setZoneForm({
        id: '',
        name: '',
        capacity: 10,
        pricePerDay: 500,
        description: ''
      });
    }
    setShowZoneModal(true);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (editingZone) {
      await updateZoneDetails(editingZone.id, {
        name: zoneForm.name,
        capacity: Number(zoneForm.capacity),
        pricePerDay: Number(zoneForm.pricePerDay),
        description: zoneForm.description
      });
    } else {
      await createZone({
        name: zoneForm.name,
        capacity: Number(zoneForm.capacity),
        pricePerDay: Number(zoneForm.pricePerDay),
        description: zoneForm.description
      });
    }
    setShowZoneModal(false);
  };

  const handleDeleteZoneClick = async (zoneId, zoneName) => {
    if (!zoneId) return;
    if (window.confirm(`Are you sure you want to delete the study zone "${zoneName}"?`)) {
      setShowZoneModal(false);
      await deleteZone(zoneId);
    }
  };

  const handleSyncZonePriceToSeats = async (zoneName, newPrice) => {
    if (window.confirm(`Update the daily rate of ALL desks in "${zoneName}" to NPR ${newPrice}?`)) {
      const seatsInZone = seats.filter(s => s.zone === zoneName);
      for (const seat of seatsInZone) {
        await updateSeatDetails(seat.id, { pricePerDay: Number(newPrice) });
      }
      alert(`Successfully updated daily rate for ${seatsInZone.length} desks in "${zoneName}".`);
    }
  };

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    id: '', name: '', price: '', originalPrice: '', duration: '', lockerEligible: true, features: ''
  });

  // Dedicated Add Station Page States
  const [addStationMode, setAddStationMode] = useState('SINGLE'); // 'SINGLE' | 'BULK'
  const [singleStationForm, setSingleStationForm] = useState({
    seatNumber: 'A14',
    zone: 'Left Quiet Row (Zone A)',
    type: 'Single Desk',
    floor: 'Floor 1 (Ground)',
    pricePerDay: 500,
    status: 'AVAILABLE',
    features: ['Power Outlet', 'Ergonomic Chair', 'Reading Light'],
    hasLocker: false,
    notes: ''
  });
  const [bulkStationForm, setBulkStationForm] = useState({
    prefix: 'C',
    startNum: 25,
    endNum: 30,
    zone: 'Center Focus Row (Zone C)',
    type: 'Private Focus Pod',
    floor: 'Floor 1 (Center)',
    pricePerDay: 600,
    status: 'AVAILABLE',
    features: ['Power Outlet', 'Ergonomic Chair', 'Acoustic Soundproof Spine', 'Reading Light']
  });

  // Derived Data Helpers
  const userBookingsHistory = selectedUserForProfile
    ? bookings.filter(b => b.userId === selectedUserForProfile.id || b.userEmail === selectedUserForProfile.email)
    : [];

  const availableSeatsList = seats.filter(s => s.status === 'AVAILABLE');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedingStatus('Seeding mock data to all 6 Firestore collections...');
    const result = await seedAllCollectionsToFirestore();
    setIsSeeding(false);
    if (result.success) {
      setSeedingStatus(`✅ Successfully seeded mock data to Firebase Firestore! (Seats: ${result.summary.seats}, Bookings: ${result.summary.bookings}, Plans: ${result.summary.plans}, Amenities: ${result.summary.amenities})`);
      setTimeout(() => setSeedingStatus(null), 6000);
    } else {
      setSeedingStatus(`❌ Seeding failed: ${result.error}`);
    }
  };

  const handleResetAndStartFresh = async () => {
    if (!window.confirm('⚠️ Are you sure you want to remove current student bookings and reset to a clean database? This will clear stale records and initialize pristine state.')) return;
    setIsSeeding(true);
    try {
      ['v1', 'v2', 'v3'].forEach(v => {
        localStorage.removeItem(`quietdesk_users_${v}`);
        localStorage.removeItem(`quietdesk_bookings_${v}`);
        localStorage.removeItem(`quietdesk_lockers_${v}`);
        localStorage.removeItem(`quietdesk_seats_${v}`);
      });
      localStorage.setItem('quietdesk_users_v3', JSON.stringify([]));
      localStorage.setItem('quietdesk_bookings_v3', JSON.stringify([]));
      
      const result = await seedAllCollectionsToFirestore();
      if (result.success) {
        setSeedingStatus('✅ Successfully reset and initialized clean database! Reloading workspace...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setSeedingStatus(`❌ Reset failed: ${result.error}`);
        setIsSeeding(false);
      }
    } catch (err) {
      setSeedingStatus(`❌ Error during reset: ${err.message}`);
      setIsSeeding(false);
    }
  };

  // Real-time Dynamic Fee Calculation Helper
  const calculateFee = ({ passType = 'DAILY', hasLocker = false, seatId = null }) => {
    let basePrice = 350;
    if (passType === 'DAILY') {
      const selectedSeat = seats.find(s => s.id === seatId);
      basePrice = selectedSeat ? (selectedSeat.pricePerDay || 350) : 350;
    } else if (passType === 'WEEKLY') {
      basePrice = 2100;
    } else if (passType === 'MONTHLY') {
      basePrice = 7500;
    }

    let lockerFee = 0;
    if (hasLocker) {
      if (passType === 'DAILY') lockerFee = 200;
      else if (passType === 'WEEKLY') lockerFee = 300;
      else if (passType === 'MONTHLY') lockerFee = 1000;
      else lockerFee = 200;
    }

    const totalAmount = basePrice + lockerFee;
    return { basePrice, lockerFee, totalAmount };
  };

  // Walk-in Student Admission Handler
  const handleWalkinStudentRegistration = async ({ studentData, bookingData, seatIdToOccupy }) => {
    try {
      const { user: student } = await findOrCreateStudent(studentData);
      const booking = await createBooking({
        ...bookingData,
        userId: student.id,
        userCode: student.userCode,
        status: 'CONFIRMED'
      });

      if (seatIdToOccupy) {
        await changeSeatStatus(seatIdToOccupy, 'OCCUPIED');
      }

      if (studentData.hasLocker && studentData.lockerNumber) {
        const matchingLocker = lockers.find(l => l.lockerNumber === studentData.lockerNumber || l.id === studentData.lockerNumber);
        if (matchingLocker) {
          await assignLocker(matchingLocker.id, {
            userId: student.id,
            userName: student.fullName || student.name,
            userPhone: student.phone || '',
            userEmail: student.email || '',
            seatNumber: studentData.seatNumber || '',
            passType: studentData.passType
          });
        }
      }

      setRegistrationReceiptData({
        receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        studentName: student.fullName || student.name,
        studentCode: student.userCode,
        studentPhone: student.phone,
        studentAddress: student.address,
        packageType: studentData.passType,
        shift: studentData.shift,
        seatNumber: studentData.seatNumber || 'Floating Desk',
        hasLocker: studentData.hasLocker,
        lockerNumber: studentData.lockerNumber,
        basePrice: studentData.basePrice,
        lockerFee: studentData.lockerFee,
        totalAmount: studentData.totalAmount,
        amountPaid: studentData.amountPaid,
        pendingDue: studentData.pendingDue,
        paymentMethod: studentData.paymentMethod
      });

      setShowWalkinStudentModal(false);
      setShowRegistrationReceiptModal(true);
    } catch (err) {
      console.error('Walkin registration error:', err);
      alert('Error registering walk-in student: ' + err.message);
    }
  };

  const handleRegisterUserSubmit = async (e, proceedToBooking = false) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const newUser = await createUser({
        ...registerUserForm,
        userCode: `QD-USR-${Math.floor(1000 + Math.random() * 9000)}`,
        membershipStatus: 'ACTIVE',
        joinedDate: new Date().toISOString()
      });
      setShowRegisterUserModal(false);
      
      if (proceedToBooking) {
        setReservationForm(prev => ({
          ...prev,
          userId: newUser.id,
          userName: newUser.fullName || newUser.name,
          userEmail: newUser.email,
          userPhone: newUser.phone,
          passType: newUser.passType || 'DAILY'
        }));
        setShowReservationModal(true);
      } else {
        alert('User profile successfully created and saved to database!');
      }
      setRegisterUserForm({ fullName: '', email: '', phone: '', passType: 'DAILY', emergencyContact: '', notes: '' });
    } catch (err) {
      console.error('Error registering user:', err);
      alert('Failed to register user: ' + err.message);
    }
  };

  const handleAdminReservationSubmit = async (e, mode = 'CONFIRMED') => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const selectedSeatObj = seats.find(s => s.id === reservationForm.seatId);
      const feeInfo = calculateFee({
        passType: reservationForm.passType,
        hasLocker: reservationForm.hasLocker,
        seatId: reservationForm.seatId
      });
      const totalAmount = reservationForm.totalAmount || feeInfo.totalAmount;
      const advanceAmount = Math.max(0, Number(reservationForm.advanceAmount || 0));
      let amountPaid = advanceAmount;
      if (reservationForm.paymentStatus === 'PAID') {
        amountPaid = totalAmount;
      }
      amountPaid = Math.min(totalAmount, amountPaid);
      const pendingAmount = Math.max(0, totalAmount - amountPaid);
      
      let paymentStatus = reservationForm.paymentStatus || 'PENDING';
      if (amountPaid >= totalAmount) {
        paymentStatus = 'PAID';
      } else if (amountPaid > 0) {
        paymentStatus = 'PARTIAL';
      } else {
        paymentStatus = 'PENDING';
      }

      // Check if user already has an active booking on a different seat
      const todayStr = new Date().toISOString().split('T')[0];
      const dupBooking = (bookings || []).find(b => {
        if (['CANCELLED', 'COMPLETED'].includes(b.status)) return false;
        if (b.endDate && b.endDate < todayStr) return false;
        if (reservationForm.seatId && b.seatId === reservationForm.seatId) return false;
        const matchesUser = (reservationForm.userId && b.userId === reservationForm.userId) ||
                            (reservationForm.userPhone && b.userPhone && b.userPhone.replace(/\D/g, '') === (reservationForm.userPhone || '').replace(/\D/g, '')) ||
                            (reservationForm.userEmail && b.userEmail && (reservationForm.userEmail || '').trim() && b.userEmail.toLowerCase() === (reservationForm.userEmail || '').toLowerCase());
        return matchesUser;
      });

      if (dupBooking) {
        alert(`⚠️ Scholar "${dupBooking.userName || reservationForm.userName}" already holds an active desk (Desk ${dupBooking.seatNumber}, valid until ${dupBooking.endDate || 'active'}). A student cannot hold multiple active desks simultaneously.`);
        return;
      }

      const bookingStatus = mode === 'BOOK' ? 'CONFIRMED' : (mode === 'RESERVE' ? 'RESERVED' : (reservationForm.status || 'CONFIRMED'));
      const seatStatus = bookingStatus === 'CONFIRMED' ? 'OCCUPIED' : 'RESERVED';

      await createBooking({
        ...reservationForm,
        seatNumber: selectedSeatObj ? selectedSeatObj.seatNumber : reservationForm.seatNumber,
        bookingCode: `QD-MAN-${Math.floor(1000 + Math.random() * 9000)}`,
        status: bookingStatus,
        totalAmount,
        advanceAmount,
        amountPaid,
        pendingAmount,
        paymentStatus,
        createdAt: new Date().toISOString()
      });
      if (reservationForm.seatId) {
        await changeSeatStatus(reservationForm.seatId, seatStatus);
      }
      setShowReservationModal(false);
      setReservationForm({
        userId: '', userName: '', userEmail: '', userPhone: '',
        seatId: '', seatNumber: '', shift: 'FULL_DAY', bookingTime: '07:00 AM - 10:00 PM',
        passType: 'DAILY', startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0], totalAmount: 350,
        advanceAmount: 0, amountPaid: 0, pendingAmount: 350, paymentStatus: 'PAID', hasLocker: false
      });
      alert(bookingStatus === 'CONFIRMED' ? '✅ Cabin successfully booked and occupied!' : '✅ Reservation successfully created and placed on hold!');
    } catch (err) {
      console.error('Error creating booking/reservation:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleEditBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForEdit) return;
    try {
      const feeInfo = calculateFee({
        passType: editBookingForm.passType || selectedBookingForEdit.passType || 'DAILY',
        hasLocker: editBookingForm.hasLocker,
        seatId: editBookingForm.seatId
      });
      const totalAmount = Number(editBookingForm.totalAmount) || feeInfo.totalAmount;
      let amountPaid = Number(editBookingForm.amountPaid || 0);
      if (editBookingForm.paymentStatus === 'PAID') {
        amountPaid = totalAmount;
      }
      amountPaid = Math.min(totalAmount, Math.max(0, amountPaid));
      const pendingAmount = Math.max(0, totalAmount - amountPaid);

      let paymentStatus = editBookingForm.paymentStatus;
      if (amountPaid >= totalAmount) {
        paymentStatus = 'PAID';
      } else if (amountPaid > 0) {
        paymentStatus = 'PARTIAL';
      } else {
        paymentStatus = 'PENDING';
      }

      await updateBookingDetails(selectedBookingForEdit.id, {
        ...editBookingForm,
        totalAmount,
        amountPaid,
        pendingAmount,
        paymentStatus
      });
      if (editBookingForm.status === 'CHECKED_IN' && editBookingForm.seatId) {
        await changeSeatStatus(editBookingForm.seatId, 'OCCUPIED');
      } else if (editBookingForm.status === 'CANCELLED' && editBookingForm.seatId) {
        await changeSeatStatus(editBookingForm.seatId, 'AVAILABLE');
      }
      setShowEditBookingModal(false);
      setSelectedBookingForEdit(null);
      alert('Booking details updated successfully!');
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Failed to update booking: ' + err.message);
    }
  };

  // Helper for inline quick partial payment
  const handleAddPartialPayment = async (bookingObj, addAmount) => {
    try {
      const total = Number(bookingObj.totalAmount || 0);
      const currentPaid = Number(bookingObj.amountPaid || (bookingObj.paymentStatus === 'PAID' ? total : 0));
      const newPaid = Math.min(total, currentPaid + Number(addAmount));
      const newPending = Math.max(0, total - newPaid);
      const newStatus = newPaid >= total ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING');

      await updateBookingDetails(bookingObj.id, {
        amountPaid: newPaid,
        pendingAmount: newPending,
        paymentStatus: newStatus
      });
      alert(`Recorded partial payment of NPR ${addAmount}. New Paid: NPR ${newPaid}, Balance Pending: NPR ${newPending}`);
    } catch (err) {
      console.error('Error recording partial payment:', err);
      alert('Failed to record partial payment: ' + err.message);
    }
  };
  // Handler to open Record Payment Modal
  const handleOpenRecordPaymentModal = (bookingObj) => {
    const total = Number(bookingObj.totalAmount || 0);
    const paid = Number(bookingObj.amountPaid || (bookingObj.paymentStatus === 'PAID' ? total : 0));
    const pending = Math.max(0, total - paid);
    setSelectedBookingForPayment(bookingObj);
    setPaymentModalForm({
      paymentType: 'FULL',
      paymentAmount: pending,
      paymentMethod: 'CASH',
      referenceNote: ''
    });
    setShowRecordPaymentModal(true);
  };

  // Submit Payment Record
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;
    try {
      const total = Number(selectedBookingForPayment.totalAmount || 0);
      const currentPaid = Number(selectedBookingForPayment.amountPaid || (selectedBookingForPayment.paymentStatus === 'PAID' ? total : 0));
      const addAmt = Math.max(0, Number(paymentModalForm.paymentAmount) || 0);
      const newPaid = Math.min(total, currentPaid + addAmt);
      const newPending = Math.max(0, total - newPaid);
      const newStatus = newPaid >= total ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING');

      const paymentRecord = {
        amount: addAmt,
        method: paymentModalForm.paymentMethod,
        type: paymentModalForm.paymentType || (newPending === 0 ? 'FULL' : 'PARTIAL'),
        note: paymentModalForm.referenceNote || (newPending === 0 ? 'Full Settlement' : 'Partial Payment'),
        recordedAt: new Date().toISOString()
      };

      const existingHistory = Array.isArray(selectedBookingForPayment.paymentHistory) 
        ? selectedBookingForPayment.paymentHistory 
        : [];

      await updateBookingDetails(selectedBookingForPayment.id, {
        amountPaid: newPaid,
        pendingAmount: newPending,
        paymentStatus: newStatus,
        paymentHistory: [...existingHistory, paymentRecord],
        lastPaymentMethod: paymentModalForm.paymentMethod
      });

      setShowRecordPaymentModal(false);
      setSelectedBookingForPayment(null);
      alert(`✅ Successfully recorded payment of NPR ${addAmt.toLocaleString()} via ${paymentModalForm.paymentMethod}!\nRemaining Left Balance: ${newPending === 0 ? 'Nil (Fully Settled)' : 'NPR ' + newPending.toLocaleString()}`);
    } catch (err) {
      console.error('Error recording payment:', err);
      alert('Failed to record payment: ' + err.message);
    }
  };

  // Quick Complete & Release Desk
  const handleQuickCompleteBooking = async (seatObj, bookingObj) => {
    const confirmMsg = bookingObj 
      ? `Complete booking ${bookingObj.bookingCode} for ${bookingObj.userName} and set Desk ${seatObj.seatNumber} back to AVAILABLE?`
      : `Set Desk ${seatObj.seatNumber} status to AVAILABLE?`;

    if (window.confirm(confirmMsg)) {
      try {
        if (bookingObj) {
          await changeBookingStatus(bookingObj.id, seatObj.id, 'COMPLETED');
        } else {
          await changeSeatStatus(seatObj.id, 'AVAILABLE');
        }
        alert(`✓ Desk ${seatObj.seatNumber} set to AVAILABLE and booking completed.`);
      } catch (err) {
        console.error('Error quick completing booking:', err);
        alert('Failed to complete booking: ' + err.message);
      }
    }
  };

  // Manage Seat / Station Modal Handlers
  const handleOpenSeatModal = (seatToEdit = null) => {
    if (seatToEdit) {
      setEditingSeat(seatToEdit);
      setSeatForm({
        id: seatToEdit.id,
        seatNumber: seatToEdit.seatNumber || '',
        zone: seatToEdit.zone || 'Left Quiet Row (Zone A)',
        type: seatToEdit.type || 'Single Desk',
        pricePerDay: seatToEdit.pricePerDay || 500,
        status: seatToEdit.status || 'AVAILABLE',
        features: Array.isArray(seatToEdit.features) ? seatToEdit.features.join(', ') : (seatToEdit.features || 'Power Outlet, Ergonomic Chair')
      });
    } else {
      setEditingSeat(null);
      setSeatForm({
        id: '',
        seatNumber: `A14`,
        zone: 'Left Quiet Row (Zone A)',
        type: 'Single Desk',
        pricePerDay: 500,
        status: 'AVAILABLE',
        features: 'Power Outlet, Ergonomic Chair, Reading Light'
      });
    }
    setShowSeatModal(true);
  };

  const handleSeatFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const featuresArr = typeof seatForm.features === 'string'
        ? seatForm.features.split(',').map(f => f.trim()).filter(Boolean)
        : seatForm.features;

      const payload = {
        seatNumber: seatForm.seatNumber,
        zone: seatForm.zone,
        type: seatForm.type,
        pricePerDay: Number(seatForm.pricePerDay),
        status: seatForm.status,
        features: featuresArr
      };

      if (editingSeat) {
        await updateSeatDetails(editingSeat.id, payload);
        alert(`✓ Station ${seatForm.seatNumber} details updated successfully!`);
      } else {
        await createSeat(payload);
        alert(`✓ New station ${seatForm.seatNumber} added successfully!`);
      }
      setShowSeatModal(false);
      setEditingSeat(null);
    } catch (err) {
      console.error('Error saving seat details:', err);
      alert('Failed to save seat details: ' + err.message);
    }
  };

  const handleDeleteSeatSubmit = async (seatId) => {
    if (window.confirm('Are you sure you want to remove this study desk/station?')) {
      try {
        await deleteSeat(seatId);
        setShowSeatModal(false);
        setEditingSeat(null);
        alert('Station removed successfully.');
      } catch (err) {
        console.error('Error deleting seat:', err);
        alert('Failed to delete seat: ' + err.message);
      }
    }
  };

  // Add Station Page Single Creator Handler
  const handleSingleStationSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSeat({
        seatNumber: singleStationForm.seatNumber,
        zone: singleStationForm.zone,
        type: singleStationForm.type,
        floor: singleStationForm.floor,
        pricePerDay: Number(singleStationForm.pricePerDay),
        status: singleStationForm.status,
        features: singleStationForm.features,
        hasLocker: singleStationForm.hasLocker,
        notes: singleStationForm.notes
      });
      alert(`✅ Station ${singleStationForm.seatNumber} successfully created and published!`);
      // Auto-increment code suggestion for fast sequential creation
      const numMatch = singleStationForm.seatNumber.match(/^([A-Za-z\-]+)(\d+)$/);
      if (numMatch) {
        const prefix = numMatch[1];
        const nextNum = String(parseInt(numMatch[2], 10) + 1).padStart(numMatch[2].length, '0');
        setSingleStationForm(prev => ({ ...prev, seatNumber: `${prefix}${nextNum}` }));
      }
    } catch (err) {
      console.error('Error creating single station:', err);
      alert('Failed to create station: ' + err.message);
    }
  };

  // Add Station Page Bulk Batch Generator Handler
  const handleBulkStationSubmit = async (e) => {
    e.preventDefault();
    const start = parseInt(bulkStationForm.startNum, 10);
    const end = parseInt(bulkStationForm.endNum, 10);
    if (isNaN(start) || isNaN(end) || start > end) {
      alert('Please specify a valid start and end index.');
      return;
    }
    const totalToCreate = end - start + 1;
    if (!window.confirm(`Generate ${totalToCreate} stations from ${bulkStationForm.prefix}${String(start).padStart(2, '0')} to ${bulkStationForm.prefix}${String(end).padStart(2, '0')}?`)) {
      return;
    }
    try {
      let createdCount = 0;
      for (let i = start; i <= end; i++) {
        const formattedNum = String(i).padStart(2, '0');
        const seatNum = `${bulkStationForm.prefix}${formattedNum}`;
        await createSeat({
          seatNumber: seatNum,
          zone: bulkStationForm.zone,
          type: bulkStationForm.type,
          floor: bulkStationForm.floor,
          pricePerDay: Number(bulkStationForm.pricePerDay),
          status: bulkStationForm.status,
          features: bulkStationForm.features
        });
        createdCount++;
      }
      alert(`✅ Successfully batch-created ${createdCount} new study stations!`);
    } catch (err) {
      console.error('Error batch creating stations:', err);
      alert('Failed during batch station creation: ' + err.message);
    }
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedFeatures = typeof packageForm.features === 'string'
        ? packageForm.features.split(',').map(f => f.trim()).filter(Boolean)
        : packageForm.features;

      const planData = {
        name: packageForm.name,
        price: Number(packageForm.price),
        originalPrice: packageForm.originalPrice ? Number(packageForm.originalPrice) : null,
        duration: packageForm.duration || 'month',
        lockerEligible: packageForm.lockerEligible !== false,
        features: formattedFeatures
      };

      if (editingPackage) {
        await updatePlan(editingPackage.id, planData);
        alert('Access package updated!');
      } else {
        await createPlan(planData);
        alert('New access package created!');
      }
      setShowPackageModal(false);
      setEditingPackage(null);
      setPackageForm({ id: '', name: '', price: '', originalPrice: '', duration: '', lockerEligible: true, features: '' });
    } catch (err) {
      console.error('Error saving package:', err);
      alert('Failed to save package: ' + err.message);
    }
  };

  const handleDeletePackageSubmit = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this access package?')) {
      try {
        await deletePlan(packageId);
        setShowPackageModal(false);
        setEditingPackage(null);
        alert('Access package deleted.');
      } catch (err) {
        console.error('Error deleting package:', err);
        alert('Failed to delete package: ' + err.message);
      }
    }
  };

  if (!isAuthenticated) return null;

  // --- Auto-Expiry: Free cabin and mark scholar inactive when booking endDate passes ---
  // (Run once when bookings load; safe to call since changeSeatStatus is idempotent)
  if (!autoExpiredProcessed && bookings.length > 0 && seats.length > 0) {
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    const todayCheckStr = todayCheck.toISOString().split('T')[0];

    bookings.forEach(b => {
      if (!b.endDate) return;
      const endD = new Date(b.endDate);
      endD.setHours(0, 0, 0, 0);
      const isExpired = endD < todayCheck;
      const isActive = ['CHECKED_IN', 'OCCUPIED', 'CONFIRMED', 'RESERVED'].includes(b.status);
      if (isExpired && isActive) {
        // Free the seat
        const seat = seats.find(s => s.id === b.seatId || s.seatNumber === b.seatNumber);
        if (seat && seat.status !== 'AVAILABLE') {
          changeSeatStatus(seat.id, 'AVAILABLE').catch(() => {});
        }
        // Mark booking completed
        changeBookingStatus(b.id, 'COMPLETED').catch(() => {});
        
        // Mark user inactive ONLY if they have no other active bookings
        const hasOtherActive = bookings.some(other =>
          other.id !== b.id &&
          (other.userId === b.userId || (other.userPhone && b.userPhone && other.userPhone.replace(/\D/g, '') === b.userPhone.replace(/\D/g, ''))) &&
          !['CANCELLED', 'COMPLETED'].includes(other.status) &&
          (!other.endDate || other.endDate >= todayCheckStr)
        );

        if (!hasOtherActive && b.userId) {
          updateUser(b.userId, { membershipStatus: 'INACTIVE', status: 'INACTIVE' }).catch(() => {});
        }
      }
    });
    setAutoExpiredProcessed(true);
  }

  // --- Seat Metrics ---
  const totalSeats = seats.length;
  const occupiedCount = seats.filter(s => s.status === 'OCCUPIED').length;
  const availableCount = seats.filter(s => s.status === 'AVAILABLE').length;
  const reservedCount = seats.filter(s => s.status === 'RESERVED').length;
  const maintenanceCount = seats.filter(s => s.status === 'MAINTENANCE').length;
  // True occupancy = (occupied + reserved) / total
  const bookedSeats = occupiedCount + reservedCount;
  const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
  const occupancyRateExact = totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : '0.0';

  // --- Locker Metrics ---
  const totalLockers = lockers ? lockers.length : 0;
  const bookedLockers = lockers ? lockers.filter(l => l.status === 'ASSIGNED' || l.status === 'OCCUPIED').length : 0;
  const availableLockers = totalLockers - bookedLockers;

  // --- Booking Metrics ---
  const pendingConfirmations = bookings.filter(b => b.status === 'PENDING_CONFIRMATION');
  const activeCheckIns = bookings.filter(b => b.status === 'CHECKED_IN');
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');

  // --- Financial Metrics ---
  const activeBookingsList = bookings.filter(b => b.status !== 'CANCELLED');
  const totalGrossRevenue = activeBookingsList.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const collectedPaidRevenue = activeBookingsList.reduce((sum, b) => {
    const total = Number(b.totalAmount) || 0;
    const pending = b.paymentStatus === 'PAID' ? 0 : (b.pendingAmount !== undefined ? Number(b.pendingAmount) : total);
    return sum + (total - pending);
  }, 0);
  const pendingReceivables = activeBookingsList.reduce((sum, b) => {
    if (b.paymentStatus === 'PAID') return sum;
    const total = Number(b.totalAmount) || 0;
    const pending = b.pendingAmount !== undefined ? Number(b.pendingAmount) : total;
    return sum + pending;
  }, 0);
  const avgBookingValue = activeBookingsList.length > 0 
    ? Math.round(totalGrossRevenue / activeBookingsList.length) 
    : 0;

  // Revenue Breakdown by Pass Type
  const dailyPassRevenue = activeBookingsList
    .filter(b => b.passType === 'DAILY')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const weeklyPassRevenue = activeBookingsList
    .filter(b => b.passType === 'WEEKLY')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const monthlyPassRevenue = activeBookingsList
    .filter(b => b.passType === 'MONTHLY')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  // --- Filtered Data ---
  const filteredSeats = seats.filter(s => {
    const matchesZone = seatZoneFilter === 'ALL' || s.zone === seatZoneFilter;
    const matchesStatus = seatStatusFilter === 'ALL' || s.status === seatStatusFilter;
    return matchesZone && matchesStatus;
  });

  const isWebsiteBooking = (b) => {
    if (b.bookingType === 'WEBSITE_BOOKING' || b.bookingType === 'WEBSITE') return true;
    if (b.bookingType === 'PHYSICAL_WALKIN' || b.bookingType === 'ADMIN_MANUAL' || b.bookingType === 'MANUAL_MAP') return false;
    if (b.bookingCode && (b.bookingCode.startsWith('QD-MAN') || b.bookingCode.startsWith('QD-WALK') || b.bookingCode.startsWith('QD-MAP'))) return false;
    return true;
  };

  const filteredBookings = bookings.filter(b => {
    const isOnline = isWebsiteBooking(b);
    if (bookingChannelFilter === 'WEBSITE_ONLY' && !isOnline) return false;
    if (bookingChannelFilter === 'WALKIN_ONLY' && isOnline) return false;
    const matchesQuery = (b.bookingCode && b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.userName && b.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.seatNumber && b.seatNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredFinanceBookings = bookings.filter(b => {
    const matchesQuery = (b.bookingCode && b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.userName && b.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.seatNumber && b.seatNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPayment = financeStatusFilter === 'ALL' || b.paymentStatus === financeStatusFilter;
    return matchesQuery && matchesPayment;
  });

  // --- Unified User Registry (Includes Admin registered users + Website booked students) ---
  const allUnifiedUsers = useMemo(() => {
    const userMap = new Map();
    // 1. Add all users from the users collection
    (users || []).forEach(u => {
      if (!u || !u.id) return;
      userMap.set(u.id, { ...u, source: 'REGISTERED' });
    });

    // 2. Also ensure any student who has a booking in the bookings collection is unified
    (bookings || []).forEach(b => {
      if (!b) return;
      const bUserId = b.userId;
      const phoneClean = (b.userPhone || '').replace(/\D/g, '');
      const emailClean = (b.userEmail || '').toLowerCase().trim();

      let foundKey = null;
      for (const [key, val] of userMap.entries()) {
        const valPhone = (val.phone || '').replace(/\D/g, '');
        const valEmail = (val.email || '').toLowerCase().trim();
        if (key === bUserId || (phoneClean && valPhone === phoneClean) || (emailClean && valEmail === emailClean)) {
          foundKey = key;
          break;
        }
      }

      if (foundKey) {
        const existing = userMap.get(foundKey);
        userMap.set(foundKey, {
          ...existing,
          assignedSeat: b.seatNumber ? `Desk ${b.seatNumber}` : existing.assignedSeat,
          seatNumber: b.seatNumber || existing.seatNumber,
          passType: b.passType || existing.passType
        });
      } else {
        const autoId = bUserId || `usr_bk_${b.id}`;
        userMap.set(autoId, {
          id: autoId,
          userCode: b.userCode || `QD-STU-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: b.userName || 'Scholar',
          name: b.userName || 'Scholar',
          email: b.userEmail || '',
          phone: b.userPhone || '',
          passType: b.passType || 'DAILY',
          assignedSeat: b.seatNumber ? `Desk ${b.seatNumber}` : '',
          seatNumber: b.seatNumber || '',
          joinedDate: b.startDate || b.createdAt || new Date().toISOString(),
          membershipStatus: 'ACTIVE',
          status: 'ACTIVE',
          source: 'WEBSITE_BOOKING'
        });
      }
    });

    return Array.from(userMap.values());
  }, [users, bookings]);

  // --- Dashboard Computed: Unpaid / Partial Payments ---
  const unpaidBookings = bookings.filter(b => b.status !== 'CANCELLED' && b.paymentStatus !== 'PAID');
  const partialBookings = bookings.filter(b => b.status !== 'CANCELLED' && b.paymentStatus === 'PARTIAL');
  const pendingOnlyBookings = bookings.filter(b => b.status !== 'CANCELLED' && b.paymentStatus === 'PENDING');

  // --- Dashboard Computed: Session Expiry ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // All bookings with days-remaining computed (Timezone-Safe)
  const parseLocalMidnight = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
  };

  const allBookingsWithDays = bookings
    .filter(b => b.endDate)
    .map(b => {
      const end = parseLocalMidnight(b.endDate);
      const daysLeft = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...b, daysLeft };
    });

  // Active scholars (not cancelled/completed, end date today or future)
  const sessionExpiryList = allBookingsWithDays
    .filter(b => !['CANCELLED', 'COMPLETED'].includes(b.status) && b.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Past scholars (end date in the past OR status COMPLETED)
  const pastScholarsList = allBookingsWithDays
    .filter(b => b.daysLeft < 0 || b.status === 'COMPLETED')
    .sort((a, b) => b.daysLeft - a.daysLeft); // most recently expired first

  // Active scholars table: expiring ≤3 days pinned first, then by soonest
  const activeScholarsTable = [
    ...sessionExpiryList.filter(b => b.daysLeft <= 3),
    ...sessionExpiryList.filter(b => b.daysLeft > 3).sort((a, b) => {
      // Sort by most recently booked (createdAt desc) among non-urgent
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bDate - aDate;
    })
  ];

  // Max days to use as bar scale (cap at 30 days for readability)
  const maxDisplayDays = 30;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ==================== LEFT SIDEBAR NAVIGATION ==================== */}
      <aside style={{
        width: '270px',
        backgroundColor: '#0F1E36',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1rem',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        zIndex: 100
      }}>
        <div>
          {/* Brand Header */}
          <div style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#D97706', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>
              <Shield size={18} /> ADMIN DASHBOARD
            </div>
            <h1 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0 0 0' }}>
              The Quiet Desk
            </h1>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
              Lazimpat Branch • Online
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'OVERVIEW' ? '#1E293B' : 'transparent',
                color: activeTab === 'OVERVIEW' ? '#F59E0B' : '#94A3B8',
                fontWeight: activeTab === 'OVERVIEW' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <LayoutDashboard size={18} />
                Overview
              </div>
              <ChevronRight size={14} style={{ opacity: activeTab === 'OVERVIEW' ? 1 : 0.4 }} />
            </button>

            <button
              onClick={() => setActiveTab('USERS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'USERS' ? '#1E293B' : 'transparent',
                color: activeTab === 'USERS' ? '#F59E0B' : '#94A3B8',
                fontWeight: activeTab === 'USERS' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={18} />
                Users & Profiles
              </div>
              <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: '#E2E8F0' }}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DESKS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'DESKS' ? '#1E293B' : 'transparent',
                color: activeTab === 'DESKS' ? '#38BDF8' : '#94A3B8',
                fontWeight: activeTab === 'DESKS' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Grid size={18} />
                Manage Stations & Zones
              </div>
              <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: '#E2E8F0' }}>
                {totalSeats}
              </span>
            </button>


            <button
              onClick={() => setActiveTab('BOOKINGS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'BOOKINGS' ? '#1E293B' : 'transparent',
                color: activeTab === 'BOOKINGS' ? '#F59E0B' : '#94A3B8',
                fontWeight: activeTab === 'BOOKINGS' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} />
                Bookings Queue
              </div>
              {pendingConfirmations.length > 0 ? (
                <span style={{ backgroundColor: '#D97706', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {pendingConfirmations.length} Pending
                </span>
              ) : (
                <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', color: '#94A3B8' }}>
                  {bookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PACKAGES')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'PACKAGES' ? '#1E293B' : 'transparent',
                color: activeTab === 'PACKAGES' ? '#F59E0B' : '#94A3B8',
                fontWeight: activeTab === 'PACKAGES' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Package size={18} />
                Access Packages
              </div>
              <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', color: '#94A3B8' }}>
                {plans.length}
              </span>
            </button>


            <button
              onClick={() => setActiveTab('FINANCE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'FINANCE' ? '#1E293B' : 'transparent',
                color: activeTab === 'FINANCE' ? '#F59E0B' : '#94A3B8',
                fontWeight: activeTab === 'FINANCE' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CreditCard size={18} />
                Finance & Revenue
              </div>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '0.15rem 0.45rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                NPR
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SYSTEM')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'SYSTEM' ? '#1E293B' : 'transparent',
                color: activeTab === 'SYSTEM' ? '#F59E0B' : '#94A3B8',
                fontWeight: activeTab === 'SYSTEM' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Settings size={18} />
                System & Database
              </div>
            </button>

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Logged in: <strong style={{ color: '#F8FAFC' }}>{admin?.displayName || admin?.email || 'Branch Admin'}</strong>
          </div>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#CBD5E1',
              fontSize: '0.8rem',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={13} /> Public Site
          </Link>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>

        {/* TOP STATUS BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              {activeTab === 'OVERVIEW' && 'Branch Overview & Performance'}
              {activeTab === 'USERS' && 'User Management & Member Profiles'}
              {activeTab === 'DESKS' && 'Desks & Station Control'}
              {activeTab === 'BOOKINGS' && 'User Reservation Queue'}
              {activeTab === 'PACKAGES' && 'Access Packages & Pricing Management'}
              {activeTab === 'FINANCE' && 'Real-Time Financial & Revenue Management'}
              {activeTab === 'SYSTEM' && 'System Parameters & Maintenance'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
              Real-time synchronization with Firestore • Kathmandu, Nepal
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeTab !== 'DESKS' && (
              <>
                <button
                  onClick={() => setShowWalkinStudentModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={16} /> 🟢 Book Cabin (Walk-in)
                </button>

                <button
                  onClick={() => setShowReservationModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> 🟡 Make Reservation
                </button>

                <button
                  onClick={() => setShowRegisterUserModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <UserPlus size={16} /> + Register User
                </button>
              </>
            )}

            <span style={{ fontSize: '0.8rem', backgroundColor: '#E2E8F0', color: '#334155', padding: '0.4rem 0.85rem', borderRadius: '20px', fontWeight: 700 }}>
              Occupancy: {occupancyRate}%
            </span>
          </div>
        </div>


        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'OVERVIEW' && (
          <div>

            {/* ── KPI Cards Row (5 cards) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

              {/* 1. Available Stations */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🟢 Available Stations</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', margin: '0.25rem 0 0.1rem' }}>{availableCount}<span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 600 }}> / {totalSeats}</span></div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>{bookedSeats} occupied or reserved</div>
              </div>

              {/* 2. Occupancy Rate — fixed math */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📊 Occupancy Rate</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', margin: '0.25rem 0 0.1rem' }}>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#D97706' }}>{occupancyRateExact}%</div>
                </div>
                <div style={{ height: '4px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden', marginBottom: '0.3rem' }}>
                  <div style={{ height: '100%', width: `${occupancyRate}%`, backgroundColor: occupancyRate > 80 ? '#DC2626' : occupancyRate > 50 ? '#D97706' : '#059669', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>{occupiedCount} occupied · {reservedCount} reserved · {totalSeats} total</div>
              </div>

              {/* 3. Locker Utilization — NEW */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🔑 Locker Utilization</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: availableLockers === 0 ? '#DC2626' : '#1D4ED8', margin: '0.25rem 0 0.1rem' }}>
                  {bookedLockers}<span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 600 }}> / {totalLockers}</span>
                </div>
                <div style={{ height: '4px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden', marginBottom: '0.3rem' }}>
                  <div style={{ height: '100%', width: totalLockers > 0 ? `${Math.round((bookedLockers / totalLockers) * 100)}%` : '0%', backgroundColor: availableLockers === 0 ? '#DC2626' : availableLockers <= 3 ? '#D97706' : '#2563EB', borderRadius: '4px' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: availableLockers === 0 ? '#DC2626' : '#059669', fontWeight: 600 }}>
                  {availableLockers === 0 ? '🔴 All lockers assigned' : `${availableLockers} key locker${availableLockers !== 1 ? 's' : ''} free`}
                </div>
              </div>

              {/* 4. Pending Confirmations */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>⏳ Pending Confirmations</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: pendingConfirmations.length > 0 ? '#2563EB' : '#94A3B8', margin: '0.25rem 0 0.1rem' }}>{pendingConfirmations.length}</div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>Reservations awaiting admin confirm</div>
              </div>

              {/* 5. Total Revenue */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>💰 Total Revenue</div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0.1rem' }}>NPR {totalGrossRevenue.toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>NPR {collectedPaidRevenue.toLocaleString()} collected</div>
              </div>

            </div>

            {/* Quick Action Banner if Pending Requests */}
            {pendingConfirmations.length > 0 && (
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={24} style={{ color: '#2563EB' }} />
                  <div>
                    <strong style={{ color: '#1E3A8A', fontSize: '1.05rem' }}>
                      {pendingConfirmations.length} User Reservation Request{pendingConfirmations.length > 1 ? 's' : ''} Awaiting Admin Action
                    </strong>
                    <div style={{ fontSize: '0.85rem', color: '#3B82F6' }}>
                      Users reserved seat(s) online. Confirm the booking to transition desk to OCCUPIED.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('BOOKINGS')}
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.2rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Review Pending Requests →
                </button>
              </div>
            )}

            {/* ── PROMOTED: Sessions Expiring Soon (full-width card) ── */}
            {sessionExpiryList.filter(b => b.daysLeft <= 7).length > 0 && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #FCA5A5',
                marginBottom: '1.5rem',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(220,38,38,0.07)'
              }}>
                <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(90deg,#FEF2F2,#FFF7F7)', borderBottom: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>⏰</span>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#B91C1C' }}>Sessions Expiring Soon</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.05rem' }}>{sessionExpiryList.filter(b => b.daysLeft <= 7).length} scholar{sessionExpiryList.filter(b => b.daysLeft <= 7).length !== 1 ? 's' : ''} need attention</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSessionExpiryPopup(true)}
                    style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View All →
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 0, padding: '0.25rem 0' }}>
                  {sessionExpiryList.filter(b => b.daysLeft <= 7).slice(0, 8).map(b => {
                    const isUrgent = b.daysLeft <= 2;
                    const isToday = b.daysLeft === 0;
                    const barPct = Math.min(100, Math.round((b.daysLeft / 7) * 100));
                    const barColor = isToday || isUrgent ? '#DC2626' : '#D97706';
                    const textColor = isToday || isUrgent ? '#DC2626' : '#B45309';
                    const bgBadge = isToday || isUrgent ? '#FEF2F2' : '#FFFBEB';
                    return (
                      <div key={b.id} style={{ padding: '0.8rem 1.25rem', borderBottom: '1px solid #F9FAFB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: isUrgent ? '#FEE2E2' : '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: textColor, flexShrink: 0 }}>
                              {(b.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{b.userName || 'Walk-in'}</div>
                              <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{b.passType} · Desk {b.seatNumber}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: textColor, backgroundColor: bgBadge, padding: '0.15rem 0.5rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                            {isToday ? '⚠ Expires Today' : `${b.daysLeft}d left`}
                          </span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barPct}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '0.2rem' }}>Expires: {b.endDate}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main 2-Column Grid: Left (scholar table) | Right (payment + desk grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

              {/* LEFT: Active Scholars Table */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>👥 Scholar Register</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                      {activeScholarsTable.length} active · {pastScholarsList.length} past
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Past Scholars Toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                      <div
                        onClick={() => setShowPastScholars(p => !p)}
                        style={{
                          width: '34px', height: '18px', borderRadius: '9px', position: 'relative', cursor: 'pointer',
                          backgroundColor: showPastScholars ? '#6D28D9' : '#CBD5E1', transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '2px',
                          left: showPastScholars ? '18px' : '2px',
                          width: '14px', height: '14px', borderRadius: '50%',
                          backgroundColor: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      Show Past
                    </label>
                    <button
                      onClick={() => setActiveTab('USERS')}
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >View All Users →</button>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Scholar</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Desk</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Locker</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pass</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expires</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeScholarsTable.length === 0 && !showPastScholars ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>No active scholars</td></tr>
                      ) : (
                        [...activeScholarsTable, ...(showPastScholars ? pastScholarsList : [])].map((b, idx) => {
                          const isPast = b.daysLeft < 0 || b.status === 'COMPLETED';
                          const isUrgent = !isPast && b.daysLeft <= 3;
                          const isWarning = !isPast && b.daysLeft > 3 && b.daysLeft <= 7;

                          let statusBg = '#ECFDF5', statusColor = '#047857', statusLabel = `${b.daysLeft}d left`;
                          if (isPast) { statusBg = '#F1F5F9'; statusColor = '#64748B'; statusLabel = 'Expired'; }
                          else if (b.daysLeft === 0) { statusBg = '#FEF2F2'; statusColor = '#B91C1C'; statusLabel = '⚠ Today'; }
                          else if (isUrgent) { statusBg = '#FEF2F2'; statusColor = '#B91C1C'; statusLabel = `🔴 ${b.daysLeft}d left`; }
                          else if (isWarning) { statusBg = '#FFFBEB'; statusColor = '#B45309'; statusLabel = `🟡 ${b.daysLeft}d left`; }
                          else { statusLabel = `🟢 ${b.daysLeft}d left`; }

                          const rowBg = isPast ? '#FAFAFA' : (isUrgent ? '#FFF8F8' : isWarning ? '#FFFEF5' : '#FFFFFF');
                          const passColors = {
                            MONTHLY: { bg: '#EDE9FE', color: '#6D28D9' },
                            WEEKLY: { bg: '#DBEAFE', color: '#1D4ED8' },
                            DAILY: { bg: '#F3F4F6', color: '#374151' }
                          };
                          const passStyle = passColors[b.passType] || passColors.DAILY;
                          const lockerDisplay = b.hasLocker ? (b.lockerNumber || b.lockerLabel || '—') : '—';

                          return (
                            <tr
                              key={b.id + idx}
                              style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: rowBg, opacity: isPast ? 0.7 : 1 }}
                            >
                              <td style={{ padding: '0.7rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: isPast ? '#E2E8F0' : '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: isPast ? '#64748B' : '#F8FAFC', flexShrink: 0 }}>
                                    {(b.userName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', lineHeight: 1.2 }}>{b.userName || 'Walk-in'}</div>
                                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{b.userPhone || b.bookingCode || ''}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>{b.seatNumber || '—'}</span>
                              </td>
                              <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center' }}>
                                {b.hasLocker ? (
                                  <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>🔑 {lockerDisplay}</span>
                                ) : (
                                  <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center' }}>
                                <span style={{ backgroundColor: passStyle.bg, color: passStyle.color, padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>{b.passType}</span>
                              </td>
                              <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                {b.endDate || '—'}
                              </td>
                              <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center' }}>
                                <span style={{ backgroundColor: statusBg, color: statusColor, padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* ── Card 1: Payment Pending ── */}
                <div
                  onClick={() => setActiveTab('FINANCE')}
                  style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #FDE68A', padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(217,119,6,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>💰 Payment Pending</div>
                      <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#92400E', marginTop: '0.2rem' }}>
                        NPR {pendingReceivables.toLocaleString()}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.55rem', borderRadius: '20px' }}>
                      {unpaidBookings.length} booking{unpaidBookings.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <div style={{ backgroundColor: '#FEF2F2', borderRadius: '8px', padding: '0.45rem 0.75rem', flex: 1, minWidth: '80px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#991B1B', fontWeight: 700, textTransform: 'uppercase' }}>Pending</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#DC2626' }}>{pendingOnlyBookings.length}</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFBEB', borderRadius: '8px', padding: '0.45rem 0.75rem', flex: 1, minWidth: '80px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>Partial</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706' }}>{partialBookings.length}</div>
                    </div>
                    <div style={{ backgroundColor: '#EFF6FF', borderRadius: '8px', padding: '0.45rem 0.75rem', flex: 1, minWidth: '80px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>Due</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB' }}>NPR {Math.round(pendingReceivables / 1000)}k</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CreditCard size={12} /> Click to open Finance & Revenue tab →
                  </div>
                </div>

                {/* ── Card 2: Live Desk Grid with Legend ── */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>📋 Live Desk Grid</div>
                    <button
                      onClick={() => setActiveTab('DESKS')}
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                    >Full View →</button>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem', padding: '0.5rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    {[
                      { color: '#ECFDF5', border: '#A7F3D0', text: '#047857', label: 'Available' },
                      { color: '#FEF2F2', border: '#FECACA', text: '#B91C1C', label: 'Occupied' },
                      { color: '#FEF3C7', border: '#FDE68A', text: '#B45309', label: 'Reserved' },
                      { color: '#F3F4F6', border: '#D1D5DB', text: '#6B7280', label: 'Maintenance' }
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color, border: `1px solid ${item.border}` }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Desk Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '0.35rem' }}>
                    {seats.slice(0, 40).map(seat => {
                      let bgColor = '#F1F5F9', textColor = '#475569', borderColor = '#CBD5E1';
                      if (seat.status === 'AVAILABLE') { bgColor = '#ECFDF5'; textColor = '#047857'; borderColor = '#A7F3D0'; }
                      else if (seat.status === 'OCCUPIED') { bgColor = '#FEF2F2'; textColor = '#B91C1C'; borderColor = '#FECACA'; }
                      else if (seat.status === 'RESERVED') { bgColor = '#FEF3C7'; textColor = '#B45309'; borderColor = '#FDE68A'; }
                      else if (seat.status === 'MAINTENANCE') { bgColor = '#F3F4F6'; textColor = '#6B7280'; borderColor = '#D1D5DB'; }
                      return (
                        <div key={seat.id} style={{ backgroundColor: bgColor, color: textColor, border: `1px solid ${borderColor}`, borderRadius: '5px', padding: '0.3rem 0.2rem', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, lineHeight: 1 }}>
                          {seat.seatNumber}
                        </div>
                      );
                    })}
                    {seats.length > 40 && (
                      <div style={{ gridColumn: '1/-1', fontSize: '0.65rem', color: '#94A3B8', textAlign: 'center', paddingTop: '0.3rem' }}>+{seats.length - 40} more desks</div>
                    )}
                  </div>

                    {/* Summary row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                    <span style={{ color: '#047857' }}>🟢 {availableCount} Free</span>
                    <span style={{ color: '#B91C1C' }}>🔴 {occupiedCount} Busy</span>
                    <span style={{ color: '#B45309' }}>🟡 {reservedCount} Reserved</span>
                    <span style={{ color: '#6B7280' }}>⚫ {maintenanceCount} Maint</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: USERS & PROFILES ==================== */}
        {activeTab === 'USERS' && (
          <div>
            {/* User Search & Filter Bar */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search users by name, email, phone, or User ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  <option value="ALL">All Membership Statuses</option>
                  <option value="ACTIVE">Active Members</option>
                  <option value="EXPIRED">Expired Members</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                <button
                  onClick={() => setShowRegisterUserModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <UserPlus size={16} /> Register New User
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('⚠️ DANGER: This will PERMANENTLY DELETE all users and all bookings from Firestore and local storage. This cannot be undone. Are you absolutely sure?')) return;
                    if (!window.confirm('Second confirmation: Delete ALL data? This will reset everything to empty.')) return;
                    await purgeAllUsersFromFirestore();
                    await purgeAllBookingsFromFirestore();
                    alert('✅ All users and bookings have been purged. The system is now empty.');
                  }}
                  title="Permanently delete all users and bookings from Firestore"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} /> Purge All Data
                </button>
              </div>
            </div>

            {/* Users Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Registered Users</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>{allUnifiedUsers.length}</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Pass Holders</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {allUnifiedUsers.filter(u => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    return (bookings || []).some(b => 
                      (b.userId === u.id || (b.userPhone && u.phone && b.userPhone.replace(/\D/g, '') === u.phone.replace(/\D/g, ''))) &&
                      !['CANCELLED', 'COMPLETED'].includes(b.status) &&
                      (!b.endDate || b.endDate >= todayStr)
                    );
                  }).length}
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Weekly / Monthly Members</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', marginTop: '0.2rem' }}>
                  {allUnifiedUsers.filter(u => u.passType === 'WEEKLY' || u.passType === 'MONTHLY').length}
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>User ID / Code</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Full Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Contact Info</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Pass Type</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Joined Date</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUnifiedUsers
                    .filter(u => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const hasActiveBooking = (bookings || []).some(b =>
                        (b.userId === u.id || (b.userPhone && u.phone && b.userPhone.replace(/\D/g, '') === u.phone.replace(/\D/g, ''))) &&
                        !['CANCELLED', 'COMPLETED'].includes(b.status) &&
                        (!b.endDate || b.endDate >= todayStr)
                      );
                      const effectiveStatus = hasActiveBooking ? 'ACTIVE' : (u.membershipStatus || u.status || 'INACTIVE');

                      const q = searchQuery.toLowerCase();
                      const matchesSearch = !q || (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                        (u.email && u.email.toLowerCase().includes(q)) ||
                        (u.phone && u.phone.toLowerCase().includes(q)) ||
                        (u.userCode && u.userCode.toLowerCase().includes(q));
                      const matchesStatus = userStatusFilter === 'ALL' || effectiveStatus === userStatusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map(user => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const activeBookingForUser = (bookings || []).find(b =>
                        (b.userId === user.id || (b.userPhone && user.phone && b.userPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, ''))) &&
                        !['CANCELLED', 'COMPLETED'].includes(b.status) &&
                        (!b.endDate || b.endDate >= todayStr)
                      );
                      const displayStatus = activeBookingForUser ? 'ACTIVE' : (user.membershipStatus || user.status || 'INACTIVE');

                      return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0F172A' }}>
                          {user.userCode || user.id}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#334155' }}>
                              {user.fullName ? user.fullName.charAt(0) : 'U'}
                            </div>
                            {user.fullName}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                          <div>{user.email}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{user.phone}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: user.passType === 'MONTHLY' ? '#EDE9FE' : user.passType === 'WEEKLY' ? '#DBEAFE' : '#F3F4F6',
                            color: user.passType === 'MONTHLY' ? '#6D28D9' : user.passType === 'WEEKLY' ? '#1D4ED8' : '#374151'
                          }}>
                            {user.passType}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: displayStatus === 'ACTIVE' ? '#ECFDF5' : '#FEE2E2',
                            color: displayStatus === 'ACTIVE' ? '#047857' : '#991B1B'
                          }}>
                            {displayStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                          {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => setSelectedUserForProfile(user)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} /> View Profile
                            </button>
                            {activeBookingForUser ? (
                              <button
                                onClick={() => {
                                  const targetSeat = seats.find(s => s.seatNumber === activeBookingForUser.seatNumber || s.id === activeBookingForUser.seatId) || { seatNumber: activeBookingForUser.seatNumber, zone: activeBookingForUser.zone || 'Zone A' };
                                  setSelectedSeatForCabinModal(targetSeat);
                                  setShowCabinStudentModal(true);
                                }}
                                title={`Currently occupying Desk ${activeBookingForUser.seatNumber}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: '#059669',
                                  color: '#FFFFFF',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <CheckCircle2 size={13} /> Desk {activeBookingForUser.seatNumber}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setReservationForm(prev => ({
                                    ...prev,
                                    userId: user.id,
                                    userName: user.fullName,
                                    userEmail: user.email,
                                    userPhone: user.phone,
                                    passType: user.passType || 'DAILY'
                                  }));
                                  setShowReservationModal(true);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: '#D97706',
                                  color: '#FFFFFF',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <Plus size={13} /> Assign Desk
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Delete "${user.fullName || user.id}" from the system? This cannot be undone.`)) return;
                                await deleteUserFromFirestore(user.id);
                              }}
                              title="Remove user from database"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FFF5F5',
                                color: '#DC2626',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* ==================== TAB 3: UNIFIED MANAGE STATIONS & ZONES ==================== */}
        {activeTab === 'DESKS' && (
          <div>
            {/* Header Banner & Sub-Tab Navigation */}
            <div style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem 1.75rem',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <Sparkles size={16} /> Lazimpat Branch Workspace Management
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Manage Stations & Study Zones</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.85rem' }}>
                  Centralized administrative control for study zones, desk pricing, station capacity, and real-time seating.
                </p>
              </div>

              {/* Sub-Tab Navigation Pills */}
              <div style={{ display: 'flex', backgroundColor: '#1E293B', padding: '0.3rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', flexWrap: 'wrap', gap: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => setDesksSubTab('LAYOUT')}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: desksSubTab === 'LAYOUT' ? '#D97706' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Compass size={15} /> 🗺️ 1. Floor Layout Map
                </button>
                <button
                  type="button"
                  onClick={() => setDesksSubTab('STATIONS')}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: desksSubTab === 'STATIONS' ? '#0284C7' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Grid size={15} /> 📋 2. Stations Directory ({seats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDesksSubTab('ZONES')}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: desksSubTab === 'ZONES' ? '#7C3AED' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={15} /> 🏷️ 3. Study Zones ({zones.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDesksSubTab('CREATE_STATION')}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: desksSubTab === 'CREATE_STATION' ? '#047857' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <PlusCircle size={15} /> ⚡ 4. Add / Batch Desk
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Stations</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>{seats.length} Desks</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Study Zones</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>{zones.length} Zones</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Occupied / Reserved</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginTop: '0.2rem' }}>
                  {seats.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED').length} Desks
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Vacant & Available</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                  {seats.filter(s => s.status === 'AVAILABLE').length} Desks
                </div>
              </div>
            </div>

            {/* ================= SUB-TAB 0: FLOOR LAYOUT MAP ================= */}
            {desksSubTab === 'LAYOUT' && (
              <StudyRoomFloorPlan
                seats={seats}
                bookings={bookings}
                lockers={lockers}
                onSelectCabin={(seat) => {
                  setSelectedSeatForCabinModal(seat);
                  setShowCabinStudentModal(true);
                }}
                onOpenWalkinForSeat={(seat) => {
                  setPreselectedSeatForWalkin(seat);
                  setShowWalkinStudentModal(true);
                }}
                onSelectLocker={(locker) => {
                  setSelectedLockerForModal(locker);
                  setShowLockerModal(true);
                }}
              />
            )}

            {/* ================= SUB-TAB 1: STATIONS DIRECTORY ================= */}
            {desksSubTab === 'STATIONS' && (
              <div>
                {/* Filters & Control Bar */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>ZONE FILTER</label>
                      <select
                        value={seatZoneFilter}
                        onChange={(e) => setSeatZoneFilter(e.target.value)}
                        style={{ padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, backgroundColor: '#F8FAFC' }}
                      >
                        <option value="ALL">All Study Zones</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.name}>{z.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>STATUS FILTER</label>
                      <select
                        value={seatStatusFilter}
                        onChange={(e) => setSeatStatusFilter(e.target.value)}
                        style={{ padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, backgroundColor: '#F8FAFC' }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handleOpenSeatModal(null)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#047857',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Plus size={14} /> Add New Station
                    </button>

                    <button
                      onClick={() => setSeatViewMode(seatViewMode === 'GRID' ? 'TABLE' : 'GRID')}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {seatViewMode === 'GRID' ? 'Switch to Table View' : 'Switch to Grid View'}
                    </button>
                  </div>
                </div>

                {/* Stations Listing: Grid or Table */}
                {seatViewMode === 'GRID' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {filteredSeats.map(seat => {
                      const activeBooking = bookings.find(b => 
                        (b.seatId === seat.id || b.seatNumber === seat.seatNumber) &&
                        (b.status === 'CHECKED_IN' || b.status === 'OCCUPIED' || b.status === 'RESERVED' || b.status === 'CONFIRMED')
                      );

                      let statusBg = '#ECFDF5';
                      let statusColor = '#047857';
                      if (seat.status === 'OCCUPIED') { statusBg = '#FEF2F2'; statusColor = '#B91C1C'; }
                      if (seat.status === 'RESERVED') { statusBg = '#FEF3C7'; statusColor = '#B45309'; }
                      if (seat.status === 'MAINTENANCE') { statusBg = '#F3F4F6'; statusColor = '#4B5563'; }

                      return (
                        <div key={seat.id} style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          padding: '1.25rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', backgroundColor: '#F1F5F9', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                              {seat.zone}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: statusColor, backgroundColor: statusBg, padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                              {seat.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                                Desk #{seat.seatNumber}
                              </h3>
                              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{seat.type || 'Single Desk'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                                NPR {seat.pricePerDay}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>per day</div>
                            </div>
                          </div>

                          {/* Occupant Info Chip */}
                          {activeBooking ? (
                            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Assigned Scholar</div>
                              <div style={{ fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                                <User size={14} /> {activeBooking.userName}
                              </div>
                            </div>
                          ) : (
                            <div style={{ backgroundColor: '#F8FAFC', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              No active scholar assigned
                            </div>
                          )}

                          {/* Action Controls */}
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', alignItems: 'center', flexWrap: 'wrap' }}>
                            {(seat.status === 'OCCUPIED' || seat.status === 'RESERVED' || activeBooking) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const bToPay = activeBooking || {
                                      id: `seat_${seat.id}`,
                                      seatId: seat.id,
                                      seatNumber: seat.seatNumber,
                                      userName: `Walk-in Guest (${seat.seatNumber})`,
                                      totalAmount: seat.pricePerDay || 350,
                                      amountPaid: 0,
                                      pendingAmount: seat.pricePerDay || 350,
                                      paymentStatus: 'PENDING',
                                      passType: 'DAILY'
                                    };
                                    handleOpenRecordPaymentModal(bToPay);
                                  }}
                                  style={{
                                    padding: '0.45rem 0.6rem', borderRadius: '6px', border: 'none',
                                    backgroundColor: '#047857', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.25rem'
                                  }}
                                  title="Open Record Payment Modal"
                                >
                                  💳 Pay / Collect
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuickCompleteBooking(seat, activeBooking)}
                                  style={{
                                    padding: '0.45rem 0.6rem', borderRadius: '6px', border: 'none',
                                    backgroundColor: '#10B981', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.25rem'
                                  }}
                                  title="Complete reservation & set desk available automatically"
                                >
                                  <CheckCircle2 size={13} /> Free Desk
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenSeatModal(seat)}
                              style={{
                                padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                              }}
                            >
                              <Edit3 size={12} /> Edit
                            </button>

                            <select
                              value={seat.status}
                              onChange={(e) => changeSeatStatus(seat.id, e.target.value)}
                              style={{ padding: '0.45rem 0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FFFFFF' }}
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="OCCUPIED">Occupied</option>
                              <option value="RESERVED">Reserved</option>
                              <option value="MAINTENANCE">Maintenance</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Desk #</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Zone</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Scholar / Occupant</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Rate / Day</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Current Status</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSeats.map(seat => {
                          const activeBooking = bookings.find(b => 
                            (b.seatId === seat.id || b.seatNumber === seat.seatNumber) &&
                            (b.status === 'CHECKED_IN' || b.status === 'OCCUPIED' || b.status === 'RESERVED' || b.status === 'CONFIRMED')
                          );

                          return (
                            <tr key={seat.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0F172A' }}>#{seat.seatNumber}</td>
                              <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{seat.zone}</td>
                              <td style={{ padding: '0.85rem 1.25rem' }}>
                                {activeBooking ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0F172A' }}>
                                    <User size={14} color="#2563EB" />
                                    {activeBooking.userName}
                                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>({activeBooking.passType || 'DAILY'})</span>
                                  </div>
                                ) : (
                                  <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Unassigned</span>
                                )}
                              </td>
                              <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>NPR {seat.pricePerDay}</td>
                              <td style={{ padding: '0.85rem 1.25rem' }}>
                                <span style={{
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: seat.status === 'AVAILABLE' ? '#ECFDF5' : seat.status === 'OCCUPIED' ? '#FEF2F2' : '#FEF3C7',
                                  color: seat.status === 'AVAILABLE' ? '#047857' : seat.status === 'OCCUPIED' ? '#B91C1C' : '#B45309'
                                }}>
                                  {seat.status}
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1.25rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  {(seat.status === 'OCCUPIED' || seat.status === 'RESERVED' || activeBooking) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const bToPay = activeBooking || {
                                            id: `seat_${seat.id}`,
                                            seatId: seat.id,
                                            seatNumber: seat.seatNumber,
                                            userName: `Walk-in Guest (${seat.seatNumber})`,
                                            totalAmount: seat.pricePerDay || 350,
                                            amountPaid: 0,
                                            pendingAmount: seat.pricePerDay || 350,
                                            paymentStatus: 'PENDING',
                                            passType: 'DAILY'
                                          };
                                          handleOpenRecordPaymentModal(bToPay);
                                        }}
                                        style={{
                                          padding: '0.3rem 0.55rem', borderRadius: '6px', border: 'none',
                                          backgroundColor: '#047857', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                                        }}
                                        title="Open Record Payment Modal"
                                      >
                                        💳 Pay
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleQuickCompleteBooking(seat, activeBooking)}
                                        style={{
                                          padding: '0.3rem 0.55rem', borderRadius: '6px', border: 'none',
                                          backgroundColor: '#10B981', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                                        }}
                                        title="Complete reservation & set desk available automatically"
                                      >
                                        <CheckCircle2 size={13} /> Free Desk ✓
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenSeatModal(seat)}
                                    style={{
                                      padding: '0.3rem 0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1',
                                      backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '0.2rem'
                                    }}
                                  >
                                    <Edit3 size={12} /> Edit
                                  </button>

                                  <select
                                    value={seat.status}
                                    onChange={(e) => changeSeatStatus(seat.id, e.target.value)}
                                    style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.72rem', fontWeight: 600 }}
                                  >
                                    <option value="AVAILABLE">Available</option>
                                    <option value="OCCUPIED">Occupied</option>
                                    <option value="RESERVED">Reserved</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= SUB-TAB 2: STUDY ZONES MANAGEMENT ================= */}
            {desksSubTab === 'ZONES' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Study Zones Directory</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                      Configure zone names, max capacity limits, and base daily pricing across Lazimpat branch.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={async () => {
                        if (window.confirm("Delete all legacy zones from Firebase and register the 5 exact study zones matching the floor layout?")) {
                          const res = await resetAndSeedZones();
                          if (res && res.success) {
                            alert("✅ Successfully deleted existing zone documents from Firebase and initialized the 5 official floor layout study zones!");
                          } else {
                            alert("Failed to reset zones: " + (res?.error || 'Unknown error'));
                          }
                        }
                      }}
                      style={{
                        padding: '0.6rem 1.15rem', borderRadius: '8px', border: '1px solid #7C3AED',
                        backgroundColor: '#F5F3FF', color: '#7C3AED', fontSize: '0.85rem', fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                      }}
                    >
                      <RefreshCw size={15} /> Delete & Reset to Floor Layout Zones
                    </button>
                    <button
                      onClick={() => handleOpenZoneModal(null)}
                      style={{
                        padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                        backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                      }}
                    >
                      <PlusCircle size={16} /> Create New Study Zone
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {zones.map(zone => {
                    const desksInZone = seats.filter(s => s.zone === zone.name);
                    const occupiedInZone = desksInZone.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED');
                    const capacityPercent = Math.min(100, Math.round((desksInZone.length / (zone.capacity || 10)) * 100));

                    return (
                      <div key={zone.id} style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1.25rem'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
                                {zone.name}
                              </h4>
                              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                                {zone.description || 'Quiet study space for scholars'}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                              NPR {zone.pricePerDay} / day
                            </span>
                          </div>

                          {/* Capacity Progress Bar */}
                          <div style={{ marginTop: '1.25rem', backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                              <span>Desk Allocation</span>
                              <span>{desksInZone.length} / {zone.capacity} Max Desks ({capacityPercent}%)</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${capacityPercent}%`, backgroundColor: capacityPercent > 90 ? '#DC2626' : capacityPercent > 60 ? '#D97706' : '#047857', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: '0.4rem' }}>
                              <span>{occupiedInZone.length} Occupied</span>
                              <span>{desksInZone.length - occupiedInZone.length} Vacant</span>
                            </div>
                          </div>
                        </div>

                        {/* Zone Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                          <button
                            onClick={() => handleOpenZoneModal(zone)}
                            style={{
                              flex: 1, padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.8rem', fontWeight: 700,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                            }}
                          >
                            <Edit3 size={14} /> Edit Zone
                          </button>

                          <button
                            onClick={() => handleSyncZonePriceToSeats(zone.name, zone.pricePerDay)}
                            style={{
                              padding: '0.55rem 0.85rem', borderRadius: '8px', border: 'none',
                              backgroundColor: '#0284C7', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Update daily rate of all desks in this zone to match zone base price"
                          >
                            Sync Rate
                          </button>

                          <button
                            onClick={() => handleDeleteZoneClick(zone.id, zone.name)}
                            style={{
                              padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #FCA5A5',
                              backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: '0.8rem', fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Delete Zone"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 3: CREATE / BATCH DESK ================= */}
            {desksSubTab === 'CREATE_STATION' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Station Onboarding Generator</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                      Add a single customized desk or batch-generate an entire row of desks in one click.
                    </p>
                  </div>

                  <div style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: '0.25rem', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setAddStationMode('SINGLE')}
                      style={{
                        padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none',
                        backgroundColor: addStationMode === 'SINGLE' ? '#FFFFFF' : 'transparent',
                        color: '#0F172A', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}
                    >
                      Single Station
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStationMode('BULK')}
                      style={{
                        padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none',
                        backgroundColor: addStationMode === 'BULK' ? '#FFFFFF' : 'transparent',
                        color: '#0F172A', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}
                    >
                      Batch Generator
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
                  {/* Left Column: Generator Form */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {addStationMode === 'SINGLE' ? (
                      <form onSubmit={handleSingleStationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Station Code *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. A-09"
                              value={singleStationForm.seatNumber}
                              onChange={e => setSingleStationForm({ ...singleStationForm, seatNumber: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Study Zone *</label>
                            <select
                              value={singleStationForm.zone}
                              onChange={e => setSingleStationForm({ ...singleStationForm, zone: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, boxSizing: 'border-box' }}
                            >
                              {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Station Type</label>
                            <select
                              value={singleStationForm.type}
                              onChange={e => setSingleStationForm({ ...singleStationForm, type: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, boxSizing: 'border-box' }}
                            >
                              <option value="Single Desk">Single Desk</option>
                              <option value="Ergonomic Executive Desk">Ergonomic Executive Desk</option>
                              <option value="Private Silent Pod">Private Silent Pod</option>
                              <option value="Dual Collaborative Desk">Dual Collaborative Desk</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Daily Pass Rate (NPR) *</label>
                            <input
                              type="number"
                              required
                              min="50"
                              value={singleStationForm.pricePerDay}
                              onChange={e => setSingleStationForm({ ...singleStationForm, pricePerDay: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button
                            type="submit"
                            style={{
                              padding: '0.75rem 1.8rem', borderRadius: '10px', border: 'none',
                              backgroundColor: '#047857', color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 800,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                              boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.2)'
                            }}
                          >
                            <PlusCircle size={18} /> Create & Publish Station
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleBulkStationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Code Prefix *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. POD-, B-"
                              value={bulkStationForm.prefix}
                              onChange={e => setBulkStationForm({ ...bulkStationForm, prefix: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Start Index *</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={bulkStationForm.startNum}
                              onChange={e => setBulkStationForm({ ...bulkStationForm, startNum: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>End Index *</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={bulkStationForm.endNum}
                              onChange={e => setBulkStationForm({ ...bulkStationForm, endNum: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Preset Zone</label>
                            <select
                              value={bulkStationForm.zone}
                              onChange={e => setBulkStationForm({ ...bulkStationForm, zone: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, boxSizing: 'border-box' }}
                            >
                              {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Preset Price (NPR)</label>
                            <input
                              type="number"
                              required
                              value={bulkStationForm.pricePerDay}
                              onChange={e => setBulkStationForm({ ...bulkStationForm, pricePerDay: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button
                            type="submit"
                            style={{
                              padding: '0.75rem 1.8rem', borderRadius: '10px', border: 'none',
                              backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 800,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                              boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                            }}
                          >
                            <Layers size={18} /> Generate {Math.max(0, bulkStationForm.endNum - bulkStationForm.startNum + 1)} Stations
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Right Column: Live Visual Preview */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Eye size={14} /> Live Station Visual Preview
                    </div>
                    <div style={{ borderRadius: '12px', border: '2px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', backgroundColor: '#E2E8F0', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                          {addStationMode === 'SINGLE' ? singleStationForm.zone : bulkStationForm.zone}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#047857', backgroundColor: '#ECFDF5', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                          AVAILABLE
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
                            Desk {addStationMode === 'SINGLE' ? (singleStationForm.seatNumber || 'A-09') : `${bulkStationForm.prefix}${String(bulkStationForm.startNum).padStart(2, '0')}`}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{addStationMode === 'SINGLE' ? singleStationForm.type : bulkStationForm.type}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                            NPR {addStationMode === 'SINGLE' ? singleStationForm.pricePerDay : bulkStationForm.pricePerDay}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>per day</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: BOOKINGS QUEUE ==================== */}
        {activeTab === 'BOOKINGS' && (
          <div>
            {/* Search & Status Filter Bar */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search by Booking Code, User Name, or Desk Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                {[
                  ['WEBSITE_ONLY', '🌐 Website Online Bookings', '#2563EB'],
                  ['ALL', '📋 All Channels', '#0F172A'],
                  ['WALKIN_ONLY', '🚶 Walk-ins / Manual', '#D97706']
                ].map(([mode, label, activeColor]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBookingChannelFilter(mode)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: bookingChannelFilter === mode ? activeColor : 'transparent',
                      color: bookingChannelFilter === mode ? '#FFFFFF' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_CONFIRMATION">Pending Admin Confirmation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In (Occupied)</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* PENDING CONFIRMATION QUEUE */}
            {pendingConfirmations.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} /> High Priority: Pending Admin Confirmations ({pendingConfirmations.length})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {pendingConfirmations.map(booking => (
                    <div
                      key={booking.id}
                      style={{
                        backgroundColor: '#FFFBEB',
                        border: '2px solid #FCD34D',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400E' }}>{booking.bookingCode}</span>
                        <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                          PENDING ADMIN ACTION
                        </span>
                      </div>

                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                        {booking.userName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem' }}>
                        Desk <strong style={{ color: '#0F172A' }}>{booking.seatNumber}</strong> • {booking.passType} Pass
                        {booking.hasLocker ? (
                          <span style={{ marginLeft: '0.5rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            🔒 Locker (+NPR {booking.lockerFee || 0})
                          </span>
                        ) : (
                          <span style={{ marginLeft: '0.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>No Locker</span>
                        )}
                        <span style={{ display: 'block', marginTop: '0.25rem', fontWeight: 700, color: '#0F172A' }}>
                          Total Amount: NPR {booking.totalAmount}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                          onClick={() => {
                            setSelectedBookingForConfirmation(booking);
                            setShowReservationConfirmModal(true);
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.6rem',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <CheckCircle2 size={15} /> Confirm Booking & Seat
                        </button>
                        <button
                          onClick={() => changeBookingStatus(booking.id, booking.seatId, 'CANCELLED')}
                          style={{
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.6rem 0.8rem',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FULL BOOKINGS LEDGER TABLE */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>All Bookings Ledger ({filteredBookings.length})</span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>Scroll right to see all columns →</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '110px' }}>Code</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '160px' }}>Customer</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '70px' }}>Desk</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '90px' }}>Pass</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '90px' }}>Total Fee</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '80px' }}>Locker</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '110px' }}>Booking Status</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '90px' }}>Payment</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '90px' }}>Paid</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '130px' }}>Balance Due</th>
                      <th style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap', minWidth: '170px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(b => {
                      const total = Number(b.totalAmount || 0);
                      const paid = b.paymentStatus === 'PAID' ? total : Number(b.amountPaid || 0);
                      const remaining = Math.max(0, total - paid);
                      return (
                        <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          {/* Code */}
                          <td style={{ padding: '0.7rem 0.85rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>{b.bookingCode}</td>

                          {/* Customer */}
                          <td style={{ padding: '0.7rem 0.85rem' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>{b.userName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{b.userEmail}</div>
                          </td>

                          {/* Desk */}
                          <td style={{ padding: '0.7rem 0.85rem', fontWeight: 800, color: '#2563EB', whiteSpace: 'nowrap' }}>#{b.seatNumber}</td>

                          {/* Pass */}
                          <td style={{ padding: '0.7rem 0.85rem', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                              {b.passType || 'DAILY'}
                            </span>
                          </td>

                          {/* Total Fee */}
                          <td style={{ padding: '0.7rem 0.85rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                            NPR {total.toLocaleString()}
                          </td>

                          {/* Locker */}
                          <td style={{ padding: '0.7rem 0.85rem', whiteSpace: 'nowrap' }}>
                            {b.hasLocker ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                🔒 Yes
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>—</span>
                            )}
                          </td>

                          {/* Booking Status */}
                          <td style={{ padding: '0.7rem 0.85rem', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: b.status === 'CONFIRMED' ? '#EFF6FF' : b.status === 'CHECKED_IN' ? '#ECFDF5' : b.status === 'PENDING_CONFIRMATION' ? '#FEF3C7' : b.status === 'CANCELLED' ? '#FEF2F2' : '#F3F4F6',
                              color: b.status === 'CONFIRMED' ? '#1D4ED8' : b.status === 'CHECKED_IN' ? '#047857' : b.status === 'PENDING_CONFIRMATION' ? '#B45309' : b.status === 'CANCELLED' ? '#B91C1C' : '#4B5563'
                            }}>
                              {b.status === 'PENDING_CONFIRMATION' ? 'PENDING' : b.status}
                            </span>
                          </td>

                          {/* Payment Status */}
                          <td style={{ padding: '0.7rem 0.85rem', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              backgroundColor: b.paymentStatus === 'PAID' ? '#D1FAE5' : b.paymentStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                              color: b.paymentStatus === 'PAID' ? '#065F46' : b.paymentStatus === 'PARTIAL' ? '#92400E' : '#991B1B'
                            }}>
                              {b.paymentStatus || 'PENDING'}
                            </span>
                          </td>

                          {/* Paid */}
                          <td style={{ padding: '0.7rem 0.85rem', fontWeight: 700, color: '#047857', whiteSpace: 'nowrap' }}>
                            NPR {paid.toLocaleString()}
                          </td>

                          {/* Balance Due */}
                          <td style={{ padding: '0.7rem 0.85rem', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 800, color: remaining === 0 ? '#047857' : (b.paymentStatus === 'PARTIAL' ? '#D97706' : '#DC2626') }}>
                              {remaining === 0 ? 'Nil ✓' : `NPR ${remaining.toLocaleString()}`}
                            </div>
                            {remaining > 0 && (
                              <button
                                onClick={() => handleOpenRecordPaymentModal(b)}
                                style={{ marginTop: '0.2rem', fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', backgroundColor: '#047857', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              >
                                💳 Record Payment
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.7rem 0.85rem', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <select
                                value={b.status}
                                onChange={(e) => {
                                  if (e.target.value === 'CONFIRMED' && b.status === 'PENDING_CONFIRMATION') {
                                    setSelectedBookingForConfirmation(b);
                                    setShowReservationConfirmModal(true);
                                  } else {
                                    changeBookingStatus(b.id, b.seatId, e.target.value);
                                  }
                                }}
                                style={{ padding: '0.3rem 0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                <option value="PENDING_CONFIRMATION">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="CHECKED_IN">Checked In</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>

                              <button
                                onClick={() => {
                                  setSelectedBookingForEdit(b);
                                  setEditBookingForm({
                                    seatId: b.seatId || '',
                                    seatNumber: b.seatNumber || '',
                                    shift: b.shift || 'FULL_DAY',
                                    bookingTime: b.bookingTime || '08:00 AM - 08:00 PM',
                                    status: b.status || 'CONFIRMED',
                                    paymentStatus: b.paymentStatus || 'PENDING',
                                    totalAmount: b.totalAmount || 0,
                                    amountPaid: b.paymentStatus === 'PAID' ? (b.totalAmount || 0) : (b.amountPaid || 0),
                                    pendingAmount: b.paymentStatus === 'PAID' ? 0 : (b.pendingAmount !== undefined ? b.pendingAmount : (b.totalAmount || 0)),
                                    hasLocker: b.hasLocker || false,
                                    passType: b.passType || 'DAILY'
                                  });
                                  setShowEditBookingModal(true);
                                }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                  padding: '0.3rem 0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1',
                                  backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                                }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: ACCESS PACKAGES & PRICING ==================== */}
        {activeTab === 'PACKAGES' && (
          <div>
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Access Packages & Passes</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Manage study pass pricing, shift rules, and locker add-on options available to members.
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingPackage(null);
                  setPackageForm({ id: '', name: '', price: '', originalPrice: '', duration: '', lockerEligible: true, features: '' });
                  setShowPackageModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Create New Package
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {plans.map(plan => (
                <div
                  key={plan.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: plan.popular ? '2px solid #D97706' : '1px solid #E2E8F0',
                    padding: '1.5rem',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}
                >
                  {plan.popular && (
                    <span style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '16px',
                      backgroundColor: '#D97706',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      Most Popular
                    </span>
                  )}

                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>{plan.name}</h4>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706' }}>NPR {plan.price}</span>
                    {plan.duration && <span style={{ fontSize: '0.85rem', color: '#64748B' }}>/ {plan.duration}</span>}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1.2rem', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', padding: '0.75rem 0' }}>
                    {Array.isArray(plan.features) ? plan.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <CheckCircle2 size={14} style={{ color: '#059669', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    )) : (
                      <div>{plan.features}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: plan.lockerEligible ? '#FEF3C7' : '#F1F5F9',
                      color: plan.lockerEligible ? '#92400E' : '#64748B',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      {plan.lockerEligible ? '🔒 Locker Add-on Available' : 'No Locker Option'}
                    </span>

                    <button
                      onClick={() => {
                        setEditingPackage(plan);
                        setPackageForm({
                          id: plan.id,
                          name: plan.name,
                          price: plan.price,
                          originalPrice: plan.originalPrice || '',
                          duration: plan.duration || '',
                          lockerEligible: plan.lockerEligible !== false,
                          features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || '')
                        });
                        setShowPackageModal(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={14} /> Edit Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* ==================== TAB 4: REAL-TIME FINANCE & REVENUE ==================== */}
        {activeTab === 'FINANCE' && (
          <div>
            {/* Financial KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              
              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Gross Revenue</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0.3rem 0' }}>NPR {totalGrossRevenue.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total value across active bookings</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>Collected (Paid) Revenue</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '0.3rem 0' }}>NPR {collectedPaidRevenue.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Cleared transactions in cash/eSewa</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#D97706', textTransform: 'uppercase' }}>Pending Receivables</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', margin: '0.3rem 0' }}>NPR {pendingReceivables.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>Pending desk confirmation or payment</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563EB', textTransform: 'uppercase' }}>Avg Ticket Value</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB', margin: '0.3rem 0' }}>NPR {avgBookingValue.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Per customer booking</div>
              </div>

            </div>

            {/* Pass Type Revenue Breakdown */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Revenue Breakdown by Access Tier
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Daily Passes</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>NPR {dailyPassRevenue.toLocaleString()}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Weekly Passes</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>NPR {weeklyPassRevenue.toLocaleString()}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Monthly Memberships</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>NPR {monthlyPassRevenue.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Financial Transactions Ledger */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                  Financial Transactions & Payment Ledger
                </div>

                <select
                  value={financeStatusFilter}
                  onChange={(e) => setFinanceStatusFilter(e.target.value)}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">Paid Only</option>
                  <option value="PARTIAL">Partial Payment</option>
                  <option value="PENDING">Pending Only</option>
                </select>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Transaction / Code</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Customer Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Desk</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Pass Tier</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Total Fee (NPR)</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Total Paid</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Balance Due</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFinanceBookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0F172A' }}>{b.bookingCode}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>{b.userName}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#2563EB' }}>{b.seatNumber}</td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{b.passType}</td>
                      {/* Total Fee */}
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0F172A' }}>NPR {(b.totalAmount || 0).toLocaleString()}</td>
                      {/* Status Badge */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: b.paymentStatus === 'PAID' ? '#D1FAE5' : b.paymentStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                          color: b.paymentStatus === 'PAID' ? '#065F46' : b.paymentStatus === 'PARTIAL' ? '#92400E' : '#991B1B'
                        }}>
                          {b.paymentStatus || 'PENDING'}
                        </span>
                      </td>
                      {/* Total Paid */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#047857' }}>
                          NPR {b.paymentStatus === 'PAID' ? Number(b.totalAmount || 0).toLocaleString() : Number(b.amountPaid || 0).toLocaleString()}
                        </div>
                      </td>
                      {/* Balance Due */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        {(() => {
                          const total = Number(b.totalAmount || 0);
                          const paid = b.paymentStatus === 'PAID' ? total : Number(b.amountPaid || 0);
                          const remaining = Math.max(0, total - paid);
                          return (
                            <div style={{ fontWeight: 800, color: remaining === 0 ? '#047857' : (b.paymentStatus === 'PARTIAL' ? '#D97706' : '#DC2626') }}>
                              {remaining === 0 ? 'Nil ✓' : `NPR ${remaining.toLocaleString()}`}
                            </div>
                          );
                        })()}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {(() => {
                            const total = Number(b.totalAmount || 0);
                            const paid = b.paymentStatus === 'PAID' ? total : Number(b.amountPaid || 0);
                            const remaining = Math.max(0, total - paid);
                            return (
                              <>
                                {b.paymentStatus !== 'PAID' && (
                                  <button
                                    onClick={() => handleOpenRecordPaymentModal(b)}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '5px', border: 'none', backgroundColor: '#059669', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    💳 Record Payment
                                  </button>
                                )}
                                {b.paymentStatus === 'PAID' ? (
                                  <button
                                    onClick={() => changePaymentStatus(b.id, 'PENDING')}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Mark Unpaid
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => changePaymentStatus(b.id, 'PAID')}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '5px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <Check size={11} /> Mark Full Paid
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: SYSTEM & DATABASE ==================== */}
        {activeTab === 'SYSTEM' && (
          <div>
            {/* Branch Details */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Lazimpat Branch Operational Parameters
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div><strong>Location:</strong> Lazimpat Road, Kathmandu</div>
                <div><strong>Total Capacity:</strong> 62 Study Stations</div>
                <div><strong>Operating Hours:</strong> 7:00 AM - 10:00 PM Daily</div>
                <div><strong>Wi-Fi Network:</strong> QuietDesk_Enterprise (Gigabit Fiber)</div>
              </div>
            </div>

            {/* COLLAPSIBLE DEVELOPER & DATABASE SEEDER CARD */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setShowDeveloperSeeder(!showDeveloperSeeder)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: '#F8FAFC',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569', fontWeight: 700, fontSize: '0.95rem' }}>
                  <Database size={18} style={{ color: '#0F172A' }} /> Developer Utilities & Database Maintenance
                </div>
                <ChevronDown size={18} style={{ transform: showDeveloperSeeder ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </button>

              {showDeveloperSeeder && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 0, marginBottom: '1.25rem' }}>
                    Re-seed mock data (62 stations, default plans, mock user bookings, amenities, and branch parameters) directly into Google Firebase Firestore.
                  </p>

                  {seedingStatus && (
                    <div style={{
                      backgroundColor: seedingStatus.includes('❌') ? '#FEE2E2' : '#ECFDF5',
                      color: seedingStatus.includes('❌') ? '#991B1B' : '#047857',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '1.25rem'
                    }}>
                      {seedingStatus}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleSeedDatabase}
                      disabled={isSeeding}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: isSeeding ? '#64748B' : '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.7rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: isSeeding ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <RefreshCw size={15} style={{ animation: isSeeding ? 'spin 1s linear infinite' : 'none' }} />
                      {isSeeding ? 'Seeding Firestore...' : 'Seed Firebase Database'}
                    </button>

                    <button
                      onClick={handleResetAndStartFresh}
                      disabled={isSeeding}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.7rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: isSeeding ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                      Wipe Users & Start Fresh Database
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ==================== MODAL 1: REGISTER USER ==================== */}
      {showRegisterUserModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} /> Register New Desk Member
              </h3>
              <button onClick={() => setShowRegisterUserModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterUserSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={registerUserForm.fullName}
                  onChange={e => setRegisterUserForm({ ...registerUserForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="aarav@example.com"
                    value={registerUserForm.email}
                    onChange={e => setRegisterUserForm({ ...registerUserForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+977 9801234567"
                    value={registerUserForm.phone}
                    onChange={e => setRegisterUserForm({ ...registerUserForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Pass Tier</label>
                  <select
                    value={registerUserForm.passType}
                    onChange={e => setRegisterUserForm({ ...registerUserForm, passType: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="DAILY">Daily Pass</option>
                    <option value="WEEKLY">Weekly Pass</option>
                    <option value="MONTHLY">Monthly Membership</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Emergency Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+977 9841000000"
                    value={registerUserForm.emergencyContact}
                    onChange={e => setRegisterUserForm({ ...registerUserForm, emergencyContact: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Notes / Special Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers window seat, exam prep student..."
                  value={registerUserForm.notes}
                  onChange={e => setRegisterUserForm({ ...registerUserForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterUserModal(false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRegisterUserSubmit(e, false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Register Only (Close)
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRegisterUserSubmit(e, true)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Register & Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: USER PROFILE & HISTORY ==================== */}
      <StudentProfileModal
        user={selectedUserForProfile}
        bookings={bookings}
        lockers={lockers}
        seats={seats}
        onClose={() => setSelectedUserForProfile(null)}
        onNewReservation={(u) => {
          setSelectedUserForProfile(null);
          setReservationForm(prev => ({
            ...prev,
            userId: u.id,
            userName: u.fullName || u.name,
            userEmail: u.email,
            userPhone: u.phone,
            passType: u.passType || 'DAILY'
          }));
          setShowReservationModal(true);
        }}
        onCollectDue={(bookingObj) => {
          handleOpenRecordPaymentModal(bookingObj);
        }}
        onEditUser={(u) => {
          setEditingUser(u);
          setEditUserForm({ ...u });
          setShowEditUserModal(true);
        }}
      />

      {/* ==================== MODAL 3: ADMIN MAKE RESERVATION ==================== */}
      {showReservationModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#D97706', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} /> Admin Manual Reservation & Desk Booking
              </h3>
              <button onClick={() => setShowReservationModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminReservationSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Select User or Enter Info */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Select Registered User (Optional)</label>
                <select
                  value={reservationForm.userId}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const foundUser = users.find(u => u.id === selectedId);
                    if (foundUser) {
                      setReservationForm({
                        ...reservationForm,
                        userId: foundUser.id,
                        userName: foundUser.fullName,
                        userEmail: foundUser.email,
                        userPhone: foundUser.phone,
                        passType: foundUser.passType || 'DAILY'
                      });
                    } else {
                      setReservationForm({ ...reservationForm, userId: '' });
                    }
                  }}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="">-- Manual Guest / New Entry --</option>
                  {users.map(u => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const activeBk = (bookings || []).find(b => 
                      (b.userId === u.id || (b.userPhone && u.phone && b.userPhone.replace(/\D/g, '') === u.phone.replace(/\D/g, ''))) &&
                      !['CANCELLED', 'COMPLETED'].includes(b.status) &&
                      (!b.endDate || b.endDate >= todayStr)
                    );
                    return (
                      <option 
                        key={u.id} 
                        value={u.id}
                        disabled={Boolean(activeBk)}
                      >
                        {u.fullName} ({u.email || u.phone || 'No Contact'}) {activeBk ? `[🔴 Occupies Desk ${activeBk.seatNumber}]` : `[🟢 Available - ${u.passType || 'DAILY'}]`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Member Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={reservationForm.userName}
                    onChange={e => setReservationForm({ ...reservationForm, userName: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={reservationForm.userEmail}
                    onChange={e => setReservationForm({ ...reservationForm, userEmail: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Select Station / Desk *</label>
                  <select
                    required
                    value={reservationForm.seatId}
                    onChange={e => {
                      const selectedSeat = seats.find(s => s.id === e.target.value);
                      setReservationForm({
                        ...reservationForm,
                        seatId: e.target.value,
                        seatNumber: selectedSeat ? selectedSeat.seatNumber : ''
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Choose Available Station --</option>
                    {availableSeatsList.map(s => (
                      <option key={s.id} value={s.id}>Desk {s.seatNumber} ({s.zone} - NPR {s.pricePerDay}/day)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Pass Tier</label>
                  <select
                    value={reservationForm.passType}
                    onChange={e => {
                      const newPassType = e.target.value;
                      const feeInfo = calculateFee({
                        passType: newPassType,
                        hasLocker: reservationForm.hasLocker,
                        seatId: reservationForm.seatId
                      });
                      setReservationForm({
                        ...reservationForm,
                        passType: newPassType,
                        totalAmount: feeInfo.totalAmount
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="DAILY">Daily Pass (NPR 350)</option>
                    <option value="WEEKLY">Weekly Pass (NPR 2,100)</option>
                    <option value="MONTHLY">Monthly Pass (NPR 7,500)</option>
                  </select>
                </div>
              </div>

              {/* Shift, Payment Status & Advance Payment Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Shift Slot *</label>
                  <select
                    value={reservationForm.shift}
                    onChange={e => setReservationForm({ ...reservationForm, shift: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="FULL_DAY">Full Day (07:00 AM - 10:00 PM)</option>
                    <option value="MORNING">Morning Shift (07:00 AM - 12:00 PM)</option>
                    <option value="AFTERNOON">Afternoon Shift (12:00 PM - 05:00 PM)</option>
                    <option value="EVENING">Evening Shift (05:00 PM - 10:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Payment Status *</label>
                  <select
                    value={reservationForm.paymentStatus}
                    onChange={e => {
                      const newStatus = e.target.value;
                      const feeInfo = calculateFee({
                        passType: reservationForm.passType,
                        hasLocker: reservationForm.hasLocker,
                        seatId: reservationForm.seatId
                      });
                      const total = feeInfo.totalAmount;
                      const newAdvance = newStatus === 'PAID' ? total : (newStatus === 'PENDING' ? 0 : reservationForm.advanceAmount);
                      setReservationForm({
                        ...reservationForm,
                        paymentStatus: newStatus,
                        advanceAmount: newAdvance,
                        amountPaid: newAdvance,
                        pendingAmount: Math.max(0, total - newAdvance)
                      });
                    }}
                    style={{
                      width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box', fontWeight: 700,
                      color: reservationForm.paymentStatus === 'PAID' ? '#047857' : (reservationForm.paymentStatus === 'PARTIAL' ? '#D97706' : '#B45309')
                    }}
                  >
                    <option value="PAID">PAID (Full Payment)</option>
                    <option value="PARTIAL">PARTIAL (Advance Paid)</option>
                    <option value="PENDING">PENDING (Unpaid / Deferred)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Advance Paid (NPR)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={reservationForm.advanceAmount === 0 ? '' : reservationForm.advanceAmount}
                    onChange={e => {
                      const val = Math.max(0, Number(e.target.value.replace(/[^0-9]/g, '')) || 0);
                      const feeInfo = calculateFee({
                        passType: reservationForm.passType,
                        hasLocker: reservationForm.hasLocker,
                        seatId: reservationForm.seatId
                      });
                      const total = feeInfo.totalAmount;
                      const pending = Math.max(0, total - val);
                      let status = 'PENDING';
                      if (val >= total) status = 'PAID';
                      else if (val > 0) status = 'PARTIAL';

                      setReservationForm({
                        ...reservationForm,
                        advanceAmount: val,
                        amountPaid: val,
                        pendingAmount: pending,
                        paymentStatus: status
                      });
                    }}
                    placeholder="0"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Locker Option & Real-time Fee Summary */}
              {(() => {
                const feeInfo = calculateFee({
                  passType: reservationForm.passType,
                  hasLocker: reservationForm.hasLocker,
                  seatId: reservationForm.seatId
                });
                const total = feeInfo.totalAmount;
                const paid = Number(reservationForm.advanceAmount || 0);
                const pending = Math.max(0, total - paid);

                return (
                  <div style={{ backgroundColor: '#FEF3C7', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#92400E' }}>
                        <input
                          type="checkbox"
                          checked={reservationForm.hasLocker}
                          onChange={e => {
                            const newHasLocker = e.target.checked;
                            const newFeeInfo = calculateFee({
                              passType: reservationForm.passType,
                              hasLocker: newHasLocker,
                              seatId: reservationForm.seatId
                            });
                            const newTotal = newFeeInfo.totalAmount;
                            const currentAdvance = reservationForm.advanceAmount;
                            const newPending = Math.max(0, newTotal - currentAdvance);
                            let newStatus = reservationForm.paymentStatus;
                            if (currentAdvance >= newTotal) newStatus = 'PAID';
                            else if (currentAdvance > 0) newStatus = 'PARTIAL';
                            else newStatus = 'PENDING';

                            setReservationForm({
                              ...reservationForm,
                              hasLocker: newHasLocker,
                              totalAmount: newTotal,
                              pendingAmount: newPending,
                              paymentStatus: newStatus
                            });
                          }}
                        />
                        <span>Include Storage Locker (+NPR {reservationForm.passType === 'MONTHLY' ? '1,000' : reservationForm.passType === 'WEEKLY' ? '300' : '200'})</span>
                      </label>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#B45309', display: 'block' }}>
                          Base: NPR {feeInfo.basePrice} {feeInfo.lockerFee > 0 ? `+ Locker: NPR ${feeInfo.lockerFee}` : ''}
                        </span>
                        <strong style={{ fontSize: '1.1rem', color: '#78350F' }}>
                          Total Fee: NPR {total}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', paddingTop: '0.4rem', borderTop: '1px dashed #F59E0B' }}>
                      <div>
                        <span style={{ color: '#92400E', fontWeight: 600 }}>Advance Paid: </span>
                        <strong style={{ color: '#047857' }}>NPR {paid}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#92400E', fontWeight: 600 }}>Remaining Balance Due: </span>
                        <strong style={{ color: pending > 0 ? '#DC2626' : '#047857', fontWeight: 800 }}>
                          NPR {pending} {pending === 0 ? '(Cleared)' : `(${reservationForm.paymentStatus})`}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowReservationModal(false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleAdminReservationSubmit(e, 'RESERVE')}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #D97706', backgroundColor: '#FFFBEB', color: '#B45309', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  🟡 Hold as Reservation
                </button>
                <button
                  type="button"
                  onClick={(e) => handleAdminReservationSubmit(e, 'BOOK')}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  🟢 Book Cabin (Instant Check-In)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: EDIT BOOKING DETAILS ==================== */}
      {showEditBookingModal && selectedBookingForEdit && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 size={18} /> Modify Booking Reservation
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Code: {selectedBookingForEdit.bookingCode} • {selectedBookingForEdit.userName}</div>
              </div>
              <button onClick={() => setShowEditBookingModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditBookingSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Station & Pass Tier Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Assigned Station / Desk</label>
                  <select
                    value={editBookingForm.seatId}
                    onChange={e => {
                      const selectedSeat = seats.find(s => s.id === e.target.value);
                      const newSeatId = e.target.value;
                      const feeInfo = calculateFee({
                        passType: editBookingForm.passType || selectedBookingForEdit.passType || 'DAILY',
                        hasLocker: editBookingForm.hasLocker,
                        seatId: newSeatId
                      });
                      setEditBookingForm({
                        ...editBookingForm,
                        seatId: newSeatId,
                        seatNumber: selectedSeat ? selectedSeat.seatNumber : editBookingForm.seatNumber,
                        totalAmount: feeInfo.totalAmount
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value={selectedBookingForEdit.seatId}>Current: Desk {selectedBookingForEdit.seatNumber}</option>
                    {availableSeatsList.map(s => (
                      <option key={s.id} value={s.id}>Move to Desk {s.seatNumber} ({s.zone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Pass Plan / Tier</label>
                  <select
                    value={editBookingForm.passType || selectedBookingForEdit.passType || 'DAILY'}
                    onChange={e => {
                      const newPassType = e.target.value;
                      const feeInfo = calculateFee({
                        passType: newPassType,
                        hasLocker: editBookingForm.hasLocker,
                        seatId: editBookingForm.seatId
                      });
                      setEditBookingForm({
                        ...editBookingForm,
                        passType: newPassType,
                        totalAmount: feeInfo.totalAmount
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="DAILY">Daily Pass (NPR 350/day)</option>
                    <option value="WEEKLY">Weekly Pass (NPR 2,100/wk)</option>
                    <option value="MONTHLY">Monthly Pass (NPR 7,500/mo)</option>
                  </select>
                </div>
              </div>

              {/* Shift & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Shift</label>
                  <select
                    value={editBookingForm.shift}
                    onChange={e => setEditBookingForm({ ...editBookingForm, shift: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="FULL_DAY">Full Day</option>
                    <option value="MORNING">Morning Shift</option>
                    <option value="AFTERNOON">Afternoon Shift</option>
                    <option value="EVENING">Evening Shift</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Time Slot</label>
                  <input
                    type="text"
                    value={editBookingForm.bookingTime}
                    onChange={e => setEditBookingForm({ ...editBookingForm, bookingTime: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Status, Payment Clearing & Partial Payment Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Reservation Status</label>
                  <select
                    value={editBookingForm.status}
                    onChange={e => setEditBookingForm({ ...editBookingForm, status: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CHECKED_IN">Checked In (Occupied)</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Payment Status</label>
                  <select
                    value={editBookingForm.paymentStatus}
                    onChange={e => {
                      const newStatus = e.target.value;
                      const feeInfo = calculateFee({
                        passType: editBookingForm.passType || selectedBookingForEdit.passType || 'DAILY',
                        hasLocker: editBookingForm.hasLocker,
                        seatId: editBookingForm.seatId
                      });
                      const total = Number(editBookingForm.totalAmount) || feeInfo.totalAmount;
                      let newPaid = editBookingForm.amountPaid;
                      if (newStatus === 'PAID') newPaid = total;
                      else if (newStatus === 'PENDING') newPaid = 0;

                      setEditBookingForm({
                        ...editBookingForm,
                        paymentStatus: newStatus,
                        amountPaid: newPaid,
                        pendingAmount: Math.max(0, total - newPaid)
                      });
                    }}
                    style={{
                      width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box', fontWeight: 700,
                      color: editBookingForm.paymentStatus === 'PAID' ? '#047857' : (editBookingForm.paymentStatus === 'PARTIAL' ? '#D97706' : '#B45309')
                    }}
                  >
                    <option value="PAID">PAID (Full Payment)</option>
                    <option value="PARTIAL">PARTIAL (Partial Paid)</option>
                    <option value="PENDING">PENDING (Unpaid / Balance Due)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Total Amount Paid (NPR)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editBookingForm.amountPaid === 0 ? '' : editBookingForm.amountPaid}
                    onChange={e => {
                      const val = Math.max(0, Number(e.target.value.replace(/[^0-9]/g, '')) || 0);
                      const feeInfo = calculateFee({
                        passType: editBookingForm.passType || selectedBookingForEdit.passType || 'DAILY',
                        hasLocker: editBookingForm.hasLocker,
                        seatId: editBookingForm.seatId
                      });
                      const total = Number(editBookingForm.totalAmount) || feeInfo.totalAmount;
                      const pending = Math.max(0, total - val);
                      let status = 'PENDING';
                      if (val >= total) status = 'PAID';
                      else if (val > 0) status = 'PARTIAL';

                      setEditBookingForm({
                        ...editBookingForm,
                        amountPaid: val,
                        pendingAmount: pending,
                        paymentStatus: status
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Locker & Fee Recalculation + Quick Installment Action */}
              {(() => {
                const feeInfo = calculateFee({
                  passType: editBookingForm.passType || selectedBookingForEdit.passType || 'DAILY',
                  hasLocker: editBookingForm.hasLocker,
                  seatId: editBookingForm.seatId
                });
                const total = Number(editBookingForm.totalAmount) || feeInfo.totalAmount;
                const paid = Number(editBookingForm.amountPaid || 0);
                const pending = Math.max(0, total - paid);

                return (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                        <input
                          type="checkbox"
                          checked={editBookingForm.hasLocker}
                          onChange={e => {
                            const newHasLocker = e.target.checked;
                            const newFeeInfo = calculateFee({
                              passType: editBookingForm.passType || selectedBookingForEdit.passType || 'DAILY',
                              hasLocker: newHasLocker,
                              seatId: editBookingForm.seatId
                            });
                            const newTotal = newFeeInfo.totalAmount;
                            const newPending = Math.max(0, newTotal - paid);
                            let newStatus = editBookingForm.paymentStatus;
                            if (paid >= newTotal) newStatus = 'PAID';
                            else if (paid > 0) newStatus = 'PARTIAL';
                            else newStatus = 'PENDING';

                            setEditBookingForm({
                              ...editBookingForm,
                              hasLocker: newHasLocker,
                              totalAmount: newTotal,
                              pendingAmount: newPending,
                              paymentStatus: newStatus
                            });
                          }}
                        />
                        <span>Locker Access Included (+NPR { (editBookingForm.passType || selectedBookingForEdit.passType) === 'MONTHLY' ? '1,000' : (editBookingForm.passType || selectedBookingForEdit.passType) === 'WEEKLY' ? '300' : '200'})</span>
                      </label>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Calculated: Base NPR {feeInfo.basePrice} {feeInfo.lockerFee > 0 ? `+ Locker NPR ${feeInfo.lockerFee}` : ''}
                        </span>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          Total: NPR {total}
                        </div>
                      </div>
                    </div>

                    {/* Quick Installment Buttons */}
                    {pending > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F1F5F9', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Quick Add Payment:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const add = 500;
                            const newP = Math.min(total, paid + add);
                            const newPend = Math.max(0, total - newP);
                            setEditBookingForm({
                              ...editBookingForm,
                              amountPaid: newP,
                              pendingAmount: newPend,
                              paymentStatus: newP >= total ? 'PAID' : 'PARTIAL'
                            });
                          }}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                        >
                          +NPR 500
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const add = 1000;
                            const newP = Math.min(total, paid + add);
                            const newPend = Math.max(0, total - newP);
                            setEditBookingForm({
                              ...editBookingForm,
                              amountPaid: newP,
                              pendingAmount: newPend,
                              paymentStatus: newP >= total ? 'PAID' : 'PARTIAL'
                            });
                          }}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                        >
                          +NPR 1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditBookingForm({
                              ...editBookingForm,
                              amountPaid: total,
                              pendingAmount: 0,
                              paymentStatus: 'PAID'
                            });
                          }}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: 'none', backgroundColor: '#047857', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Settle Full NPR {pending}
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1' }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Amount Paid: <strong style={{ color: '#047857' }}>NPR {paid}</strong></span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Remaining Balance Due: </span>
                      <strong style={{ color: pending === 0 ? '#059669' : (editBookingForm.paymentStatus === 'PARTIAL' ? '#D97706' : '#DC2626'), fontWeight: 800 }}>
                        {pending === 0 ? 'NPR 0 (Paid in Full ✓)' : `NPR ${pending} (${editBookingForm.paymentStatus})`}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditBookingModal(false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: PACKAGE CRUD ==================== */}
      {showPackageModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} /> {editingPackage ? 'Edit Access Package' : 'Create Access Package'}
              </h3>
              <button onClick={() => setShowPackageModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePackageSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Monthly Pass"
                  value={packageForm.name}
                  onChange={e => setPackageForm({ ...packageForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Price (NPR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="7500"
                    value={packageForm.price}
                    onChange={e => setPackageForm({ ...packageForm, price: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Duration Label</label>
                  <input
                    type="text"
                    placeholder="month / week / day"
                    value={packageForm.duration}
                    onChange={e => setPackageForm({ ...packageForm, duration: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Features List (Comma-separated)</label>
                <textarea
                  rows={3}
                  placeholder="24/7 Access, High-Speed Wi-Fi, Locker Access, Free Coffee..."
                  value={packageForm.features}
                  onChange={e => setPackageForm({ ...packageForm, features: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={packageForm.lockerEligible}
                    onChange={e => setPackageForm({ ...packageForm, lockerEligible: e.target.checked })}
                  />
                  <span>Allow Locker Add-on for this package</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                {editingPackage ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePackageSubmit(editingPackage.id)}
                    style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Delete Package
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowPackageModal(false)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================== MODAL 6: RECORD PAYMENT ==================== */}
      {showRecordPaymentModal && selectedBookingForPayment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.70)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '92%', maxWidth: '520px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', margin: 'auto'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} /> Record Payment
              </h3>
              <button onClick={() => setShowRecordPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: 'calc(90vh - 70px)' }}>
              {/* Summary Card */}
              {(() => {
                const total = Number(selectedBookingForPayment.totalAmount || 0);
                const currentPaid = Number(selectedBookingForPayment.amountPaid || (selectedBookingForPayment.paymentStatus === 'PAID' ? total : 0));
                const currentPending = Math.max(0, total - currentPaid);
                const enteredAmt = Math.max(0, Number(paymentModalForm.paymentAmount) || 0);
                const newTotalPaid = Math.min(total, currentPaid + enteredAmt);
                const remainingLeft = Math.max(0, total - newTotalPaid);
                const resultingStatus = newTotalPaid >= total ? 'PAID' : (newTotalPaid > 0 ? 'PARTIAL' : 'PENDING');

                return (
                  <>
                    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '1rem', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#64748B' }}>Booking Ref:</span>
                        <strong style={{ color: '#0F172A' }}>{selectedBookingForPayment.bookingCode || selectedBookingForPayment.id}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#64748B' }}>Scholar:</span>
                        <strong style={{ color: '#0F172A' }}>{selectedBookingForPayment.userName}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#64748B' }}>Assigned Desk:</span>
                        <strong style={{ color: '#0F172A' }}>Desk {selectedBookingForPayment.seatNumber}</strong>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed #CBD5E1', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Total Fee</div>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>NPR {total.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Already Paid</div>
                          <div style={{ fontWeight: 800, color: '#047857' }}>NPR {currentPaid.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Current Balance</div>
                          <div style={{ fontWeight: 800, color: '#DC2626' }}>NPR {currentPending.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        Payment Option *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setPaymentModalForm({
                            ...paymentModalForm,
                            paymentType: 'FULL',
                            paymentAmount: currentPending
                          })}
                          style={{
                            padding: '0.6rem 0.8rem', borderRadius: '8px',
                            border: paymentModalForm.paymentType === 'FULL' ? '2px solid #047857' : '1px solid #CBD5E1',
                            backgroundColor: paymentModalForm.paymentType === 'FULL' ? '#ECFDF5' : '#FFFFFF',
                            color: paymentModalForm.paymentType === 'FULL' ? '#047857' : '#475569',
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center'
                          }}
                        >
                          💰 Full Settlement<br />
                          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>NPR {currentPending.toLocaleString()}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentModalForm({
                            ...paymentModalForm,
                            paymentType: 'PARTIAL',
                            paymentAmount: Math.min(currentPending, paymentModalForm.paymentAmount || Math.round(currentPending / 2))
                          })}
                          style={{
                            padding: '0.6rem 0.8rem', borderRadius: '8px',
                            border: paymentModalForm.paymentType === 'PARTIAL' ? '2px solid #D97706' : '1px solid #CBD5E1',
                            backgroundColor: paymentModalForm.paymentType === 'PARTIAL' ? '#FFFBEB' : '#FFFFFF',
                            color: paymentModalForm.paymentType === 'PARTIAL' ? '#B45309' : '#475569',
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center'
                          }}
                        >
                          💳 Partial Payment<br />
                          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Custom Advance / Installment</span>
                        </button>
                      </div>
                    </div>

                    {/* Payment Amount Input */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Payment Amount to Collect (NPR) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={currentPending > 0 ? currentPending : undefined}
                        value={paymentModalForm.paymentAmount}
                        onChange={e => {
                          const val = e.target.value;
                          const numVal = Number(val) || 0;
                          setPaymentModalForm({
                            ...paymentModalForm,
                            paymentAmount: val,
                            paymentType: numVal >= currentPending ? 'FULL' : 'PARTIAL'
                          });
                        }}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem', fontWeight: 800, boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Live Calculation Preview Card */}
                    <div style={{
                      backgroundColor: remainingLeft === 0 ? '#ECFDF5' : '#FFFBEB',
                      border: `1px solid ${remainingLeft === 0 ? '#A7F3D0' : '#FDE68A'}`,
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Collecting Now:</span>
                        <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>+ NPR {enteredAmt.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Updated Total Paid:</span>
                        <strong style={{ color: '#047857' }}>NPR {newTotalPaid.toLocaleString()} / NPR {total.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', marginTop: '0.2rem', borderTop: '1px dashed #CBD5E1' }}>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>Remaining Left Amount:</span>
                        <strong style={{ fontSize: '0.95rem', fontWeight: 800, color: remainingLeft === 0 ? '#047857' : '#D97706' }}>
                          {remainingLeft === 0 ? 'Nil ✓ (Fully Paid)' : `NPR ${remainingLeft.toLocaleString()}`}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Resulting Payment Status:</span>
                        <span style={{
                          padding: '0.15rem 0.55rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800,
                          backgroundColor: resultingStatus === 'PAID' ? '#D1FAE5' : resultingStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                          color: resultingStatus === 'PAID' ? '#065F46' : resultingStatus === 'PARTIAL' ? '#92400E' : '#991B1B'
                        }}>
                          {resultingStatus}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Payment Method Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Payment Channel / Method *
                </label>
                <select
                  value={paymentModalForm.paymentMethod}
                  onChange={e => setPaymentModalForm({ ...paymentModalForm, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, boxSizing: 'border-box' }}
                >
                  <option value="CASH">Cash Payment (Counter)</option>
                  <option value="ESEWA">eSewa Mobile Wallet</option>
                  <option value="KHALTI">Khalti Pay</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer / Fonepay</option>
                  <option value="CARD">Credit / Debit Card</option>
                </select>
              </div>

              {/* Reference Note */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Transaction Ref / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Partial advance receipt #104 or eSewa Txn 94821"
                  value={paymentModalForm.referenceNote}
                  onChange={e => setPaymentModalForm({ ...paymentModalForm, referenceNote: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', backgroundColor: '#047857', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <CheckCircle2 size={16} /> Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 7: MANAGE DESK & STATION ==================== */}
      {showSeatModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} /> {editingSeat ? `Edit Station #${editingSeat.seatNumber}` : 'Add New Station / Desk'}
              </h3>
              <button onClick={() => setShowSeatModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSeatFormSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Desk / Station Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-12"
                    value={seatForm.seatNumber}
                    onChange={e => setSeatForm({ ...seatForm, seatNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Study Zone *</label>
                  <select
                    value={seatForm.zone}
                    onChange={e => {
                      const selectedZ = zones.find(z => z.name === e.target.value);
                      setSeatForm({ 
                        ...seatForm, 
                        zone: e.target.value,
                        pricePerDay: selectedZ ? selectedZ.pricePerDay : seatForm.pricePerDay
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, boxSizing: 'border-box' }}
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name} (NPR {z.pricePerDay}/day)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Station Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Single Desk"
                    value={seatForm.type}
                    onChange={e => setSeatForm({ ...seatForm, type: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Daily Rate (NPR) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={seatForm.pricePerDay}
                    onChange={e => setSeatForm({ ...seatForm, pricePerDay: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Station Status</label>
                <select
                  value={seatForm.status}
                  onChange={e => setSeatForm({ ...seatForm, status: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, boxSizing: 'border-box' }}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied (Checked In)</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Station Features (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Power Outlet, Ergonomic Chair, Reading Light..."
                  value={seatForm.features}
                  onChange={e => setSeatForm({ ...seatForm, features: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                {editingSeat ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSeatSubmit(editingSeat.id)}
                    style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Delete Station
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowSeatModal(false)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {editingSeat ? 'Save Station' : 'Create Station'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 8: MANAGE STUDY ZONE ==================== */}
      {showZoneModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#D97706', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} /> {editingZone ? `Edit Study Zone: ${editingZone.name}` : 'Create New Study Zone'}
              </h3>
              <button onClick={() => setShowZoneModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveZone} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Study Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Quiet Zone, Mezzanine Lounge"
                  value={zoneForm.name}
                  onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Max Capacity (Desks) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={zoneForm.capacity}
                    onChange={e => setZoneForm({ ...zoneForm, capacity: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Base Rate (NPR / Day) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={zoneForm.pricePerDay}
                    onChange={e => setZoneForm({ ...zoneForm, pricePerDay: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Zone Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe environment, noise policy, and features of this study zone..."
                  value={zoneForm.description}
                  onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                {editingZone ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowZoneModal(false);
                      handleDeleteZoneClick(editingZone.id, editingZone.name);
                    }}
                    style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Delete Zone
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowZoneModal(false)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {editingZone ? 'Save Changes' : 'Create Study Zone'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== WALK-IN STUDENT ADMISSION MODAL ==================== */}
      <WalkinStudentModal
        isOpen={showWalkinStudentModal}
        onClose={() => {
          setShowWalkinStudentModal(false);
          setPreselectedSeatForWalkin(null);
        }}
        seats={seats}
        lockers={lockers}
        plans={plans}
        preselectedSeat={preselectedSeatForWalkin}
        onSubmitSuccess={handleWalkinStudentRegistration}
      />

      {/* ==================== REGISTRATION RECEIPT VOUCHER MODAL ==================== */}
      <RegistrationReceiptModal
        isOpen={showRegistrationReceiptModal}
        onClose={() => {
          setShowRegistrationReceiptModal(false);
          setRegistrationReceiptData(null);
        }}
        receiptData={registrationReceiptData}
      />

      <CabinStudentSelectModal
        isOpen={showCabinStudentModal}
        onClose={() => {
          setShowCabinStudentModal(false);
          setSelectedSeatForCabinModal(null);
        }}
        cabinSeat={selectedSeatForCabinModal}
        onAssignStudent={async (seat, student, mode, bookingDetails = {}) => {
          try {
            const {
              passType = 'DAILY', shift = 'FULL_DAY', shiftTime = '07:00 AM – 10:00 PM',
              startDate = new Date().toISOString().split('T')[0],
              endDate = new Date().toISOString().split('T')[0],
              hasLocker = false, lockerNumber = '',
              paymentMethod = 'CASH', amountPaid = 0,
              pendingAmount = 0, paymentStatus = 'PAID',
              totalAmount = seat.pricePerDay || 500,
              basePrice = seat.pricePerDay || 500, lockerFee = 0,
              bookingTime = shiftTime
            } = bookingDetails;

            const displayName = student.fullName || student.name || 'Scholar';
            const newStatus = mode === 'BOOK' ? 'OCCUPIED' : 'RESERVED';

            // Check if student already holds another active desk
            const todayStr = new Date().toISOString().split('T')[0];
            const dupBooking = (bookings || []).find(b => {
              if (['CANCELLED', 'COMPLETED'].includes(b.status)) return false;
              if (b.endDate && b.endDate < todayStr) return false;
              if (seat.id && b.seatId === seat.id) return false;
              const matchesUser = (student.id && b.userId === student.id) ||
                                  (student.phone && b.userPhone && b.userPhone.replace(/\D/g, '') === (student.phone || '').replace(/\D/g, '')) ||
                                  (student.email && b.userEmail && (student.email || '').trim() && b.userEmail.toLowerCase() === (student.email || '').toLowerCase());
              return matchesUser;
            });

            if (dupBooking) {
              alert(`⚠️ Scholar "${displayName}" already holds an active desk (Desk ${dupBooking.seatNumber}, valid until ${dupBooking.endDate || 'active'}). A student cannot hold multiple active desks simultaneously.`);
              return;
            }

            // 1) Create booking in Firestore
            const bookingCode = `QD-MAP-${Math.floor(1000 + Math.random() * 9000)}`;
            await createBooking({
              bookingCode,
              userId: student.id,
              userCode: student.userCode || '',
              userName: displayName,
              userEmail: student.email || '',
              userPhone: student.phone || '',
              seatId: seat.id,
              seatNumber: seat.seatNumber,
              zone: seat.zone || '',
              passType,
              shift,
              bookingTime,
              startDate,
              endDate,
              hasLocker,
              lockerNumber: hasLocker ? lockerNumber : '',
              basePrice: Number(basePrice),
              lockerFee: Number(lockerFee),
              totalAmount: Number(totalAmount),
              amountPaid: Number(amountPaid),
              pendingAmount: Number(pendingAmount),
              paymentStatus,
              paymentMethod,
              paymentHistory: Number(amountPaid) > 0 ? [{
                amount: Number(amountPaid),
                method: paymentMethod,
                type: Number(pendingAmount) === 0 ? 'FULL' : 'ADVANCE',
                note: 'Admin Floor Map Assignment',
                recordedAt: new Date().toISOString()
              }] : [],
              status: 'CONFIRMED',
              bookingType: 'ADMIN_FLOOR_MAP',
              createdAt: new Date().toISOString()
            });

            // 2) Update seat status in Firestore
            await changeSeatStatus(seat.id, newStatus);

            // 3) Assign locker if requested
            if (hasLocker && lockerNumber) {
              const matchingLocker = lockers.find(l => l.lockerNumber === lockerNumber || l.id === lockerNumber);
              if (matchingLocker) {
                await assignLocker(matchingLocker.id, {
                  userId: student.id,
                  userName: displayName,
                  userPhone: student.phone || '',
                  userEmail: student.email || '',
                  seatNumber: seat.seatNumber,
                  passType,
                  startDate,
                  endDate,
                  notes: `Assigned from floor map to ${displayName}`
                });
              }
            }

            // 4) Update user record
            await updateUser(student.id, {
              assignedSeat: `Desk ${seat.seatNumber}`,
              seatNumber: seat.seatNumber,
              passType,
              status: 'ACTIVE',
              membershipStatus: 'ACTIVE'
            });

            alert(`✅ Desk ${seat.seatNumber} assigned to ${displayName}!\nBooking Code: ${bookingCode}\nTotal: NPR ${Number(totalAmount).toLocaleString()}${Number(pendingAmount) > 0 ? `\n⚠ Due: NPR ${Number(pendingAmount).toLocaleString()}` : ' (Fully Paid)'}`);
          } catch (err) {
            console.error('Error assigning student:', err);
            alert('Failed to assign student: ' + err.message);
          }
        }}
        onReleaseCabin={async (seat) => {
          try {
            const activeBooking = bookings.find(b =>
              (b.seatId === seat.id || b.seatNumber === seat.seatNumber) &&
              ['CHECKED_IN', 'OCCUPIED', 'RESERVED', 'CONFIRMED'].includes(b.status)
            );
            if (activeBooking) {
              await changeBookingStatus(activeBooking.id, seat.id, 'COMPLETED');
              await changeSeatStatus(seat.id, 'AVAILABLE');

              // Automatically mark user INACTIVE if they have no other active bookings
              if (activeBooking.userId) {
                const todayCheckStr = new Date().toISOString().split('T')[0];
                const hasOtherActive = bookings.some(other =>
                  other.id !== activeBooking.id &&
                  (other.userId === activeBooking.userId || (other.userPhone && activeBooking.userPhone && other.userPhone.replace(/\D/g, '') === activeBooking.userPhone.replace(/\D/g, ''))) &&
                  !['CANCELLED', 'COMPLETED'].includes(other.status) &&
                  (!other.endDate || other.endDate >= todayCheckStr)
                );
                if (!hasOtherActive) {
                  await updateUser(activeBooking.userId, {
                    membershipStatus: 'INACTIVE',
                    status: 'INACTIVE',
                    assignedSeat: '',
                    seatNumber: ''
                  });
                }
              }

              // Also release any locker assigned to this booking
              if (activeBooking.lockerNumber) {
                const matchingLocker = lockers.find(l => l.lockerNumber === activeBooking.lockerNumber);
                if (matchingLocker && matchingLocker.status === 'ASSIGNED') {
                  await releaseLocker(matchingLocker.id);
                }
              }
            } else {
              await changeSeatStatus(seat.id, 'AVAILABLE');
            }
            alert(`✅ Desk #${seat.seatNumber} is now AVAILABLE and occupant marked INACTIVE.`);
          } catch (err) {
            console.error('Error releasing cabin:', err);
            alert('Failed to release cabin: ' + err.message);
          }
        }}
        onOpenWalkinForCabin={(seat) => {
          setShowCabinStudentModal(false);
          setPreselectedSeatForWalkin(seat);
          setShowWalkinStudentModal(true);
        }}
      />

      {/* ==================== DIGITAL STORAGE LOCKER MANAGE MODAL ==================== */}
      <LockerManageModal
        isOpen={showLockerModal}
        onClose={() => {
          setShowLockerModal(false);
          setSelectedLockerForModal(null);
        }}
        locker={selectedLockerForModal}
        onAssignLocker={async (lockerId, assignmentData) => {
          try {
            await assignLocker(lockerId, assignmentData);
            alert(`✅ ${selectedLockerForModal?.label || selectedLockerForModal?.lockerNumber} successfully assigned to ${assignmentData.userName}!`);
          } catch (err) {
            console.error('Error assigning locker:', err);
            alert('Failed to assign locker: ' + err.message);
          }
        }}
        onReleaseLocker={async (lockerId) => {
          try {
            await releaseLocker(lockerId);
            alert(`✅ ${selectedLockerForModal?.label || selectedLockerForModal?.lockerNumber} is now set back to AVAILABLE.`);
          } catch (err) {
            console.error('Error releasing locker:', err);
            alert('Failed to release locker: ' + err.message);
          }
        }}
        onUpdateStatus={async (lockerId, status, details) => {
          try {
            await updateLockerStatus(lockerId, status, details);
            alert(`✅ ${selectedLockerForModal?.label || selectedLockerForModal?.lockerNumber} status updated to ${status}.`);
          } catch (err) {
            console.error('Error updating locker status:', err);
            alert('Failed to update status: ' + err.message);
          }
        }}
      />

      <ReservationConfirmModal
        isOpen={showReservationConfirmModal}
        onClose={() => {
          setShowReservationConfirmModal(false);
          setSelectedBookingForConfirmation(null);
        }}
        booking={selectedBookingForConfirmation}
      />

    </div>
  );
};

