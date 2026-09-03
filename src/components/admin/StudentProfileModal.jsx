import React, { useState, useMemo } from 'react';
import {
  X, User, Phone, Mail, MapPin, Shield, Clock, Bookmark,
  Lock, CreditCard, CheckCircle2, AlertCircle, Edit3,
  Calendar, DollarSign, ChevronRight, Repeat, FileText,
  ArrowDownCircle, Banknote, TrendingUp, Package, Key,
  Trash2, UserMinus, RefreshCw, Printer, AlertTriangle, Car, Sparkles
} from 'lucide-react';
import { calculateRenewalEndDate, calculateDaysRemaining, calculatePackageEndDate } from '../../utils/dateUtils';

const TABS = ['profile', 'status', 'financials', 'history'];
const TAB_LABELS = {
  profile: '👤 Profile & Info',
  status: '📍 Cabin & Package',
  financials: '💰 Financials & Ledger',
  history: '📋 Booking History'
};

const badge = (label, bg, color) => (
  <span style={{
    padding: '0.2rem 0.6rem',
    borderRadius: '8px',
    fontSize: '0.72rem',
    fontWeight: 800,
    backgroundColor: bg,
    color,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  }}>
    {label}
  </span>
);

export const StudentProfileModal = ({
  user,
  bookings = [],
  lockers = [],
  seats = [],
  onClose,
  onNewReservation,
  onCollectDue,
  onEditUser,
  onChangeSeat,
  onRenewBooking,
  onSettleDue,
  onDeactivateUser,
  onPrintReceipt,
}) => {
  // ── HOOKS (MUST ALL BE AT THE TOP UNCONDITIONALLY) ──
  const [activeTab, setActiveTab] = useState('profile');
  const [isChangingCabin, setIsChangingCabin] = useState(false);
  const [selectedNewSeatId, setSelectedNewSeatId] = useState('');
  const [isRenewingPackage, setIsRenewingPackage] = useState(false);
  const [selectedRenewalPackage, setSelectedRenewalPackage] = useState('MONTHLY');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Filter bookings for this student
  const userBookings = useMemo(() => {
    if (!user) return [];
    const cleanUserPhone = String(user.phone || '').replace(/\D/g, '');
    const cleanUserEmail = String(user.email || '').trim().toLowerCase();
    const userId = user.id;

    return (bookings || [])
      .filter(b => {
        if (!b) return false;
        if (userId && b.userId && b.userId === userId) return true;
        if (cleanUserEmail && b.userEmail && String(b.userEmail).trim().toLowerCase() === cleanUserEmail) return true;
        if (cleanUserPhone && b.userPhone && String(b.userPhone).replace(/\D/g, '') === cleanUserPhone) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));
  }, [user, bookings]);

  // Current active or confirmed booking
  const activeBooking = useMemo(() =>
    userBookings.find(b => ['CONFIRMED', 'CHECKED_IN', 'APPROVED', 'RESERVED', 'ACTIVE'].includes(b?.status)),
    [userBookings]
  );

  // Assigned locker (max 1 active locker)
  const assignedLocker = useMemo(() => {
    if (!user) return null;
    const cleanUserPhone = String(user.phone || '').replace(/\D/g, '');
    return (lockers || []).find(l =>
      l?.status === 'ASSIGNED' &&
      ((user.id && l.assignedToUserId === user.id) ||
       (cleanUserPhone && l.assignedToUserPhone && String(l.assignedToUserPhone).replace(/\D/g, '') === cleanUserPhone))
    );
  }, [lockers, user]);

  // Active seat details
  const activeSeat = useMemo(() =>
    activeBooking ? (seats || []).find(s => s?.id === activeBooking.seatId || s?.seatNumber === activeBooking.seatNumber) : null,
    [activeBooking, seats]
  );

  // Available seats for changing cabin
  const availableSeats = useMemo(() =>
    (seats || []).filter(s => s?.status === 'AVAILABLE'),
    [seats]
  );

  // Financial aggregates
  const totalPaid = useMemo(() =>
    userBookings.reduce((s, b) => s + (Number(b?.amountPaid) || (b?.paymentStatus === 'PAID' ? Number(b?.totalAmount) || 0 : 0)), 0),
    [userBookings]
  );
  const totalDue = useMemo(() =>
    userBookings.reduce((s, b) => s + Math.max(0, Number(b?.pendingAmount) || 0), 0),
    [userBookings]
  );
  const totalRevenue = useMemo(() =>
    userBookings.reduce((s, b) => s + (Number(b?.totalAmount) || 0), 0),
    [userBookings]
  );

  // Calculated preview of new expiry date based on selected package (Unconditionally called at top)
  const renewalExpiryPreview = useMemo(() => {
    return calculateRenewalEndDate(activeBooking?.endDate, selectedRenewalPackage);
  }, [activeBooking?.endDate, selectedRenewalPackage]);

  // Safe Date Formatter helper
  const safeFormatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {
      return String(val);
    }
  };

  // ── EARLY RETURNS AFTER ALL HOOKS ──
  if (!user) return null;

  // If user object has no identifying details, show helpful not-found dialog instead of crashing
  if (!user.id && !user.fullName && !user.name && !user.phone && !user.email) {
    return (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem'
      }}>
        <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '2rem', maxWidth: '440px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}>
          <AlertCircle size={44} style={{ color: '#DC2626', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Student Profile Not Found</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            No student profile record could be found for this cabin or reservation. The student may not be registered yet.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.6rem 1.5rem', backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const displayName = String(user.fullName || user.name || 'Scholar').trim() || 'Scholar';
  const initials = displayName
    .split(/\s+/)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S';
  const todayStr = new Date().toISOString().split('T')[0];

  const daysRemaining = activeBooking?.endDate ? calculateDaysRemaining(activeBooking.endDate) : null;

  const isDiscontinued = user.status === 'DISCONTINUED' || user.membershipStatus === 'DISCONTINUED';
  const hasLiveBooking = userBookings.some(b => !['CANCELLED', 'COMPLETED', 'REJECTED'].includes(b.status) && (!b.endDate || b.endDate >= todayStr));
  const userStatus = isDiscontinued ? 'DISCONTINUED' : (hasLiveBooking ? 'ACTIVE' : (user.membershipStatus || user.status || 'INACTIVE'));

  // Handler: Change Cabin
  const handleConfirmChangeCabin = async () => {
    if (!selectedNewSeatId) {
      alert('Please select an available desk / cabin from the dropdown.');
      return;
    }
    const newSeatObj = seats.find(s => s.id === selectedNewSeatId);
    if (!newSeatObj) {
      alert('Selected desk not found.');
      return;
    }

    if (!window.confirm(`Confirm cabin change for ${displayName}?\n\n- Old Desk: ${activeBooking?.seatNumber || 'Current'}\n- New Desk: Desk ${newSeatObj.seatNumber} (${newSeatObj.zone || 'Quiet Zone'})\n\nPrevious desk will be released to AVAILABLE once assigned.`)) {
      return;
    }

    setIsProcessingAction(true);
    try {
      if (onChangeSeat) {
        await onChangeSeat(activeBooking.id, newSeatObj, activeBooking.seatId, user.id);
      }
      setIsChangingCabin(false);
      setSelectedNewSeatId('');
    } catch (err) {
      alert('Error changing cabin: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Renew Booking by selecting package
  const handleConfirmRenew = async () => {
    if (!activeBooking) return;
    setIsProcessingAction(true);
    try {
      if (onRenewBooking) {
        await onRenewBooking(activeBooking.id, selectedRenewalPackage, renewalExpiryPreview);
      }
      setIsRenewingPackage(false);
    } catch (err) {
      alert('Error renewing pass: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Settle Due
  const handleSettleDue = async (bookingObj) => {
    const dueAmount = Math.max(0, Number(bookingObj.pendingAmount) || 0);
    if (dueAmount <= 0) {
      alert('This booking is already paid in full.');
      return;
    }

    if (!window.confirm(`Clear and settle outstanding balance of NPR ${dueAmount.toLocaleString()} for Booking #${bookingObj.bookingCode}?\n\nThis will mark the booking as PAID (settled in full).`)) {
      return;
    }

    setIsProcessingAction(true);
    try {
      if (onSettleDue) {
        await onSettleDue(bookingObj.id, 'CASH');
      }
    } catch (err) {
      alert('Error settling due: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Deactivate / Discontinue Student
  const handleDeactivate = async () => {
    if (!window.confirm(`Are you sure you want to DEACTIVATE / DISCONTINUE "${displayName}"?\n\nThis will:\n- Keep all historical records, profile, payments, and bookings intact\n- Release their current desk (${activeBooking?.seatNumber || 'None'}) to AVAILABLE\n- Release their locker to AVAILABLE\n- Mark student status as DISCONTINUED\n\nDo you want to proceed?`)) {
      return;
    }

    setIsProcessingAction(true);
    try {
      if (onDeactivateUser) {
        await onDeactivateUser(user);
      }
      onClose();
    } catch (err) {
      alert('Error deactivating student: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Build receipt data for printing
  const buildReceiptData = (bookingObj) => {
    const total = Number(bookingObj.totalAmount) || 0;
    const paid = Number(bookingObj.amountPaid) || (bookingObj.paymentStatus === 'PAID' ? total : 0);
    const due = Math.max(0, Number(bookingObj.pendingAmount) || (total - paid));
    return {
      fullName: displayName,
      userCode: user.userCode || user.id,
      phone: user.phone || bookingObj.userPhone || '',
      address: user.address || 'Kathmandu, Nepal',
      passType: bookingObj.passType || 'Standard',
      shiftText: bookingObj.shift || bookingObj.bookingTime || 'Full Day Access',
      startDate: bookingObj.startDate || todayStr,
      endDate: bookingObj.endDate || todayStr,
      seatNumber: bookingObj.seatNumber || 'Floating Desk',
      hasLocker: Boolean(bookingObj.hasLocker || bookingObj.lockerNumber),
      lockerNumber: bookingObj.lockerNumber || (assignedLocker?.lockerNumber || ''),
      basePrice: Number(bookingObj.basePrice) || (total - (Number(bookingObj.lockerFee) || 0)),
      lockerFee: Number(bookingObj.lockerFee) || 0,
      totalAmount: total,
      amountPaid: paid,
      pendingAmount: due,
      paymentStatus: bookingObj.paymentStatus || (due === 0 ? 'PAID' : 'PENDING'),
      paymentMethod: bookingObj.paymentMethod || 'CASH',
      notes: bookingObj.notes || '',
      timestamp: bookingObj.createdAt || new Date().toLocaleString()
    };
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '820px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden',
        maxHeight: '94vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* ── Top Header ── */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: isDiscontinued ? '#64748B' : 'linear-gradient(135deg, #D97706, #F59E0B)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.25rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {displayName}
                {activeBooking?.seatNumber && (
                  <span style={{ fontSize: '0.85rem', color: '#93C5FD', fontWeight: 700 }}>
                    · Desk {activeBooking.seatNumber}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0' }}>
                  {user.userCode || user.id}
                </span>
                {badge(user.passType || activeBooking?.passType || 'DAILY', '#1E3A8A', '#BFDBFE')}
                {badge(
                  userStatus,
                  userStatus === 'ACTIVE' ? '#064E3B' : userStatus === 'DISCONTINUED' ? '#374151' : '#7F1D1D',
                  userStatus === 'ACTIVE' ? '#6EE7B7' : userStatus === 'DISCONTINUED' ? '#D1D5DB' : '#FCA5A5'
                )}
                {daysRemaining !== null && (
                  badge(
                    daysRemaining > 5 ? `${daysRemaining} Days Left` : daysRemaining >= 0 ? `Expiring (${daysRemaining}d)` : `Expired (${Math.abs(daysRemaining)}d ago)`,
                    daysRemaining > 5 ? '#064E3B' : daysRemaining >= 0 ? '#78350F' : '#7F1D1D',
                    daysRemaining > 5 ? '#A7F3D0' : daysRemaining >= 0 ? '#FDE68A' : '#FECACA'
                  )
                )}
                {totalDue > 0 && badge(`⚠ NPR ${totalDue.toLocaleString()} DUE`, '#92400E', '#FDE68A')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {onEditUser && (
              <button
                onClick={() => onEditUser(user)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#FFF',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Edit3 size={13} /> Edit Profile
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '0.3rem'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '0.35rem 1rem',
          gap: '0.25rem',
          overflowX: 'auto'
        }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: activeTab === t ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: activeTab === t ? '#0F172A' : 'transparent',
                color: activeTab === t ? '#F59E0B' : '#475569',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* ── Modal Body Content ── */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ============ TAB 1: PROFILE & INFO ============ */}
          {activeTab === 'profile' && (
            <>
              {isDiscontinued && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertTriangle size={18} style={{ color: '#DC2626' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991B1B' }}>Student Account is Discontinued</div>
                    <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>This student is inactive. Cabin and locker facilities have been released. Historical payments and records remain preserved.</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {[
                  { icon: <User size={14} />, label: 'Student ID', value: user.userCode || user.id || 'QD-STU' },
                  { icon: <Phone size={14} />, label: 'Phone Number', value: user.phone ? String(user.phone) : '—' },
                  { icon: <Mail size={14} />, label: 'Email Address', value: user.email ? String(user.email) : '—' },
                  { icon: <MapPin size={14} />, label: 'Physical Address', value: user.address ? String(user.address) : 'Kathmandu, Nepal' },
                  { icon: <Shield size={14} />, label: 'Emergency Contact', value: user.emergencyContact ? `${user.emergencyContact}${user.emergencyRelation ? ` (${user.emergencyRelation})` : ''}` : '—' },
                  { icon: <FileText size={14} />, label: 'ID Proof / Document', value: user.idProof || 'Verified ID on File' },
                  { icon: <Calendar size={14} />, label: 'Joined / Registered Date', value: safeFormatDate(user.joinedDate || user.createdAt) },
                  { icon: <Car size={14} />, label: 'Parking Facility', value: activeBooking?.parkingNeeded || user.parkingNeeded ? `Yes (${activeBooking?.vehicleNumber || user.vehicleNumber || 'Vehicle Registered'})` : 'No Parking Assigned' },
                  { icon: <Lock size={14} />, label: 'Storage Locker', value: assignedLocker ? `${assignedLocker.label || assignedLocker.lockerNumber} (PIN: ${assignedLocker.pinCode || '****'})` : 'No Locker Assigned' },
                  { icon: <Package size={14} />, label: 'Current Package Tier', value: `${user.passType || activeBooking?.passType || 'Standard'} Pass` },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', wordBreak: 'break-word' }}>{value}</div>
                  </div>
                ))}
              </div>

              {user.notes && (
                <div style={{ backgroundColor: '#FFFBEB', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.25rem' }}>📝 Scholar Notes</div>
                  <div style={{ fontSize: '0.85rem', color: '#78350F' }}>{user.notes}</div>
                </div>
              )}
            </>
          )}

          {/* ============ TAB 2: CABIN & PACKAGE ============ */}
          {activeTab === 'status' && (
            <>
              {/* Active Desk / Cabin Card */}
              <div style={{
                backgroundColor: activeBooking ? '#EFF6FF' : '#F8FAFC',
                borderRadius: '14px',
                padding: '1.25rem',
                border: `1.5px solid ${activeBooking ? '#BFDBFE' : '#E2E8F0'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: activeBooking ? '#1D4ED8' : '#94A3B8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} /> Assigned Desk / Cabin Status
                  </div>
                  {activeBooking && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setIsChangingCabin(!isChangingCabin);
                          setIsRenewingPackage(false);
                        }}
                        style={{
                          backgroundColor: isChangingCabin ? '#64748B' : '#0284C7',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <RefreshCw size={13} /> {isChangingCabin ? 'Cancel Change' : 'Change Cabin'}
                      </button>
                      <button
                        onClick={() => {
                          setIsRenewingPackage(!isRenewingPackage);
                          setIsChangingCabin(false);
                        }}
                        disabled={isProcessingAction}
                        style={{
                          backgroundColor: isRenewingPackage ? '#64748B' : '#059669',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Repeat size={13} /> {isRenewingPackage ? 'Cancel Renewal' : 'Renew / Extend Package'}
                      </button>
                    </div>
                  )}
                </div>

                {activeBooking ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div><span style={{ color: '#64748B' }}>Desk / Cabin #:</span> <strong style={{ color: '#1D4ED8', fontSize: '1.25rem', display: 'block' }}>{activeBooking.seatNumber}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Zone:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{activeSeat?.zone || 'Quiet Study Zone'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Package:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{activeBooking.passType} Pass</strong></div>
                      <div><span style={{ color: '#64748B' }}>Check-in Date:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{activeBooking.startDate}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Expiry Date:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{activeBooking.endDate || 'Active'}</strong></div>
                      <div>
                        <span style={{ color: '#64748B' }}>Days Remaining:</span>
                        <div style={{ marginTop: '2px' }}>
                          {daysRemaining !== null ? (
                            badge(
                              daysRemaining > 5 ? `${daysRemaining} Days Left` : daysRemaining >= 0 ? `Expiring Soon (${daysRemaining}d)` : `Expired (${Math.abs(daysRemaining)}d ago)`,
                              daysRemaining > 5 ? '#ECFDF5' : daysRemaining >= 0 ? '#FFFBEB' : '#FEF2F2',
                              daysRemaining > 5 ? '#047857' : daysRemaining >= 0 ? '#B45309' : '#B91C1C'
                            )
                          ) : (
                            <span style={{ color: '#94A3B8' }}>N/A</span>
                          )}
                        </div>
                      </div>
                      <div><span style={{ color: '#64748B' }}>Timing Shift:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{activeBooking.shift || activeBooking.bookingTime || 'Full Day Access'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Booking Code:</span> <strong style={{ display: 'block', marginTop: '2px', fontFamily: 'monospace' }}>{activeBooking.bookingCode}</strong></div>
                    </div>

                    {/* Package-Based Renewal Form (Requirement 2) */}
                    {isRenewingPackage && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1.5px solid #A7F3D0', backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Sparkles size={16} style={{ color: '#059669' }} /> Select Renewal Package for {displayName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1rem' }}>
                          Choose the renewal package. The new expiry date is calculated automatically using the shared package duration utility.
                        </div>

                        {/* Package Selection Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                          {[
                            { id: 'DAILY', label: 'Daily Pass', duration: '1 Day (+1 day)', icon: '⚡' },
                            { id: 'WEEKLY', label: 'Weekly Pass', duration: '7 Days (+7 days)', icon: '📅' },
                            { id: 'MONTHLY', label: 'Monthly Pass', duration: '30 Days (+30 days)', icon: '🏆' }
                          ].map(pkg => {
                            const isSelected = selectedRenewalPackage === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedRenewalPackage(pkg.id)}
                                style={{
                                  padding: '0.85rem 1rem',
                                  borderRadius: '10px',
                                  border: `2px solid ${isSelected ? '#059669' : '#CBD5E1'}`,
                                  backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  textAlign: 'center'
                                }}
                              >
                                <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{pkg.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: isSelected ? '#065F46' : '#0F172A' }}>{pkg.label}</div>
                                <div style={{ fontSize: '0.72rem', color: isSelected ? '#047857' : '#64748B', fontWeight: 600, marginTop: '2px' }}>{pkg.duration}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Expiry Date Preview Calculation Banner */}
                        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Current Expiry: <strong>{activeBooking.endDate || todayStr}</strong></span>
                            <span style={{ margin: '0 0.5rem', color: '#86EFAC' }}>➔</span>
                            <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 800 }}>New Expiry: <strong>{renewalExpiryPreview}</strong></span>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: '6px' }}>
                            {selectedRenewalPackage} PASS
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setIsRenewingPackage(false)}
                            style={{ padding: '0.55rem 1rem', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmRenew}
                            disabled={isProcessingAction}
                            style={{
                              padding: '0.55rem 1.35rem',
                              backgroundColor: '#059669',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <Repeat size={14} /> {isProcessingAction ? 'Renewing...' : `Confirm Renewal until ${renewalExpiryPreview}`}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Change Cabin Inline Form */}
                    {isChangingCabin && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #BFDBFE', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                          Select New Available Cabin for {displayName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.75rem' }}>
                          Currently assigned: <strong>Desk {activeBooking.seatNumber}</strong>. Upon confirmation, the previous desk will automatically become AVAILABLE.
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <select
                            value={selectedNewSeatId}
                            onChange={(e) => setSelectedNewSeatId(e.target.value)}
                            style={{
                              padding: '0.6rem 0.85rem',
                              borderRadius: '8px',
                              border: '1.5px solid #CBD5E1',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              minWidth: '260px'
                            }}
                          >
                            <option value="">-- Choose an Available Desk ({availableSeats.length} Available) --</option>
                            {availableSeats.map(s => (
                              <option key={s.id} value={s.id}>
                                Desk {s.seatNumber} · {s.zone || s.type || 'Single Desk'}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleConfirmChangeCabin}
                            disabled={isProcessingAction || !selectedNewSeatId}
                            style={{
                              backgroundColor: '#0F172A',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '0.6rem 1.25rem',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: selectedNewSeatId ? 'pointer' : 'not-allowed',
                              opacity: selectedNewSeatId ? 1 : 0.6
                            }}
                          >
                            {isProcessingAction ? 'Updating...' : 'Confirm Cabin Change'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>No Active Cabin / Desk Assigned</div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>This student currently has no active reservation or check-in. Use Register Student at the top to assign a desk.</div>
                  </div>
                )}
              </div>

              {/* Locker Card */}
              <div style={{
                backgroundColor: assignedLocker ? '#F5F3FF' : '#F8FAFC',
                borderRadius: '14px',
                padding: '1.25rem',
                border: `1.5px solid ${assignedLocker ? '#DDD6FE' : '#E2E8F0'}`
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: assignedLocker ? '#6D28D9' : '#94A3B8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={15} /> Student Locker Facility
                </div>
                {assignedLocker ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748B' }}>Locker #:</span> <strong style={{ color: '#6D28D9', fontSize: '1.25rem', display: 'block' }}>{assignedLocker.label || assignedLocker.lockerNumber}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Location:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{assignedLocker.location || 'Storage Locker Bank'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Keypad PIN:</span> <strong style={{ display: 'block', marginTop: '2px', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.15em', color: '#0F172A' }}>{assignedLocker.pinCode || '****'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Status:</span> <div style={{ marginTop: '2px' }}>{badge('ASSIGNED (Max 1 Rule Active)', '#F5F3FF', '#6D28D9')}</div></div>
                    {assignedLocker.startDate && <div><span style={{ color: '#64748B' }}>Start Date:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{assignedLocker.startDate}</strong></div>}
                    {assignedLocker.endDate && <div><span style={{ color: '#64748B' }}>Valid Until:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{assignedLocker.endDate}</strong></div>}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>No locker currently assigned to this student.</div>
                )}
              </div>
            </>
          )}

          {/* ============ TAB 3: FINANCIALS & LEDGER ============ */}
          {activeTab === 'financials' && (
            <>
              {/* Financial Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid #BFDBFE' }}>
                  <div style={{ color: '#1D4ED8', marginBottom: '0.2rem' }}><TrendingUp size={18} style={{ margin: '0 auto' }} /></div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Billed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1D4ED8', marginTop: '2px' }}>NPR {totalRevenue.toLocaleString()}</div>
                </div>

                <div style={{ backgroundColor: '#ECFDF5', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid #A7F3D0' }}>
                  <div style={{ color: '#047857', marginBottom: '0.2rem' }}><CheckCircle2 size={18} style={{ margin: '0 auto' }} /></div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Paid</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>NPR {totalPaid.toLocaleString()}</div>
                </div>

                <div style={{ backgroundColor: totalDue > 0 ? '#FFFBEB' : '#F8FAFC', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: `1px solid ${totalDue > 0 ? '#FDE68A' : '#E2E8F0'}` }}>
                  <div style={{ color: totalDue > 0 ? '#C2410C' : '#047857', marginBottom: '0.2rem' }}><AlertCircle size={18} style={{ margin: '0 auto' }} /></div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Outstanding Due</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: totalDue > 0 ? '#C2410C' : '#047857', marginTop: '2px' }}>NPR {totalDue.toLocaleString()}</div>
                </div>
              </div>

              {/* Per-Booking Payment Records */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Firestore Payment & Invoicing Records</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{userBookings.length} Transaction(s)</span>
                </div>

                {userBookings.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', padding: '1.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                    No payment or booking transactions found for this student.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {userBookings.map(b => {
                      const total = Number(b.totalAmount) || 0;
                      const paid = Number(b.amountPaid) || (b.paymentStatus === 'PAID' ? total : 0);
                      const due = Math.max(0, Number(b.pendingAmount) || (total - paid));
                      const isPendingPayment = due > 0;

                      return (
                        <div
                          key={b.id}
                          style={{
                            backgroundColor: isPendingPayment ? '#FFFBEB' : '#FFFFFF',
                            borderRadius: '12px',
                            border: `1.5px solid ${isPendingPayment ? '#FDE68A' : '#E2E8F0'}`,
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span>#{b.bookingCode || b.id}</span>
                              {badge(b.passType || 'Standard', '#F1F5F9', '#334155')}
                              {badge(
                                b.paymentStatus || (due === 0 ? 'PAID' : 'PENDING'),
                                due === 0 ? '#ECFDF5' : '#FEF3C7',
                                due === 0 ? '#047857' : '#92400E'
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                              Desk {b.seatNumber} · Period: {b.startDate} → {b.endDate || 'Active'}
                              {b.paymentMethod && ` · Method: ${b.paymentMethod}`}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Total Billed: <strong>NPR {total.toLocaleString()}</strong></div>
                            <div style={{ fontSize: '0.78rem', color: '#047857' }}>Paid Amount: <strong>NPR {paid.toLocaleString()}</strong></div>
                            {isPendingPayment && (
                              <div style={{ fontSize: '0.85rem', color: '#C2410C', fontWeight: 800, marginTop: '2px' }}>
                                Outstanding Due: NPR {due.toLocaleString()}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
                            {isPendingPayment && onSettleDue && (
                              <button
                                onClick={() => handleSettleDue(b)}
                                disabled={isProcessingAction}
                                title="Clear full outstanding balance and mark as PAID"
                                style={{
                                  backgroundColor: '#059669',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '0.45rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <CheckCircle2 size={13} /> Settle Due
                              </button>
                            )}

                            {isPendingPayment && onCollectDue && (
                              <button
                                onClick={() => onCollectDue(b)}
                                style={{
                                  backgroundColor: '#D97706',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '0.45rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <Banknote size={13} /> Record Payment
                              </button>
                            )}

                            {onPrintReceipt && (
                              <button
                                onClick={() => onPrintReceipt(buildReceiptData(b))}
                                title="Generate and print bill / receipt for this booking"
                                style={{
                                  backgroundColor: '#F1F5F9',
                                  color: '#334155',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '8px',
                                  padding: '0.45rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <Printer size={13} /> Print Bill
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ TAB 4: HISTORY ============ */}
          {activeTab === 'history' && (
            <>
              {userBookings.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                  No historical bookings found for this student.
                </div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                        <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left' }}>Receipt / Code</th>
                        <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left' }}>Desk</th>
                        <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left' }}>Package & Validity</th>
                        <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left' }}>Fee / Due</th>
                        <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left' }}>Payment</th>
                        <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBookings.map((b, idx) => {
                        const total = Number(b.totalAmount) || 0;
                        const paid = Number(b.amountPaid) || (b.paymentStatus === 'PAID' ? total : 0);
                        const due = Math.max(0, Number(b.pendingAmount) || (total - paid));
                        const payStatus = b.paymentStatus || (due === 0 ? 'PAID' : due < total ? 'PARTIAL' : 'PENDING');
                        return (
                          <tr key={b.id} style={{ borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none', backgroundColor: due > 0 ? '#FFFBEB' : '#FFFFFF' }}>
                            <td style={{ padding: '0.7rem 0.9rem', fontWeight: 800, fontFamily: 'monospace' }}>{b.bookingCode || b.id}</td>
                            <td style={{ padding: '0.7rem 0.9rem', fontWeight: 800, color: '#2563EB' }}>Desk {b.seatNumber || '—'}</td>
                            <td style={{ padding: '0.7rem 0.9rem', color: '#475569' }}>
                              <div style={{ fontWeight: 700 }}>{b.passType} Pass</div>
                              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{b.startDate} → {b.endDate || 'Active'}</div>
                            </td>
                            <td style={{ padding: '0.7rem 0.9rem' }}>
                              <div style={{ fontWeight: 700 }}>NPR {total.toLocaleString()}</div>
                              {due > 0 && <div style={{ fontSize: '0.72rem', color: '#C2410C', fontWeight: 700 }}>Due: NPR {due.toLocaleString()}</div>}
                            </td>
                            <td style={{ padding: '0.7rem 0.9rem' }}>
                              {badge(
                                payStatus,
                                payStatus === 'PAID' ? '#ECFDF5' : payStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                                payStatus === 'PAID' ? '#047857' : payStatus === 'PARTIAL' ? '#92400E' : '#991B1B'
                              )}
                            </td>
                            <td style={{ padding: '0.7rem 0.9rem' }}>
                              {badge(
                                b.status,
                                ['CONFIRMED', 'CHECKED_IN', 'APPROVED'].includes(b.status) ? '#ECFDF5' : ['PENDING', 'PENDING_CONFIRMATION'].includes(b.status) ? '#FEF3C7' : '#F1F5F9',
                                ['CONFIRMED', 'CHECKED_IN', 'APPROVED'].includes(b.status) ? '#047857' : ['PENDING', 'PENDING_CONFIRMATION'].includes(b.status) ? '#B45309' : '#475569'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Deactivate Button (Replaces Delete per requirement 7) */}
          <div>
            {!isDiscontinued && onDeactivateUser && (
              <button
                onClick={handleDeactivate}
                disabled={isProcessingAction}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Deactivate scholar, free cabin and locker, keep historical data intact"
              >
                <UserMinus size={14} /> Deactivate / Discontinue Student
              </button>
            )}
            {isDiscontinued && (
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Student status: Discontinued (Historical records preserved)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* If student ALREADY has an assigned cabin, DO NOT show Reserve Desk per Requirement 2 */}
            {!activeBooking?.seatNumber && !isDiscontinued && onNewReservation && (
              <button
                onClick={() => { onClose(); onNewReservation(user); }}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Calendar size={14} /> + Assign Desk
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                backgroundColor: '#E2E8F0',
                color: '#334155',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.15rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
