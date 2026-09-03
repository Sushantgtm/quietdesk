import React, { useState, useEffect } from 'react';
import { 
  X, UserPlus, MapPin, Phone, Mail, Calendar, Clock, Lock, 
  CreditCard, FileText, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign,
  Briefcase, Sparkles, User, Hash, Search
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';

export const WalkinStudentModal = ({
  isOpen,
  onClose,
  seats = [],
  lockers = [],
  plans = [],
  onSubmitSuccess
}) => {
  const { bookings = [], users = [] } = useBooking();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    idProof: '',
    passType: 'MONTHLY', // DAILY, WEEKLY, MONTHLY
    seatId: '',
    seatNumber: '',
    hasLocker: false,
    lockerNumber: '',
    shift: 'MORNING', // MORNING, AFTERNOON, EVENING, FULL_DAY, CUSTOM
    arrivalTime: '06:00 AM - 12:00 PM',
    customArrivalTime: '',
    startDate: today,
    endDate: calculateInitialEndDate(today, 'MONTHLY'),
    amountPaid: '7500',
    paymentMethod: 'CASH', // CASH, FONEPAY_QR, ESEWA, KHALTI, CARD, BANK_TRANSFER
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper to compute end date based on pass type (timezone-safe)
  function calculateInitialEndDate(startStr, passType) {
    if (!startStr) return '';
    const parts = startStr.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0])) return startStr;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    
    if (passType === 'DAILY') {
      return startStr;
    } else if (passType === 'WEEKLY') {
      date.setDate(date.getDate() + 7);
    } else if (passType === 'MONTHLY') {
      date.setDate(date.getDate() + 30);
    }
    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  }

  // Shift timing presets (Operating hours: 6:00 AM - 9:00 PM)
  const SHIFT_OPTIONS = [
    { id: 'MORNING', label: 'Morning Shift', time: '06:00 AM - 12:00 PM', desc: 'Early Bird Scholar' },
    { id: 'AFTERNOON', label: 'Afternoon Shift', time: '12:00 PM - 05:00 PM', desc: 'Mid-Day Focus' },
    { id: 'EVENING', label: 'Evening Shift', time: '05:00 PM - 09:00 PM', desc: 'After-Work / Late Prep' },
    { id: 'FULL_DAY', label: 'Full Day Access', time: '06:00 AM - 09:00 PM', desc: 'All Day Dedicated Desk' },
    { id: 'CUSTOM', label: 'Custom Hours', time: 'Custom Timing', desc: 'Specific Timing Window' }
  ];

  // Pricing calculation
  const getBasePackagePrice = (passType, seatId) => {
    if (passType === 'DAILY') {
      const selectedSeat = seats.find(s => s.id === seatId);
      return selectedSeat ? (Number(selectedSeat.pricePerDay) || 350) : 350;
    } else if (passType === 'WEEKLY') {
      return 2100;
    } else if (passType === 'MONTHLY') {
      return 7500;
    }
    return 350;
  };

  const getLockerFee = (passType, hasLocker) => {
    if (!hasLocker) return 0;
    if (passType === 'DAILY') return 200;
    if (passType === 'WEEKLY') return 300;
    if (passType === 'MONTHLY') return 1000;
    return 200;
  };

  const basePrice = getBasePackagePrice(formData.passType, formData.seatId);
  const lockerFee = getLockerFee(formData.passType, formData.hasLocker);
  const totalAmount = basePrice + lockerFee;
  
  const parsedAmountPaid = Math.max(0, Number(formData.amountPaid) || 0);
  const pendingAmount = Math.max(0, totalAmount - parsedAmountPaid);

  let paymentStatus = 'PENDING';
  if (parsedAmountPaid >= totalAmount && totalAmount > 0) {
    paymentStatus = 'PAID';
  } else if (parsedAmountPaid > 0) {
    paymentStatus = 'PARTIAL';
  }

  // Auto-update end date when start date or pass type changes
  const handleStartDateChange = (newStartDate) => {
    const computedEnd = calculateInitialEndDate(newStartDate, formData.passType);
    setFormData(prev => ({ ...prev, startDate: newStartDate, endDate: computedEnd }));
  };

  const handlePassTypeChange = (newPassType) => {
    const computedEnd = calculateInitialEndDate(formData.startDate, newPassType);
    const newBase = getBasePackagePrice(newPassType, formData.seatId);
    const newLocker = getLockerFee(newPassType, formData.hasLocker);
    const newTotal = newBase + newLocker;

    setFormData(prev => ({
      ...prev,
      passType: newPassType,
      endDate: computedEnd,
      amountPaid: String(newTotal) // Default to full payment of new total
    }));
  };

  const handleShiftChange = (shiftId) => {
    const found = SHIFT_OPTIONS.find(s => s.id === shiftId);
    setFormData(prev => ({
      ...prev,
      shift: shiftId,
      arrivalTime: found ? found.time : '06:00 AM - 09:00 PM'
    }));
  };

  const handleLockerToggle = (hasLocker) => {
    const newLockerFee = getLockerFee(formData.passType, hasLocker);
    const newTotal = basePrice + newLockerFee;
    const firstFreeLocker = lockers.find(l => l.status === 'AVAILABLE');
    const defaultLockerNum = firstFreeLocker ? firstFreeLocker.lockerNumber : 'L-01';
    setFormData(prev => ({
      ...prev,
      hasLocker,
      lockerNumber: hasLocker ? (prev.lockerNumber || defaultLockerNum) : '',
      amountPaid: String(newTotal)
    }));
  };

  const availableSeats = seats.filter(s => s.status === 'AVAILABLE');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter student full name.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Please enter student phone number.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Please enter student physical address.');
      return;
    }

    // Check if scholar already has an active booking
    const todayStr = new Date().toISOString().split('T')[0];
    const enteredPhone = formData.phone.trim().replace(/\D/g, '');
    const enteredEmail = (formData.email || '').trim().toLowerCase();
    const duplicateBooking = (bookings || []).find(b => {
      if (['CANCELLED', 'COMPLETED'].includes(b.status)) return false;
      if (b.endDate && b.endDate < todayStr) return false;
      const bPhone = (b.userPhone || '').trim().replace(/\D/g, '');
      const bEmail = (b.userEmail || '').trim().toLowerCase();
      return (enteredPhone && bPhone && enteredPhone === bPhone) || (enteredEmail && bEmail && enteredEmail === bEmail);
    });

    if (duplicateBooking) {
      setErrorMsg(`⚠️ Scholar "${duplicateBooking.userName || formData.fullName}" already has an active seat assigned (Desk ${duplicateBooking.seatNumber}, valid until ${duplicateBooking.endDate || 'active'}). A student cannot hold multiple active seats simultaneously.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const studentCode = `QD-STU-${Math.floor(1000 + Math.random() * 9000)}`;
      const bookingCode = `QD-WALK-${Math.floor(1000 + Math.random() * 9000)}`;

      const finalArrivalTime = formData.shift === 'CUSTOM'
        ? (formData.customArrivalTime || 'Custom Hours')
        : formData.arrivalTime;

      const selectedSeatObj = seats.find(s => s.id === formData.seatId);
      const assignedDeskName = selectedSeatObj ? `Desk ${selectedSeatObj.seatNumber}` : (formData.seatNumber || 'Open Floating Desk');

      // Student payload
      const studentPayload = {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || `${formData.phone.replace(/[^0-9]/g, '')}@student.quietdesk.local`,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        idProof: formData.idProof.trim(),
        passType: formData.passType,
        shift: formData.shift,
        arrivalTime: finalArrivalTime,
        startDate: formData.startDate,
        endDate: formData.endDate,
        assignedSeat: assignedDeskName,
        seatId: formData.seatId || '',
        seatNumber: selectedSeatObj ? selectedSeatObj.seatNumber : '',
        hasLocker: formData.hasLocker,
        lockerNumber: formData.hasLocker ? formData.lockerNumber : '',
        basePrice,
        lockerFee,
        totalAmount,
        amountPaid: parsedAmountPaid,
        pendingDue: pendingAmount,
        paymentStatus,
        paymentMethod: formData.paymentMethod,
        membershipStatus: 'ACTIVE',
        status: 'ACTIVE',
        registrationType: 'PHYSICAL_WALKIN',
        joinedDate: new Date().toISOString(),
        notes: formData.notes.trim()
      };

      // Booking payload
      const bookingPayload = {
        bookingCode,
        userName: formData.fullName.trim(),
        userPhone: formData.phone.trim(),
        userEmail: studentPayload.email,
        userAddress: formData.address.trim(),
        seatId: formData.seatId || '',
        seatNumber: selectedSeatObj ? selectedSeatObj.seatNumber : 'Floating Desk',
        passType: formData.passType,
        shift: formData.shift,
        bookingTime: finalArrivalTime,
        startDate: formData.startDate,
        endDate: formData.endDate,
        hasLocker: formData.hasLocker,
        lockerNumber: formData.hasLocker ? formData.lockerNumber : '',
        basePrice,
        lockerFee,
        totalAmount,
        advanceAmount: parsedAmountPaid,
        amountPaid: parsedAmountPaid,
        pendingAmount,
        paymentStatus,
        paymentMethod: formData.paymentMethod,
        paymentHistory: parsedAmountPaid > 0 ? [{
          amount: parsedAmountPaid,
          method: formData.paymentMethod,
          type: pendingAmount === 0 ? 'FULL' : 'ADVANCE',
          note: 'Walk-in Student Registration Fee',
          recordedAt: new Date().toISOString()
        }] : [],
        status: 'CONFIRMED',
        bookingType: 'PHYSICAL_WALKIN',
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString()
      };

      if (onSubmitSuccess) {
        await onSubmitSuccess({
          studentData: studentPayload,
          bookingData: bookingPayload,
          seatIdToOccupy: formData.seatId
        });
      }

      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMsg(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #CBD5E1'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #C9A574'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#C9A574',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <UserPlus size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Walk-in Student Registration
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Physical On-Site
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                Register on-spot walk-in students, configure arrival shift, assign desk & locker, and calculate dues in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {errorMsg && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              color: '#B91C1C',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Personal & Contact Information */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{
              margin: '0 0 1rem 0',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <User size={16} style={{ color: '#C9A574' }} />
              1. Student Personal & Contact Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Phone Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="tel"
                    required
                    placeholder="+977 9841234567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Physical Home / Hostel / College Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lazimpat, Kathmandu / Pulchowk Hostel"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Emergency Contact (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Parent / Guardian No."
                  value={formData.emergencyContact}
                  onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Package Tier & Station Choice */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{
              margin: '0 0 1rem 0',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Briefcase size={16} style={{ color: '#C9A574' }} />
              2. Package Selection & Desk Allocation
            </h4>

            {/* Package Selector Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { type: 'DAILY', title: 'Daily Pass', price: 'NPR 350', period: '/ day', desc: 'Flexible single-day pass' },
                { type: 'WEEKLY', title: 'Weekly Pass', price: 'NPR 2,100', period: '/ 7 days', desc: 'Ideal for short sprints & exam' },
                { type: 'MONTHLY', title: 'Monthly Pass', price: 'NPR 7,500', period: '/ 30 days', desc: 'Most popular regular scholar' }
              ].map(pkg => {
                const isSelected = formData.passType === pkg.type;
                return (
                  <div
                    key={pkg.type}
                    onClick={() => handlePassTypeChange(pkg.type)}
                    style={{
                      border: isSelected ? '2px solid #C9A574' : '1px solid #CBD5E1',
                      backgroundColor: isSelected ? '#FFFBEB' : '#FFFFFF',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#C9A574',
                        color: '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem'
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{pkg.title}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400E', margin: '0.2rem 0' }}>
                      {pkg.price} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{pkg.period}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{pkg.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Station and Locker Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Assign Desk / Study Station (Optional)
                </label>
                <select
                  value={formData.seatId}
                  onChange={e => {
                    const sId = e.target.value;
                    const found = seats.find(s => s.id === sId);
                    setFormData(prev => ({
                      ...prev,
                      seatId: sId,
                      seatNumber: found ? found.seatNumber : ''
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="">-- Open / Floating Desk (Flexible) --</option>
                  {availableSeats.map(seat => (
                    <option key={seat.id} value={seat.id}>
                      Desk {seat.seatNumber} ({seat.zone} - NPR {seat.pricePerDay}/day)
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '0.25rem' }}>
                  {availableSeats.length} stations currently available
                </span>
              </div>

              {/* Locker Facility Toggle */}
              <div style={{
                backgroundColor: formData.hasLocker ? '#EFF6FF' : '#FFFFFF',
                border: formData.hasLocker ? '1px solid #93C5FD' : '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasLocker}
                    onChange={e => handleLockerToggle(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={14} /> Include Storage Locker
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#3B82F6' }}>
                      +NPR {formData.passType === 'MONTHLY' ? '1,000' : formData.passType === 'WEEKLY' ? '300' : '200'} for personal locker key
                    </div>
                  </div>
                </label>

                {formData.hasLocker && (
                  <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E40AF' }}>Select Key Locker (A–T):</span>
                    {lockers && lockers.length > 0 ? (
                      <select
                        value={formData.lockerNumber}
                        onChange={e => setFormData({ ...formData, lockerNumber: e.target.value })}
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.78rem',
                          borderRadius: '6px',
                          border: '1px solid #93C5FD',
                          fontWeight: 700,
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A'
                        }}
                      >
                        {[...lockers]
                          .sort((a, b) => (a.label || a.lockerNumber || '').localeCompare(b.label || b.lockerNumber || '', undefined, { numeric: true, sensitivity: 'base' }))
                          .map(l => (
                          <option key={l.id} value={l.lockerNumber}>
                            {l.label || l.lockerNumber} ({l.status === 'AVAILABLE' ? '🟢 Free' : l.status === 'ASSIGNED' ? '🔵 Busy' : '🔴 Maint'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. L-01"
                        value={formData.lockerNumber}
                        onChange={e => setFormData({ ...formData, lockerNumber: e.target.value })}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #93C5FD',
                          width: '90px',
                          fontWeight: 700
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Arrival Timing & Schedule */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{
              margin: '0 0 1rem 0',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Clock size={16} style={{ color: '#C9A574' }} />
              3. Arrival Timing & Schedule (When will he come daily)
            </h4>

            {/* Shift Radio Buttons */}
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
              Daily Arrival Slot / Shift Time *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
              {SHIFT_OPTIONS.map(opt => {
                const isSelected = formData.shift === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleShiftChange(opt.id)}
                    style={{
                      border: isSelected ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? '#1E40AF' : '#0F172A' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? '#2563EB' : '#64748B', marginTop: '0.15rem' }}>
                      {opt.time}
                    </div>
                  </div>
                );
              })}
            </div>

            {formData.shift === 'CUSTOM' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Specify Custom Arrival Window
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM - 04:00 PM"
                  value={formData.customArrivalTime}
                  onChange={e => setFormData({ ...formData, customArrivalTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Start Date and Validity Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Start Date (From when will he start) *
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Valid Until / End Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Financial Breakdown, Payment & Pending Due Tracking */}
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '2px solid #FCD34D',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{
              margin: '0 0 1rem 0',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <DollarSign size={18} style={{ color: '#D97706' }} />
              4. Package Cost, Amount Paid & Pending Due
            </h4>

            {/* Real-time Calculation Ledger Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Package Fee</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '0.15rem' }}>
                  NPR {basePrice.toLocaleString()}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Locker Cost</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: formData.hasLocker ? '#2563EB' : '#94A3B8', marginTop: '0.15rem' }}>
                  {formData.hasLocker ? `+NPR ${lockerFee.toLocaleString()}` : 'None (NPR 0)'}
                </div>
              </div>

              <div style={{ backgroundColor: '#FEF3C7', padding: '0.85rem', borderRadius: '8px', border: '2px solid #F59E0B' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>Total Payable</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#78350F', marginTop: '0.15rem' }}>
                  NPR {totalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Payment Input and Real-time Balance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#78350F', display: 'block', marginBottom: '0.35rem' }}>
                  Amount Paid Right Now (NPR) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={formData.amountPaid}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, amountPaid: raw });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '2px solid #D97706',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Quick amount shortcuts */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, amountPaid: String(totalAmount) })}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#ECFDF5',
                      color: '#047857',
                      border: '1px solid #A7F3D0',
                      cursor: 'pointer'
                    }}
                  >
                    Paid Full (NPR {totalAmount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, amountPaid: String(Math.floor(totalAmount / 2)) })}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      border: '1px solid #FDE68A',
                      cursor: 'pointer'
                    }}
                  >
                    50% Advance
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, amountPaid: '0' })}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B',
                      border: '1px solid #FECACA',
                      cursor: 'pointer'
                    }}
                  >
                    Unpaid / 0
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#78350F', display: 'block', marginBottom: '0.35rem' }}>
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="CASH">💵 Cash at Front Desk</option>
                  <option value="FONEPAY_QR">📱 FonePay QR Scan</option>
                  <option value="ESEWA">🟢 eSewa Digital Wallet</option>
                  <option value="KHALTI">🟣 Khalti Wallet</option>
                  <option value="CARD">💳 POS Card Payment</option>
                  <option value="BANK_TRANSFER">🏦 Direct Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Outstanding Balance Banner */}
            <div style={{
              backgroundColor: pendingAmount > 0 ? '#FEF2F2' : '#ECFDF5',
              border: pendingAmount > 0 ? '1px solid #FECACA' : '1px solid #A7F3D0',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: pendingAmount > 0 ? '#991B1B' : '#047857' }}>
                  {pendingAmount > 0 ? '⚠️ Outstanding Due Balance' : '✓ Full Payment Settled'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: pendingAmount > 0 ? '#DC2626' : '#059669' }}>
                  NPR {pendingAmount.toLocaleString()} {pendingAmount === 0 ? '(Nil)' : ''}
                </div>
              </div>
              <span style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                backgroundColor: paymentStatus === 'PAID' ? '#D1FAE5' : paymentStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                color: paymentStatus === 'PAID' ? '#047857' : paymentStatus === 'PARTIAL' ? '#B45309' : '#991B1B'
              }}>
                Status: {paymentStatus}
              </span>
            </div>
          </div>

          {/* SECTION 5: Additional Notes & Requests */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <FileText size={16} style={{ color: '#C9A574' }} />
              5. Student Notes & Remarks (If student has anything else)
            </h4>

            <textarea
              rows={3}
              placeholder="e.g. Exam goals (MBBS / IOE / Loksewa / CA), prefers silent window area, brought dual monitors, ID proof verified..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Modal Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.5rem',
            borderTop: '1px solid #E2E8F0'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.7rem 1.4rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
              }}
            >
              {isSubmitting ? (
                <>Processing Registration...</>
              ) : (
                <>
                  <CheckCircle2 size={18} style={{ color: '#C9A574' }} />
                  Complete Walk-in Registration (Total: NPR {totalAmount.toLocaleString()})
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
