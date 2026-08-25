import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, User, Phone, Mail, Calendar, Clock,
  Lock, DollarSign, CreditCard, ShieldCheck, AlertCircle, Sparkles
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';

export const ReservationConfirmModal = ({
  isOpen,
  onClose,
  booking,
  onConfirmSuccess
}) => {
  const { seats = [], lockers = [], updateBookingDetails, changeSeatStatus, assignLocker, updateUser } = useBooking();

  const [seatId, setSeatId] = useState('');
  const [passType, setPassType] = useState('DAILY');
  const [shift, setShift] = useState('FULL_DAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('07:00 AM');
  const [hasLocker, setHasLocker] = useState(false);
  const [lockerNumber, setLockerNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      setSeatId(booking.seatId || '');
      setPassType(booking.passType || 'DAILY');
      setShift(booking.shift || 'FULL_DAY');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(booking.startDate || today);
      setEndDate(booking.endDate || today);
      setArrivalTime(booking.arrivalTime || booking.bookingTime || '07:00 AM');
      setHasLocker(!!booking.hasLocker);
      setLockerNumber(booking.lockerNumber || '');
      setPaymentMethod(booking.paymentMethod || 'CASH');
      const total = Number(booking.totalAmount) || 500;
      setAmountPaid(booking.paymentStatus === 'PAID' ? String(total) : String(booking.amountPaid || total));
    }
  }, [isOpen, booking?.id]);

  if (!isOpen || !booking) return null;

  const currentSeat = seats.find(s => s.id === seatId || s.seatNumber === booking.seatNumber) || {
    id: booking.seatId,
    seatNumber: booking.seatNumber || 'A1',
    pricePerDay: 500
  };

  const seatRate = Number(currentSeat.pricePerDay) || 500;
  const basePrice = passType === 'DAILY' ? seatRate : passType === 'WEEKLY' ? 2100 : 7500;
  const lockerFee = hasLocker ? (passType === 'DAILY' ? 200 : passType === 'WEEKLY' ? 300 : 1000) : 0;
  const totalAmount = basePrice + lockerFee;
  const parsedPaid = Math.min(totalAmount, Math.max(0, Number(amountPaid) || totalAmount));
  const pendingAmount = Math.max(0, totalAmount - parsedPaid);
  const paymentStatus = parsedPaid >= totalAmount ? 'PAID' : parsedPaid > 0 ? 'PARTIAL' : 'PENDING';

  const availableLockers = lockers.filter(l => l.status === 'AVAILABLE' || l.lockerNumber === booking.lockerNumber);

  const handleConfirmReservation = async () => {
    setIsProcessing(true);
    try {
      const selectedSeatObj = seats.find(s => s.id === seatId) || currentSeat;
      const targetSeatNumber = selectedSeatObj.seatNumber || booking.seatNumber;

      // 1. Update Booking in Firestore
      await updateBookingDetails(booking.id, {
        seatId: selectedSeatObj.id || seatId,
        seatNumber: targetSeatNumber,
        passType,
        shift,
        startDate,
        endDate,
        arrivalTime,
        bookingTime: arrivalTime,
        hasLocker,
        lockerNumber: hasLocker ? lockerNumber : '',
        basePrice,
        lockerFee,
        totalAmount,
        amountPaid: parsedPaid,
        pendingAmount,
        paymentStatus,
        paymentMethod,
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString()
      });

      // 2. Update Seat Status in Firestore to OCCUPIED
      if (selectedSeatObj.id) {
        await changeSeatStatus(selectedSeatObj.id, 'OCCUPIED');
      }

      // 3. Update User Table
      if (booking.userId) {
        await updateUser(booking.userId, {
          assignedSeat: `Desk ${targetSeatNumber}`,
          seatNumber: targetSeatNumber,
          passType,
          status: 'ACTIVE',
          membershipStatus: 'ACTIVE'
        });
      }

      // 4. Update Locker if assigned
      if (hasLocker && lockerNumber) {
        const matchingLocker = lockers.find(l => l.lockerNumber === lockerNumber || l.id === lockerNumber);
        if (matchingLocker) {
          await assignLocker(matchingLocker.id, {
            userId: booking.userId,
            userName: booking.userName || 'Scholar',
            userPhone: booking.userPhone || '',
            userEmail: booking.userEmail || '',
            seatNumber: targetSeatNumber,
            passType,
            startDate,
            endDate,
            notes: `Confirmed online reservation ${booking.bookingCode}`
          });
        }
      }

      alert(`✅ Reservation ${booking.bookingCode} confirmed!\nDesk #${targetSeatNumber} is now OCCUPIED for ${booking.userName}.`);
      if (onConfirmSuccess) onConfirmSuccess();
      onClose();
    } catch (err) {
      console.error('Error confirming reservation:', err);
      alert('Failed to confirm reservation: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
    border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box',
    fontWeight: 600, color: '#0F172A', backgroundColor: '#FFFFFF'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 99999, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '18px', width: '100%',
        maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#0F172A', borderTopLeftRadius: '17px', borderTopRightRadius: '17px', color: '#FFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              backgroundColor: '#D97706', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#FFFFFF', fontWeight: 900
            }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Confirm Reservation & Check-in</div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Ref: <strong style={{ color: '#FCD34D' }}>{booking.bookingCode}</strong> • Submitted Online
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
          
          {/* Scholar Summary Card */}
          <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E40AF' }}>{booking.userName}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '6px' }}>
                {booking.userCode || 'Registered Scholar'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem', color: '#475569' }}>
              <div>📞 Phone: <strong>{booking.userPhone || '—'}</strong></div>
              <div>📧 Email: <strong>{booking.userEmail || '—'}</strong></div>
            </div>
          </div>

          {/* Configuration Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Assigned Desk Station</label>
              <select value={seatId} onChange={e => setSeatId(e.target.value)} style={inputStyle}>
                {seats.map(s => (
                  <option key={s.id} value={s.id} disabled={s.status === 'OCCUPIED' && s.id !== booking.seatId}>
                    Desk #{s.seatNumber} ({s.zone || 'Zone'}) {s.status === 'OCCUPIED' && s.id !== booking.seatId ? '— [Occupied]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Pass Duration</label>
              <select value={passType} onChange={e => setPassType(e.target.value)} style={inputStyle}>
                <option value="DAILY">Daily Pass (NPR {seatRate})</option>
                <option value="WEEKLY">Weekly Pass (NPR 2,100)</option>
                <option value="MONTHLY">Monthly Membership (NPR 7,500)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expected Arrival Time</label>
              <input type="text" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Locker Assignment */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={hasLocker}
                  onChange={e => {
                    setHasLocker(e.target.checked);
                    if (e.target.checked && !lockerNumber && availableLockers.length > 0) {
                      setLockerNumber(availableLockers[0].lockerNumber);
                    }
                  }}
                />
                <Lock size={15} style={{ color: '#6D28D9' }} /> Allocate Digital Storage Locker
              </label>
              {hasLocker && (
                <select value={lockerNumber} onChange={e => setLockerNumber(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '180px' }}>
                  <option value="">-- Choose Locker Unit --</option>
                  {availableLockers.map(l => (
                    <option key={l.id} value={l.lockerNumber}>{l.lockerNumber} ({l.location || 'South Bank'})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
                {['CASH', 'FONEPAY_QR', 'ESEWA', 'KHALTI', 'CARD', 'BANK_TRANSFER'].map(m => (
                  <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount Collected (NPR)</label>
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
          </div>

          {/* Live Financial Summary */}
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748B' }}>
              <span>Base Desk Rate ({passType})</span>
              <span>NPR {basePrice.toLocaleString()}</span>
            </div>
            {hasLocker && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6D28D9', marginTop: '0.2rem' }}>
                <span>Locker Fee ({lockerNumber || 'Allocated'})</span>
                <span>+NPR {lockerFee.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', borderTop: '1px solid #E2E8F0', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
              <span>Total Fee</span>
              <span>NPR {totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '0.2rem' }}>
              <span style={{ color: '#047857', fontWeight: 700 }}>Collected: NPR {parsedPaid.toLocaleString()}</span>
              {pendingAmount > 0 ? (
                <span style={{ color: '#C2410C', fontWeight: 800 }}>Due: NPR {pendingAmount.toLocaleString()}</span>
              ) : (
                <span style={{ color: '#047857', fontWeight: 700 }}>✓ Fully Settled</span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              disabled={isProcessing}
              onClick={handleConfirmReservation}
              style={{
                padding: '0.6rem 1.5rem', backgroundColor: '#059669', color: '#FFFFFF',
                border: 'none', borderRadius: '8px', fontWeight: 800, cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              <CheckCircle2 size={16} />
              {isProcessing ? 'Processing Confirmation...' : 'Confirm & Occupy Desk'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
