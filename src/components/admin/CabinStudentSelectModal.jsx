import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Search, UserCheck, CheckCircle2, UserPlus, Phone, Calendar,
  Clock, MapPin, AlertCircle, Lock, DollarSign, Banknote, ShieldAlert, Key
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';

export const CabinStudentSelectModal = ({
  isOpen,
  onClose,
  cabinSeat,
  onAssignStudent,
  onReleaseCabin,
  onOpenWalkinForCabin
}) => {
  const { users = [], bookings = [], seats = [], lockers = [] } = useBooking() || {};
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

  // ── Auto-compute default end date based on pass type ──
  const computeEndDate = (start, pt) => {
    if (!start) return today;
    const d = new Date(start);
    if (isNaN(d.getTime())) return start;
    if (pt === 'WEEKLY') d.setDate(d.getDate() + 7);
    else if (pt === 'MONTHLY') d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
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

  // ── Shift options ──
  const SHIFTS = [
    { id: 'MORNING', label: 'Morning', time: '07:00 AM – 12:00 PM' },
    { id: 'AFTERNOON', label: 'Afternoon', time: '12:00 PM – 05:00 PM' },
    { id: 'EVENING', label: 'Evening', time: '05:00 PM – 10:00 PM' },
    { id: 'FULL_DAY', label: 'Full Day', time: '07:00 AM – 10:00 PM' },
  ];
  const shiftTime = SHIFTS.find(s => s.id === shift)?.time || '07:00 AM – 10:00 PM';

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

  // ── Map of active seats for each user ──
  const activeUserSeats = {};
  (bookings || []).forEach(b => {
    if (b && ['CHECKED_IN', 'OCCUPIED', 'RESERVED', 'CONFIRMED'].includes(b.status) && b.userId) {
      activeUserSeats[b.userId] = b.seatNumber;
    }
  });

  // ── Filter all registered students ──
  const filteredStudents = (users || []).filter(u => {
    if (!u) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (u.fullName || u.name || '').toLowerCase().includes(q);
    const codeMatch = (u.userCode || u.studentCode || u.id || '').toLowerCase().includes(q);
    const phoneMatch = (u.phone || '').includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    return nameMatch || codeMatch || phoneMatch || emailMatch;
  });

  // Available lockers
  const availableLockers = (lockers || []).filter(l => l?.status === 'AVAILABLE');

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
        maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto',
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

          {/* ════ CASE 1: CABIN OCCUPIED ════ */}
          {isCabinBusy ? (
            <>
              <div style={{
                backgroundColor: cabinSeat.status === 'OCCUPIED' ? '#FEF2F2' : '#FFFBEB',
                border: `1.5px solid ${cabinSeat.status === 'OCCUPIED' ? '#F87171' : '#FCD34D'}`,
                borderRadius: '12px', padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px',
                    backgroundColor: cabinSeat.status === 'OCCUPIED' ? '#FEE2E2' : '#FEF3C7',
                    color: cabinSeat.status === 'OCCUPIED' ? '#991B1B' : '#92400E', textTransform: 'uppercase'
                  }}>
                    {cabinSeat.status === 'OCCUPIED' ? '🔴 OCCUPIED / SEATED' : '🟡 RESERVED'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  {[
                    ['Student', currentOccupantBooking?.userName || '—'],
                    ['Phone', currentOccupantBooking?.userPhone || '—'],
                    ['Pass Type', currentOccupantBooking?.passType || '—'],
                    ['Booking Code', currentOccupantBooking?.bookingCode || '—'],
                    ['Check-in', currentOccupantBooking?.startDate || '—'],
                    ['Check-out', currentOccupantBooking?.endDate || '—'],
                    ['Shift', currentOccupantBooking?.shift || currentOccupantBooking?.bookingTime || 'Full Day'],
                    ['Payment Status', currentOccupantBooking?.paymentStatus || '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '1px' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {currentOccupantBooking && Number(currentOccupantBooking.pendingAmount) > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#FEF3C7', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#92400E' }}>
                    ⚠ Outstanding Due: NPR {Number(currentOccupantBooking.pendingAmount).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                  Close
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
                          if (student.passType) {
                            handlePassTypeChange(student.passType);
                          }
                        }}
                        style={{
                          padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          borderLeft: `4px solid ${isSelected ? '#2563EB' : 'transparent'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: isSelected ? '#2563EB' : '#E2E8F0', color: isSelected ? '#FFF' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <strong style={{ fontSize: '0.9rem', color: isSelected ? '#1D4ED8' : '#0F172A' }}>{displayName}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{student.userCode || student.id}</span>
                            {activeSeat && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '1px 6px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                                Currently on Desk {activeSeat}
                              </span>
                            )}
                            {totalDue > 0 && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '6px' }}>
                                ⚠ Due NPR {totalDue.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748B', flexWrap: 'wrap' }}>
                            <span>📦 <strong>{student.passType || 'DAILY'}</strong></span>
                            <span>📞 {student.phone || 'No phone'}</span>
                            <span>📧 {student.email || '—'}</span>
                          </div>
                        </div>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          border: isSelected ? '6px solid #2563EB' : '2px solid #CBD5E1',
                          backgroundColor: '#FFF', flexShrink: 0
                        }} />
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Booking Details Form (only when student selected) ── */}
              {selectedStudent && (
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1.5px solid #CBD5E1', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserCheck size={16} style={{ color: '#2563EB' }} />
                    Booking Details for: <span style={{ color: '#2563EB' }}>{selectedStudent.fullName || selectedStudent.name}</span>
                  </div>

                  {/* Pass type selector */}
                  <div>
                    <label style={labelStyle}>Pass Type</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[['DAILY', `NPR ${seatRate}`], ['WEEKLY', 'NPR 2,100'], ['MONTHLY', 'NPR 7,500']].map(([pt, price]) => (
                        <button key={pt} type="button" onClick={() => handlePassTypeChange(pt)} style={{
                          flex: 1, padding: '0.55rem 0.25rem', borderRadius: '8px',
                          border: passType === pt ? '2px solid #2563EB' : '1px solid #CBD5E1',
                          backgroundColor: passType === pt ? '#EFF6FF' : '#FFFFFF',
                          color: passType === pt ? '#1D4ED8' : '#475569',
                          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'center'
                        }}>
                          <div>{pt}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shift selector */}
                  <div>
                    <label style={labelStyle}>Shift / Timing</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {SHIFTS.map(s => (
                        <button key={s.id} type="button" onClick={() => setShift(s.id)} style={{
                          padding: '0.45rem 0.75rem', borderRadius: '6px',
                          border: shift === s.id ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                          backgroundColor: shift === s.id ? '#EDE9FE' : '#FFFFFF',
                          color: shift === s.id ? '#5B21B6' : '#64748B',
                          fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer'
                        }}>
                          {s.label} · <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>{s.time}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>End Date</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {/* Locker Assignment */}
                  <div>
                    <label style={labelStyle}>Digital Storage Locker Facility</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
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
                        <Lock size={14} style={{ color: '#6D28D9' }} /> Add Digital Locker (+NPR {passType === 'MONTHLY' ? '1,000' : passType === 'WEEKLY' ? '300' : '200'})
                      </label>
                      {hasLocker && (
                        <select value={lockerNumber} onChange={e => setLockerNumber(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '180px' }}>
                          <option value="">-- Choose Locker --</option>
                          {availableLockers.map(l => (
                            <option key={l.id} value={l.lockerNumber}>{l.lockerNumber} ({l.location || 'Storage Bank'})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Payment Method</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
                        {['CASH', 'FONEPAY_QR', 'ESEWA', 'KHALTI', 'CARD', 'BANK_TRANSFER'].map(m => (
                          <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Amount Paid (NPR)</label>
                      <input type="number" min="0" max={totalAmount} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={String(totalAmount)} style={inputStyle} />
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748B' }}>
                      <span>Desk Base Fee ({passType} · Desk #{cabinSeat.seatNumber})</span>
                      <span>NPR {basePrice.toLocaleString()}</span>
                    </div>
                    {hasLocker && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6D28D9', marginTop: '0.25rem', fontWeight: 600 }}>
                        <span>Locker Fee ({lockerNumber || 'Selected'})</span>
                        <span>+NPR {lockerFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', borderTop: '1px solid #E2E8F0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                      <span>Total Amount</span>
                      <span>NPR {totalAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                      <span style={{ color: '#047857', fontWeight: 700 }}>Amount Paid: NPR {parsedPaid.toLocaleString()}</span>
                      {pendingAmount > 0 ? (
                        <span style={{ color: '#C2410C', fontWeight: 800 }}>Due: NPR {pendingAmount.toLocaleString()}</span>
                      ) : (
                        <span style={{ color: '#047857', fontWeight: 700 }}>✓ Fully Settled</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Footer ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  {selectedStudent
                    ? <span>Assigning to: <strong style={{ color: '#0F172A' }}>{selectedStudent.fullName || selectedStudent.name}</strong></span>
                    : <span>👆 Select a scholar from the list above</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedStudent || isProcessing}
                    onClick={handleConfirmAssignment}
                    style={{
                      padding: '0.6rem 1.5rem',
                      backgroundColor: !selectedStudent ? '#CBD5E1' : assignmentMode === 'BOOK' ? '#16A34A' : '#D97706',
                      border: 'none', borderRadius: '8px', fontWeight: 800, color: '#FFFFFF',
                      cursor: !selectedStudent || isProcessing ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}
                  >
                    <UserCheck size={16} />
                    {isProcessing ? 'Processing...' : assignmentMode === 'BOOK' ? `Book Desk ${cabinSeat.seatNumber}` : `Reserve Desk ${cabinSeat.seatNumber}`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
