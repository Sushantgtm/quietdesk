import React, { useState, useEffect } from 'react';
import {
  X, Search, UserCheck, CheckCircle2, UserPlus, Phone, Calendar,
  Clock, MapPin, AlertCircle, Lock, Key, DollarSign, User
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { calculatePackageEndDate } from '../../utils/dateUtils';

export const CabinStudentSelectModal = ({
  isOpen,
  onClose,
  cabinSeat,
  onAssignStudent,
  onReleaseCabin,
  onOpenWalkinForCabin,
  onViewProfile
}) => {
  const bookingCtx = useBooking() || {};
  const { users = [], bookings = [], seats = [], lockers = [], updateBookingDetails, assignLocker } = bookingCtx;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState('BOOK'); // 'BOOK' | 'RESERVE'
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Booking form fields ──
  const today = new Date().toISOString().split('T')[0];
  const [passType, setPassType] = useState('DAILY');
  const [shift, setShift] = useState('FULL_DAY');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [hasLocker, setHasLocker] = useState(false);
  const [lockerNumber, setLockerNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');

  // ── Extension state ──
  const [extensionMode, setExtensionMode] = useState(false);
  const [customExtendEndDate, setCustomExtendEndDate] = useState('');
  const [extensionSuccessMsg, setExtensionSuccessMsg] = useState('');

  // ── Auto-compute default end date based on pass type (unified dateUtils) ──
  const computeEndDate = (start, pt) => {
    if (!start) return today;
    return calculatePackageEndDate(start, pt);
  };

  // Reset form whenever a new seat is opened
  useEffect(() => {
    if (isOpen && cabinSeat) {
      setSelectedStudent(null);
      setSearchQuery('');
      setAssignmentMode('BOOK');
      setPassType('DAILY');
      setShift('FULL_DAY');
      const t = new Date().toISOString().split('T')[0];
      setStartDate(t);
      setEndDate(t);
      setHasLocker(false);
      setLockerNumber('');
      setPaymentMethod('CASH');
      setExtensionMode(false);
      setCustomExtendEndDate('');
      setExtensionSuccessMsg('');
      const rate = Number(cabinSeat.pricePerDay) || 500;
      setAmountPaid(String(rate));
    }
  }, [isOpen, cabinSeat?.id, cabinSeat?.seatNumber]);

  if (!isOpen || !cabinSeat) return null;

  // ── Price Calculations ──
  const seatRate = Number(cabinSeat.pricePerDay) || 500;
  const basePrice = passType === 'DAILY' ? seatRate : passType === 'WEEKLY' ? 2100 : 7500;
  const lockerFee = hasLocker ? (passType === 'DAILY' ? 200 : passType === 'WEEKLY' ? 300 : 1000) : 0;
  const totalAmount = basePrice + lockerFee;
  const parsedPaid = Math.min(totalAmount, Math.max(0, Number(amountPaid) || totalAmount));
  const pendingAmount = Math.max(0, totalAmount - parsedPaid);
  const paymentStatus = parsedPaid >= totalAmount ? 'PAID' : parsedPaid > 0 ? 'PARTIAL' : 'PENDING';

  // ── Shift options (Operating hours: 6:00 AM - 9:00 PM) ──
  const SHIFTS = [
    { id: 'MORNING', label: 'Morning', time: '06:00 AM – 12:00 PM' },
    { id: 'AFTERNOON', label: 'Afternoon', time: '12:00 PM – 05:00 PM' },
    { id: 'EVENING', label: 'Evening', time: '05:00 PM – 09:00 PM' },
    { id: 'FULL_DAY', label: 'Full Day', time: '06:00 AM – 09:00 PM' },
  ];
  const shiftTime = SHIFTS.find(s => s.id === shift)?.time || '06:00 AM – 09:00 PM';

  const handlePassTypeChange = (pt) => {
    setPassType(pt);
    setEndDate(computeEndDate(startDate, pt));
    const newBase = pt === 'DAILY' ? seatRate : pt === 'WEEKLY' ? 2100 : 7500;
    const newLocker = hasLocker ? (pt === 'DAILY' ? 200 : pt === 'WEEKLY' ? 300 : 1000) : 0;
    setAmountPaid(String(newBase + newLocker));
  };

  const handleStartDateChange = (sd) => {
    setStartDate(sd);
    setEndDate(computeEndDate(sd, passType));
  };

  // ── Occupancy check for this specific cabin ──
  const currentOccupantBooking = (bookings || []).find(b =>
    (b?.seatId === cabinSeat.id || b?.seatNumber === cabinSeat.seatNumber) &&
    ['CHECKED_IN', 'OCCUPIED', 'RESERVED', 'CONFIRMED'].includes(b?.status)
  );
  const isCabinBusy = cabinSeat.status === 'OCCUPIED' || cabinSeat.status === 'RESERVED' || !!currentOccupantBooking;

  // ── Find assigned key locker for this cabin occupant ──
  const assignedLocker = (lockers || []).find(l =>
    (currentOccupantBooking && l.assignedToUserId === currentOccupantBooking.userId) ||
    l.assignedSeatNumber === cabinSeat.seatNumber ||
    (currentOccupantBooking?.lockerNumber && (l.lockerNumber === currentOccupantBooking.lockerNumber || l.id === currentOccupantBooking.lockerNumber))
  );

  // ── Calculate Time Remaining & Expiry Progress Bar (Timezone-Safe) ──
  const parseDateOnly = (str) => {
    if (!str) return new Date();
    const parts = str.split('T')[0].split('-');
    if (parts.length < 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
  };

  const startDateStr = currentOccupantBooking?.startDate || today;
  const endDateStr = currentOccupantBooking?.endDate || today;
  const passTypeVal = currentOccupantBooking?.passType || 'MONTHLY';

  const startD = parseDateOnly(startDateStr);
  const endD = parseDateOnly(endDateStr);
  const nowD = new Date();
  nowD.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const rawDiffDays = Math.round((endD.getTime() - startD.getTime()) / msPerDay);
  const defaultPassDays = passTypeVal === 'DAILY' ? 1 : passTypeVal === 'WEEKLY' ? 7 : 30;
  const totalDurationDays = Math.max(1, rawDiffDays > 0 ? rawDiffDays : defaultPassDays);
  
  const daysRemaining = Math.round((endD.getTime() - nowD.getTime()) / msPerDay);
  const daysElapsed = Math.max(0, Math.round((nowD.getTime() - startD.getTime()) / msPerDay));

  // Percentage remaining (0% to 100%)
  let percentRemaining = 0;
  if (daysRemaining > 0) {
    percentRemaining = Math.max(5, Math.min(100, Math.round((daysRemaining / totalDurationDays) * 100)));
  } else if (daysRemaining === 0) {
    percentRemaining = Math.max(5, Math.round((1 / totalDurationDays) * 100)); // Last active day
  } else {
    percentRemaining = 0;
  }

  // Dynamic status styling based on days remaining
  let barFillColor = '#10B981'; // Green
  let barGradient = 'linear-gradient(90deg, #10B981 0%, #059669 100%)';
  let barBgColor = '#DCFCE7';
  let statusBadgeText = `${daysRemaining} Days Remaining (Active)`;
  let statusBadgeBg = '#DCFCE7';
  let statusBadgeColor = '#15803D';
  let isExpiringSoon = false;
  let isExpired = false;

  if (daysRemaining < 0) {
    isExpired = true;
    barFillColor = '#EF4444';
    barGradient = 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)';
    barBgColor = '#FEE2E2';
    statusBadgeText = `Expired ${Math.abs(daysRemaining)} Days Ago`;
    statusBadgeBg = '#FEE2E2';
    statusBadgeColor = '#991B1B';
  } else if (daysRemaining === 0) {
    isExpiringSoon = true;
    barFillColor = '#EF4444';
    barGradient = 'linear-gradient(90deg, #F87171 0%, #DC2626 100%)';
    barBgColor = '#FEE2E2';
    statusBadgeText = 'Expires Today! (Last Active Day)';
    statusBadgeBg = '#FEE2E2';
    statusBadgeColor = '#991B1B';
  } else if (daysRemaining <= 3) {
    isExpiringSoon = true;
    barFillColor = '#EF4444';
    barGradient = 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)';
    barBgColor = '#FEE2E2';
    statusBadgeText = `${daysRemaining} Days Left • Expiring in ≤3 Days!`;
    statusBadgeBg = '#FEE2E2';
    statusBadgeColor = '#991B1B';
  } else if (daysRemaining <= 7) {
    isExpiringSoon = true;
    barFillColor = '#F59E0B'; // Amber / Orange
    barGradient = 'linear-gradient(90deg, #FBBF24 0%, #D97706 100%)';
    barBgColor = '#FEF3C7';
    statusBadgeText = `${daysRemaining} Days Left • 7-Day Extension Window Open!`;
    statusBadgeBg = '#FEF3C7';
    statusBadgeColor = '#92400E';
  }

  // Handle Extend Booking
  const handleExtendBooking = async (additionalDays) => {
    if (!currentOccupantBooking) return;
    setIsProcessing(true);
    try {
      let targetNewEndDate = '';
      if (additionalDays === 'CUSTOM') {
        if (!customExtendEndDate) {
          alert('Please select a valid new expiry date.');
          setIsProcessing(false);
          return;
        }
        targetNewEndDate = customExtendEndDate;
      } else {
        const baseEnd = new Date(currentOccupantBooking.endDate || today);
        baseEnd.setDate(baseEnd.getDate() + Number(additionalDays));
        targetNewEndDate = baseEnd.toISOString().split('T')[0];
      }

      if (updateBookingDetails) {
        await updateBookingDetails(currentOccupantBooking.id, {
          endDate: targetNewEndDate,
          extendedAt: new Date().toISOString(),
          notes: `${currentOccupantBooking.notes || ''} [Extended to ${targetNewEndDate}]`.trim()
        });
      }

      // If locker assigned, extend locker too
      if (assignedLocker && assignLocker) {
        await assignLocker(assignedLocker.id, {
          endDate: targetNewEndDate
        });
      }

      setExtensionSuccessMsg(`✅ Reservation successfully extended until ${targetNewEndDate}!`);
      setExtensionMode(false);
      setTimeout(() => setExtensionSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to extend reservation: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Map of active seats for each user ──
  const activeUserSeats = {};
  const todayCheck = new Date().toISOString().split('T')[0];
  (bookings || []).forEach(b => {
    if (b && ['CHECKED_IN', 'OCCUPIED', 'RESERVED', 'CONFIRMED'].includes(b.status) && (!b.endDate || b.endDate >= todayCheck)) {
      if (b.userId) activeUserSeats[b.userId] = b.seatNumber;
      if (b.userPhone) activeUserSeats[b.userPhone.replace(/\D/g, '')] = b.seatNumber;
      if (b.userEmail) activeUserSeats[b.userEmail.toLowerCase().trim()] = b.seatNumber;
    }
  });

  // ── Filter available registered students (Exclude scholars already holding an active cabin) ──
  const filteredStudents = (users || []).filter(u => {
    if (!u) return false;
    const phoneClean = (u.phone || '').replace(/\D/g, '');
    const emailClean = (u.email || '').toLowerCase().trim();
    const isOccupyingSeat = activeUserSeats[u.id] || (phoneClean && activeUserSeats[phoneClean]) || (emailClean && activeUserSeats[emailClean]);
    
    // Disallow assigning a second seat to a scholar who already holds an active desk
    if (isOccupyingSeat) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (u.fullName || u.name || '').toLowerCase().includes(q);
    const codeMatch = (u.userCode || u.studentCode || u.id || '').toLowerCase().includes(q);
    const phoneMatch = (u.phone || '').includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    return nameMatch || codeMatch || phoneMatch || emailMatch;
  });

  // Available lockers sorted alphabetically A to T
  const availableLockers = (lockers || [])
    .filter(l => l?.status === 'AVAILABLE')
    .sort((a, b) => (a.label || a.lockerNumber || '').localeCompare(b.label || b.lockerNumber || '', undefined, { numeric: true, sensitivity: 'base' }));

  // ── Confirm assignment ──
  const handleConfirmAssignment = async () => {
    if (!selectedStudent) return;
    setIsProcessing(true);
    try {
      if (onAssignStudent) {
        await onAssignStudent(cabinSeat, selectedStudent, assignmentMode, {
          passType,
          shift,
          shiftTime,
          startDate,
          endDate,
          hasLocker,
          lockerNumber,
          paymentMethod,
          amountPaid: parsedPaid,
          pendingAmount,
          paymentStatus,
          totalAmount,
          basePrice,
          lockerFee,
          bookingTime: shiftTime,
        });
      }
      onClose();
    } catch (err) {
      alert('Failed to assign student to cabin: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Release seat ──
  const handleRelease = async () => {
    if (window.confirm(`Release Desk ${cabinSeat.seatNumber} and make it AVAILABLE?`)) {
      setIsProcessing(true);
      try {
        if (onReleaseCabin) await onReleaseCabin(cabinSeat);
        onClose();
      } catch (err) {
        alert('Failed to release cabin: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
    border: '1px solid #CBD5E1', fontSize: '0.83rem', boxSizing: 'border-box',
    fontWeight: 600, color: '#0F172A', backgroundColor: '#FFFFFF'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 99999, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '18px', width: '100%',
        maxWidth: '740px', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column'
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '1.15rem 1.5rem', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#0F172A', borderTopLeftRadius: '17px', borderTopRightRadius: '17px', color: '#FFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              backgroundColor: isCabinBusy ? '#DC2626' : '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '1.05rem', border: '2px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF'
            }}>
              {cabinSeat.seatNumber}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Desk #{cabinSeat.seatNumber}</div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                {cabinSeat.zone || 'Study Zone'} · NPR {seatRate}/day
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              color: '#FFF', width: '32px', height: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {extensionSuccessMsg && (
            <div style={{
              padding: '0.75rem 1rem', backgroundColor: '#DCFCE7', color: '#166534',
              borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', border: '1px solid #86EFAC'
            }}>
              {extensionSuccessMsg}
            </div>
          )}

          {/* ════ CASE 1: CABIN OCCUPIED ════ */}
          {isCabinBusy ? (
            <>
              <div style={{
                backgroundColor: isExpired ? '#FEF2F2' : isExpiringSoon ? '#FFFBEB' : '#F8FAFC',
                border: `1.5px solid ${isExpired ? '#F87171' : isExpiringSoon ? '#FCD34D' : '#CBD5E1'}`,
                borderRadius: '14px', padding: '1.4rem'
              }}>
                {/* Status & Locker Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px',
                    backgroundColor: cabinSeat.status === 'OCCUPIED' ? '#FEE2E2' : '#FEF3C7',
                    color: cabinSeat.status === 'OCCUPIED' ? '#991B1B' : '#92400E', textTransform: 'uppercase'
                  }}>
                    {cabinSeat.status === 'OCCUPIED' ? '🔴 OCCUPIED / ASSIGNED' : '🟡 RESERVED'}
                  </span>

                  {/* Alphabetical Key Locker Badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '4px 12px', borderRadius: '20px',
                    backgroundColor: assignedLocker ? '#EFF6FF' : '#F1F5F9',
                    border: `1px solid ${assignedLocker ? '#93C5FD' : '#CBD5E1'}`,
                    color: assignedLocker ? '#1D4ED8' : '#64748B',
                    fontSize: '0.78rem', fontWeight: 800
                  }}>
                    <Key size={14} style={{ color: assignedLocker ? '#2563EB' : '#94A3B8' }} />
                    <span>{assignedLocker ? `Assigned Key Locker: ${assignedLocker.label || assignedLocker.lockerNumber}` : 'No Key Locker Assigned'}</span>
                  </div>
                </div>

                {/* ── TIME REMAINING PROGRESS / LOADING BAR ── */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  border: `1.5px solid ${isExpired ? '#FCA5A5' : isExpiringSoon ? '#FDE68A' : '#E2E8F0'}`,
                  marginBottom: '1.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.02em' }}>
                      <Clock size={15} style={{ color: barFillColor }} />
                      Time Remaining ({daysRemaining > 0 ? `${daysRemaining} of ${totalDurationDays} Days` : isExpired ? 'Expired' : 'Last Day'})
                    </span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 800,
                      padding: '3px 10px', borderRadius: '8px',
                      backgroundColor: statusBadgeBg, color: statusBadgeColor,
                      border: `1px solid ${statusBadgeColor}33`
                    }}>
                      {statusBadgeText}
                    </span>
                  </div>

                  {/* Progress / Loading Bar */}
                  <div style={{
                    width: '100%',
                    height: '18px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{
                      width: `${percentRemaining}%`,
                      height: '100%',
                      background: barGradient,
                      borderRadius: '20px',
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: percentRemaining > 15 ? '8px' : '0px',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      {percentRemaining > 18 && `${percentRemaining}%`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#475569', fontWeight: 600, marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span>Admission / Start: <strong style={{ color: '#0F172A' }}>{startDateStr}</strong></span>
                    <span>Elapsed: <strong style={{ color: '#0F172A' }}>{daysElapsed} {daysElapsed === 1 ? 'Day' : 'Days'}</strong></span>
                    <span>Valid Until / Expiry: <strong style={{ color: isExpiringSoon || isExpired ? '#DC2626' : '#0F172A' }}>{endDateStr}</strong></span>
                  </div>
                </div>

                {/* Occupant Profile & Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  {[
                    ['Assigned Scholar', currentOccupantBooking?.userName || '—'],
                    ['Contact Phone', currentOccupantBooking?.userPhone || '—'],
                    ['Contact Email', currentOccupantBooking?.userEmail || '—'],
                    ['Booking Code', currentOccupantBooking?.bookingCode || '—'],
                    ['Pass Duration', `${currentOccupantBooking?.passType || 'MONTHLY'} Pass`],
                    ['Assigned Locker', assignedLocker ? `${assignedLocker.label || assignedLocker.lockerNumber} (Key Locker)` : 'None'],
                    ['Shift / Hours', currentOccupantBooking?.shift || currentOccupantBooking?.bookingTime || 'Full Day (06:00 AM – 09:00 PM)'],
                    ['Payment Status', currentOccupantBooking?.paymentStatus || 'PAID'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '1px' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {currentOccupantBooking && Number(currentOccupantBooking.pendingAmount) > 0 && (
                  <div style={{ marginTop: '0.85rem', padding: '0.5rem 0.75rem', backgroundColor: '#FEF3C7', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#92400E' }}>
                    ⚠ Outstanding Due: NPR {Number(currentOccupantBooking.pendingAmount).toLocaleString()}
                  </div>
                )}
              </div>

              {/* ── VIEW STUDENT COMPLETE PROFILE ── */}
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: '12px',
                padding: '1.1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={18} /> Student Profile & Access Management
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: '0.2rem' }}>
                    View complete student details, dues, package renewal, cabin change, and financial history.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onViewProfile) {
                      const studentUser = users.find(u =>
                        u.id === currentOccupantBooking?.userId ||
                        (u.phone && currentOccupantBooking?.userPhone && u.phone.replace(/\D/g, '') === currentOccupantBooking.userPhone.replace(/\D/g, ''))
                      ) || {
                        id: currentOccupantBooking?.userId,
                        userCode: currentOccupantBooking?.userCode,
                        fullName: currentOccupantBooking?.userName,
                        phone: currentOccupantBooking?.userPhone,
                        email: currentOccupantBooking?.userEmail,
                        address: currentOccupantBooking?.userAddress,
                        seatId: currentOccupantBooking?.seatId,
                        seatNumber: currentOccupantBooking?.seatNumber,
                        passType: currentOccupantBooking?.passType,
                        status: 'ACTIVE'
                      };
                      onViewProfile(studentUser);
                    }
                  }}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    backgroundColor: '#1E40AF',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)'
                  }}
                >
                  <User size={15} /> View Profile
                </button>
              </div>

              {/* ── ADVANCE BOOKING FOR NEXT PERSON AFTER EXPIRY ── */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>
                    Book this cabin for another scholar after {endDateStr}?
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Seat becomes available for the next reservation starting on {endDateStr}.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenWalkinForCabin) {
                      onOpenWalkinForCabin({
                        ...cabinSeat,
                        suggestedStartDate: endDateStr
                      });
                    }
                  }}
                  style={{
                    padding: '0.45rem 0.9rem',
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <UserPlus size={14} /> Book Next Scholar
                </button>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', flexWrap: 'wrap' }}>
                <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onViewProfile) {
                      const studentUser = users.find(u =>
                        u.id === currentOccupantBooking?.userId ||
                        (u.phone && currentOccupantBooking?.userPhone && u.phone.replace(/\D/g, '') === currentOccupantBooking.userPhone.replace(/\D/g, ''))
                      ) || {
                        id: currentOccupantBooking?.userId,
                        userCode: currentOccupantBooking?.userCode,
                        fullName: currentOccupantBooking?.userName,
                        phone: currentOccupantBooking?.userPhone,
                        email: currentOccupantBooking?.userEmail,
                        address: currentOccupantBooking?.userAddress,
                        seatId: currentOccupantBooking?.seatId,
                        seatNumber: currentOccupantBooking?.seatNumber,
                        passType: currentOccupantBooking?.passType,
                        status: 'ACTIVE'
                      };
                      onViewProfile(studentUser);
                    }
                  }}
                  style={{
                    padding: '0.6rem 1.35rem',
                    backgroundColor: '#1E40AF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    color: '#FFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <User size={15} /> View Profile
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleRelease}
                  style={{ padding: '0.6rem 1.5rem', backgroundColor: '#DC2626', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <CheckCircle2 size={16} /> {isProcessing ? 'Releasing...' : 'Release & Free Desk'}
                </button>
              </div>
            </>
          ) : (
            /* ════ CASE 2: CABIN AVAILABLE — ASSIGN/RESERVE ════ */
            <>
              {/* Walk-in shortcut banner */}
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF' }}>Registering a new walk-in student?</div>
                  <div style={{ fontSize: '0.75rem', color: '#3B82F6' }}>Desk #{cabinSeat.seatNumber} will be pre-selected in the admission form.</div>
                </div>
                <button
                  onClick={() => onOpenWalkinForCabin && onOpenWalkinForCabin(cabinSeat)}
                  style={{ padding: '0.45rem 0.9rem', backgroundColor: '#2563EB', color: '#FFF', borderRadius: '6px', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <UserPlus size={14} /> + New Walk-in
                </button>
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  Select Existing Registered Scholar ({filteredStudents.length}):
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                  {[['BOOK', '🟢 Book / Occupy Now', '#16A34A'], ['RESERVE', '🟡 Reserve Seat', '#D97706']].map(([mode, label, activeColor]) => (
                    <button key={mode} type="button" onClick={() => setAssignmentMode(mode)} style={{
                      padding: '4px 12px', borderRadius: '6px', border: 'none',
                      backgroundColor: assignmentMode === mode ? activeColor : 'transparent',
                      color: assignmentMode === mode ? '#FFFFFF' : '#64748B',
                      fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student search */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search scholars by name, phone, email, or Student ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                />
              </div>

              {/* Student list */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #CBD5E1', borderRadius: '10px', backgroundColor: '#FFFFFF' }}>
                {filteredStudents.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    {searchQuery ? `No scholars match "${searchQuery}"` : 'No registered users found in database.'}
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const isSelected = selectedStudent?.id === student.id;
                    const displayName = student.fullName || student.name || 'Scholar';
                    const activeSeat = activeUserSeats[student.id];

                    // Find if student has any pending dues
                    const studentBookings = (bookings || []).filter(b => b?.userId === student.id || b?.userPhone === student.phone);
                    const totalDue = studentBookings.reduce((s, b) => s + Math.max(0, Number(b?.pendingAmount) || 0), 0);

                    return (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          if (student.passType) handlePassTypeChange(student.passType);
                        }}
                        style={{
                          padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                            color: isSelected ? '#FFF' : '#64748B', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem'
                          }}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                              {displayName}
                              {student.userCode && (
                                <span style={{ marginLeft: '0.45rem', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                                  ({student.userCode})
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.75rem' }}>
                              <span>📞 {student.phone || 'No phone'}</span>
                              {student.email && <span>✉ {student.email}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          {activeSeat ? (
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Seat #{activeSeat}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Free
                            </span>
                          )}
                          {totalDue > 0 && (
                            <div style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 800, marginTop: '2px' }}>
                              Due: NPR {totalDue.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Booking Options Panel */}
              {selectedStudent && (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                    Assignment Configuration for {selectedStudent.fullName || selectedStudent.name}
                  </div>

                  {/* Pass type and shift */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Pass Duration</label>
                      <select value={passType} onChange={e => handlePassTypeChange(e.target.value)} style={inputStyle}>
                        <option value="DAILY">Daily (1 Day)</option>
                        <option value="WEEKLY">Weekly (7 Days)</option>
                        <option value="MONTHLY">Monthly (30 Days)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Study Shift</label>
                      <select value={shift} onChange={e => setShift(e.target.value)} style={inputStyle}>
                        {SHIFTS.map(s => <option key={s.id} value={s.id}>{s.label} ({s.time})</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>Expiry Date</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {/* Locker Option (Alphabetical Key Lockers A-T) */}
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={hasLocker}
                          onChange={e => {
                            const checked = e.target.checked;
                            setHasLocker(checked);
                            const fee = checked ? (passType === 'MONTHLY' ? 1000 : passType === 'WEEKLY' ? 300 : 200) : 0;
                            setAmountPaid(String(basePrice + fee));
                            if (checked && !lockerNumber && availableLockers.length > 0) {
                              setLockerNumber(availableLockers[0].lockerNumber);
                            }
                          }}
                        />
                        <Key size={14} style={{ color: '#2563EB' }} /> Add Key Locker
                      </label>
                      {hasLocker && (
                        <select value={lockerNumber} onChange={e => setLockerNumber(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '180px' }}>
                          <option value="">-- Choose Key Locker (A-T) --</option>
                          {availableLockers.map(l => (
                            <option key={l.id} value={l.lockerNumber}>{l.label || l.lockerNumber}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Payment Method</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
                        <option value="CASH">Cash</option>
                        <option value="FONEPAY">Fonepay / QR</option>
                        <option value="ESEWA">eSewa</option>
                        <option value="KHALTI">Khalti</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Amount Paid (NPR)</label>
                      <input
                        type="number"
                        min="0"
                        max={totalAmount}
                        value={amountPaid}
                        onChange={e => setAmountPaid(e.target.value)}
                        placeholder={String(totalAmount)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Summary:</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: pendingAmount > 0 ? '#DC2626' : '#16A34A' }}>
                        Total: NPR {totalAmount.toLocaleString()} {pendingAmount > 0 && `(Due: NPR ${pendingAmount.toLocaleString()})`}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      style={{ padding: '0.55rem 1rem', backgroundColor: '#E2E8F0', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}
                    >
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleConfirmAssignment}
                      style={{
                        padding: '0.55rem 1.5rem',
                        backgroundColor: assignmentMode === 'BOOK' ? '#16A34A' : '#D97706',
                        border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '0.83rem',
                        color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                      }}
                    >
                      <UserCheck size={16} />
                      {isProcessing ? 'Saving...' : assignmentMode === 'BOOK' ? `Confirm Desk #${cabinSeat.seatNumber} Assignment` : `Reserve Desk #${cabinSeat.seatNumber}`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
