import React, { useState, useEffect } from 'react';
import {
  X, UserPlus, CheckCircle2, AlertTriangle, Lock, ShieldCheck,
  Calendar, Clock, Phone, Mail, User, MapPin, DollarSign,
  Car, MessageSquare, Ticket, Sparkles, Check
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { sendReservationConfirmationEmail } from '../../services/emailService';

export const RegisterNewStudentModal = ({
  isOpen,
  onClose,
  preselectedBooking = null,
  preselectedSeat = null,
  onSuccess
}) => {
  const {
    seats = [],
    lockers = [],
    bookings = [],
    findOrCreateStudent,
    createAdminBooking,
    updateBookingDetails,
    changeSeatStatus,
    assignLocker,
    updateUser
  } = useBooking();

  const today = new Date().toISOString().split('T')[0];

  // Pending reservations list from website
  const pendingReservations = bookings.filter(
    b => b.status === 'PENDING' || b.status === 'PENDING_CONFIRMATION'
  );

  const [selectedPendingId, setSelectedPendingId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phone: '',
    email: '',
    seatId: '',
    seatNumber: '',
    passType: 'DAILY',
    startDate: today,
    endDate: today,
    hasLocker: false,
    lockerNumber: '',
    parkingNeeded: false,
    vehicleNumber: '',
    referralSource: 'Social Media',
    referralOther: '',
    emergencyContact: '',
    emergencyRelation: '',
    paymentMethod: 'CASH',
    amountPaid: '500',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState('');

  // Calculate End Date helper
  const calculateEndDate = (startStr, passType) => {
    if (!startStr) return '';
    const parts = startStr.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0])) return startStr;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    const pt = (passType || 'DAILY').toUpperCase();
    if (pt === 'DAILY') {
      return startStr;
    } else if (pt === 'WEEKLY') {
      date.setDate(date.getDate() + 7);
    } else if (pt === 'MONTHLY') {
      date.setDate(date.getDate() + 30);
    }
    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  };

  // Pricing helper
  const calculatePricing = (passType, seatId, hasLocker) => {
    let basePrice = 500;
    const currentSeat = seats.find(s => s.id === seatId);
    const seatRate = currentSeat ? Number(currentSeat.pricePerDay) || 500 : 500;

    const pt = (passType || 'DAILY').toUpperCase();
    if (pt === 'DAILY') {
      basePrice = seatRate;
    } else if (pt === 'WEEKLY') {
      basePrice = 2800;
    } else if (pt === 'MONTHLY') {
      basePrice = 9500;
    }

    let lockerFee = 0;
    if (hasLocker) {
      if (pt === 'DAILY') lockerFee = 200;
      else if (pt === 'WEEKLY') lockerFee = 300;
      else if (pt === 'MONTHLY') lockerFee = 1000;
      else lockerFee = 200;
    }

    const totalAmount = basePrice + lockerFee;
    return { basePrice, lockerFee, totalAmount };
  };

  const { basePrice, lockerFee, totalAmount } = calculatePricing(
    formData.passType,
    formData.seatId,
    formData.hasLocker
  );

  // Synchronize initial state on open
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setEmailStatusMsg('');

      if (preselectedBooking) {
        populateFromBooking(preselectedBooking);
      } else if (preselectedSeat) {
        const pPrice = calculatePricing('DAILY', preselectedSeat.id, false);
        setFormData({
          fullName: '',
          address: '',
          phone: '',
          email: '',
          seatId: preselectedSeat.id,
          seatNumber: preselectedSeat.seatNumber,
          passType: 'DAILY',
          startDate: today,
          endDate: today,
          hasLocker: false,
          lockerNumber: '',
          parkingNeeded: false,
          vehicleNumber: '',
          referralSource: 'Social Media',
          referralOther: '',
          emergencyContact: '',
          emergencyRelation: '',
          paymentMethod: 'CASH',
          amountPaid: String(pPrice.totalAmount),
          notes: ''
        });
        setSelectedPendingId('');
      } else {
        const firstAvailSeat = seats.find(s => s.status === 'AVAILABLE');
        const pPrice = calculatePricing('DAILY', firstAvailSeat?.id, false);
        setFormData({
          fullName: '',
          address: '',
          phone: '',
          email: '',
          seatId: firstAvailSeat?.id || '',
          seatNumber: firstAvailSeat?.seatNumber || '',
          passType: 'DAILY',
          startDate: today,
          endDate: today,
          hasLocker: false,
          lockerNumber: '',
          parkingNeeded: false,
          vehicleNumber: '',
          referralSource: 'Social Media',
          referralOther: '',
          emergencyContact: '',
          emergencyRelation: '',
          paymentMethod: 'CASH',
          amountPaid: String(pPrice.totalAmount),
          notes: ''
        });
        setSelectedPendingId('');
      }
    }
  }, [isOpen, preselectedBooking?.id, preselectedSeat?.id]);

  const populateFromBooking = (b) => {
    setSelectedPendingId(b.id);
    const calculatedEnd = b.endDate || calculateEndDate(b.startDate || today, b.passType || 'DAILY');
    const pPrice = calculatePricing(b.passType || 'DAILY', b.seatId, !!b.hasLocker);

    const firstAvailLocker = lockers.find(l => l.status === 'AVAILABLE');

    setFormData({
      fullName: b.userName || '',
      address: b.userAddress || b.address || '',
      phone: b.userPhone || b.phone || '',
      email: b.userEmail || b.email || '',
      seatId: b.seatId || '',
      seatNumber: b.seatNumber || '',
      passType: b.passType || 'DAILY',
      startDate: b.startDate || today,
      endDate: calculatedEnd,
      hasLocker: !!b.hasLocker,
      lockerNumber: b.lockerNumber || (b.hasLocker && firstAvailLocker ? firstAvailLocker.lockerNumber : ''),
      parkingNeeded: !!b.parkingNeeded,
      vehicleNumber: b.vehicleNumber || '',
      referralSource: b.referralSource || 'Social Media',
      referralOther: b.referralOther || '',
      emergencyContact: b.emergencyContact || '',
      emergencyRelation: b.emergencyRelation || '',
      paymentMethod: b.paymentMethod || 'CASH',
      amountPaid: String(b.amountPaid || b.totalAmount || pPrice.totalAmount),
      notes: b.notes || ''
    });
    setErrors({});
  };

  const handlePendingSelect = (bookingId) => {
    if (!bookingId) {
      setSelectedPendingId('');
      const firstAvail = seats.find(s => s.status === 'AVAILABLE');
      const pPrice = calculatePricing('DAILY', firstAvail?.id, false);
      setFormData(prev => ({
        ...prev,
        fullName: '',
        address: '',
        phone: '',
        email: '',
        seatId: firstAvail?.id || '',
        seatNumber: firstAvail?.seatNumber || '',
        passType: 'DAILY',
        startDate: today,
        endDate: today,
        hasLocker: false,
        lockerNumber: '',
        amountPaid: String(pPrice.totalAmount)
      }));
      return;
    }
    const b = pendingReservations.find(p => p.id === bookingId);
    if (b) {
      populateFromBooking(b);
    }
  };

  // Handle Pass change
  const handlePassTypeChange = (newPassType) => {
    const newEnd = calculateEndDate(formData.startDate, newPassType);
    const pPrice = calculatePricing(newPassType, formData.seatId, formData.hasLocker);
    setFormData(prev => ({
      ...prev,
      passType: newPassType,
      endDate: newEnd,
      amountPaid: String(pPrice.totalAmount)
    }));
    if (errors.passType) setErrors(prev => ({ ...prev, passType: null }));
  };

  // Handle Start Date change
  const handleStartDateChange = (newStartDate) => {
    const newEnd = calculateEndDate(newStartDate, formData.passType);
    setFormData(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEnd
    }));
    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: null }));
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!formData.address.trim()) errs.address = 'Address is required.';
    if (!formData.phone.trim()) errs.phone = 'Contact number is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!formData.email.includes('@')) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.seatId) errs.seatId = 'A physical desk station must be selected.';
    if (!formData.passType) errs.passType = 'Package selection is required.';
    if (!formData.startDate) errs.startDate = 'Start date is required.';
    if (!formData.endDate) errs.endDate = 'End date is required.';
    if (!formData.paymentMethod) errs.paymentMethod = 'Payment mode is required.';
    if (formData.amountPaid === '' || isNaN(Number(formData.amountPaid)) || Number(formData.amountPaid) < 0) {
      errs.amountPaid = 'Valid payment amount is required.';
    }
    if (formData.hasLocker && !formData.lockerNumber) {
      errs.lockerNumber = 'Please allocate a locker number.';
    }
    if (formData.parkingNeeded && !formData.vehicleNumber.trim()) {
      errs.vehicleNumber = 'Please provide vehicle / bike number.';
    }
    if (formData.referralSource === 'Other' && !formData.referralOther.trim()) {
      errs.referralOther = 'Please specify where you heard about us.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    setEmailStatusMsg('');

    try {
      const selectedSeatObj = seats.find(s => s.id === formData.seatId);
      if (!selectedSeatObj) {
        throw new Error('Selected desk could not be found.');
      }

      // Check if another active booking is currently using this seat during overlapping dates
      const currentActiveOnSeat = bookings.find(b => {
        if (selectedPendingId && b.id === selectedPendingId) return false;
        if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(b.status)) return false;
        if (b.seatId !== formData.seatId) return false;
        // Check date overlap
        const bStart = b.startDate || today;
        const bEnd = b.endDate || bStart;
        const overlap = formData.startDate <= bEnd && bStart <= formData.endDate;
        return overlap;
      });

      if (currentActiveOnSeat) {
        throw new Error(
          `Desk #${selectedSeatObj.seatNumber} is already occupied by ${currentActiveOnSeat.userName || 'another scholar'} until ${currentActiveOnSeat.endDate || 'active'}. Please select another desk.`
        );
      }

      // Check if student already has another active seat in the same period
      const cleanPhone = formData.phone.trim().replace(/\D/g, '');
      const cleanEmail = formData.email.trim().toLowerCase();

      const studentHasConflictingSeat = bookings.find(b => {
        if (selectedPendingId && b.id === selectedPendingId) return false;
        if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(b.status)) return false;
        if (b.seatId === formData.seatId) return false; // same seat renewal is fine

        const bPhone = (b.userPhone || '').replace(/\D/g, '');
        const bEmail = (b.userEmail || '').toLowerCase().trim();
        const sameStudent = (cleanPhone && bPhone && cleanPhone === bPhone) || (cleanEmail && bEmail && cleanEmail === bEmail);

        if (!sameStudent) return false;
        const bStart = b.startDate || today;
        const bEnd = b.endDate || bStart;
        return formData.startDate <= bEnd && bStart <= formData.endDate;
      });

      if (studentHasConflictingSeat) {
        throw new Error(
          `Scholar "${formData.fullName}" already holds active Desk #${studentHasConflictingSeat.seatNumber} (until ${studentHasConflictingSeat.endDate}). A student cannot occupy two desks simultaneously.`
        );
      }

      // 1. Create or Find Student record in Firestore
      const studentPayload = {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        emergencyRelation: formData.emergencyRelation.trim(),
        parkingNeeded: formData.parkingNeeded,
        vehicleNumber: formData.parkingNeeded ? formData.vehicleNumber.trim() : '',
        referralSource: formData.referralSource === 'Other' ? formData.referralOther.trim() : formData.referralSource,
        passType: formData.passType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        assignedSeat: `Desk ${selectedSeatObj.seatNumber}`,
        seatId: selectedSeatObj.id,
        seatNumber: selectedSeatObj.seatNumber,
        hasLocker: formData.hasLocker,
        lockerNumber: formData.hasLocker ? formData.lockerNumber : '',
        status: 'ACTIVE',
        membershipStatus: 'ACTIVE',
        updatedAt: new Date().toISOString()
      };

      const { user: studentRecord } = await findOrCreateStudent(studentPayload);

      const parsedPaid = Math.min(totalAmount, Math.max(0, Number(formData.amountPaid) || 0));
      const pendingDue = Math.max(0, totalAmount - parsedPaid);
      const paymentStatus = parsedPaid >= totalAmount && totalAmount > 0 ? 'PAID' : parsedPaid > 0 ? 'PARTIAL' : 'PENDING';

      let finalBookingId = selectedPendingId;

      // 2. Update existing pending booking or create a new Admin booking
      if (selectedPendingId) {
        await updateBookingDetails(selectedPendingId, {
          userId: studentRecord.id,
          userCode: studentRecord.userCode,
          userName: studentRecord.fullName || studentRecord.name,
          userPhone: studentRecord.phone,
          userEmail: studentRecord.email,
          userAddress: formData.address.trim(),
          seatId: selectedSeatObj.id,
          seatNumber: selectedSeatObj.seatNumber,
          passType: formData.passType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          hasLocker: formData.hasLocker,
          lockerNumber: formData.hasLocker ? formData.lockerNumber : '',
          parkingNeeded: formData.parkingNeeded,
          vehicleNumber: formData.parkingNeeded ? formData.vehicleNumber.trim() : '',
          referralSource: formData.referralSource === 'Other' ? formData.referralOther.trim() : formData.referralSource,
          emergencyContact: formData.emergencyContact.trim(),
          emergencyRelation: formData.emergencyRelation.trim(),
          basePrice,
          lockerFee,
          totalAmount,
          amountPaid: parsedPaid,
          pendingAmount: pendingDue,
          paymentStatus,
          paymentMethod: formData.paymentMethod,
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString()
        });
      } else {
        const newBooking = await createAdminBooking({
          userId: studentRecord.id,
          userCode: studentRecord.userCode,
          userName: studentRecord.fullName || studentRecord.name,
          userPhone: studentRecord.phone,
          userEmail: studentRecord.email,
          userAddress: formData.address.trim(),
          seatId: selectedSeatObj.id,
          seatNumber: selectedSeatObj.seatNumber,
          passType: formData.passType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          hasLocker: formData.hasLocker,
          lockerNumber: formData.hasLocker ? formData.lockerNumber : '',
          parkingNeeded: formData.parkingNeeded,
          vehicleNumber: formData.parkingNeeded ? formData.vehicleNumber.trim() : '',
          referralSource: formData.referralSource === 'Other' ? formData.referralOther.trim() : formData.referralSource,
          emergencyContact: formData.emergencyContact.trim(),
          emergencyRelation: formData.emergencyRelation.trim(),
          basePrice,
          lockerFee,
          totalAmount,
          amountPaid: parsedPaid,
          pendingAmount: pendingDue,
          paymentStatus,
          paymentMethod: formData.paymentMethod,
          status: 'CONFIRMED',
          bookingType: 'PHYSICAL_WALKIN'
        });
        finalBookingId = newBooking.id;
      }

      // 3. Mark the Seat as OCCUPIED
      await changeSeatStatus(selectedSeatObj.id, 'OCCUPIED');

      // 4. Update Locker allocation if applicable
      if (formData.hasLocker && formData.lockerNumber) {
        const matchingLocker = lockers.find(l => l.lockerNumber === formData.lockerNumber || l.id === formData.lockerNumber);
        if (matchingLocker) {
          await assignLocker(matchingLocker.id, {
            userId: studentRecord.id,
            userName: studentRecord.fullName || studentRecord.name,
            userPhone: studentRecord.phone,
            userEmail: studentRecord.email,
            seatNumber: selectedSeatObj.seatNumber,
            passType: formData.passType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            notes: `Registered student desk ${selectedSeatObj.seatNumber}`
          });
        }
      }

      // 5. Trigger Confirmation Email via integration point
      const emailResult = await sendReservationConfirmationEmail({
        studentName: studentRecord.fullName || studentRecord.name,
        studentEmail: studentRecord.email,
        seatNumber: selectedSeatObj.seatNumber,
        passType: formData.passType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        hasLocker: formData.hasLocker,
        lockerNumber: formData.lockerNumber,
        totalAmount,
        amountPaid: parsedPaid,
        pendingAmount: pendingDue,
        bookingCode: finalBookingId
      });

      const emailNote = emailResult.sent
        ? '\n📧 Confirmation email sent to student.'
        : `\nℹ️ Email status: ${emailResult.reason}`;

      alert(
        `✅ Student registered successfully. Seat ${selectedSeatObj.seatNumber} assigned until ${formData.endDate}.${emailNote}`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Registration Failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Available seats: include seats with status AVAILABLE + if editing pending, its existing seat
  const selectableSeats = seats.filter(
    s => s.status === 'AVAILABLE' || s.id === formData.seatId
  );

  const availableLockers = lockers.filter(
    l => l.status === 'AVAILABLE' || l.lockerNumber === formData.lockerNumber
  );

  const inputStyle = (hasErr) => ({
    width: '100%',
    padding: '0.6rem 0.85rem',
    borderRadius: '8px',
    border: hasErr ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0F172A',
    boxSizing: 'border-box'
  });

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.35rem'
  };

  const errStyle = {
    color: '#DC2626',
    fontSize: '0.75rem',
    fontWeight: 700,
    marginTop: '0.25rem'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '760px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '17px',
          borderTopRightRadius: '17px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <UserPlus size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>Register New Student</div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Quiet Desk Kathmandu • Single Unified Registration & Seat Assignment
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFF',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SOURCE A: Pending Website Reservations Dropdown */}
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '2px solid #FCD34D',
            borderRadius: '12px',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Ticket size={18} color="#B45309" />
              <label style={{ ...labelStyle, color: '#92400E', margin: 0 }}>
                Pending Website Reservations ({pendingReservations.length})
              </label>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#78350F', margin: '0 0 0.6rem 0' }}>
              Select an online booking to auto-fill all student details, or leave empty for a manual walk-in.
            </p>
            <select
              value={selectedPendingId}
              onChange={(e) => handlePendingSelect(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1.5px solid #F59E0B',
                backgroundColor: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#78350F',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Manual Registration (New Student / Walk-in) --</option>
              {pendingReservations.map(p => (
                <option key={p.id} value={p.id}>
                  {p.bookingCode} — {p.userName} (Desk {p.seatNumber} • {p.passType} Pass)
                </option>
              ))}
            </select>
          </div>

          {/* Section 1: Required Student Identity */}
          <div>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} color="#059669" /> 1. Student Personal Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.fullName}
                  onChange={e => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: null });
                  }}
                  style={inputStyle(!!errors.fullName)}
                />
                {errors.fullName && <div style={errStyle}>{errors.fullName}</div>}
              </div>

              <div>
                <label style={labelStyle}>Physical Address <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Lazimpat, Kathmandu"
                  value={formData.address}
                  onChange={e => {
                    setFormData({ ...formData, address: e.target.value });
                    if (errors.address) setErrors({ ...errors, address: null });
                  }}
                  style={inputStyle(!!errors.address)}
                />
                {errors.address && <div style={errStyle}>{errors.address}</div>}
              </div>

              <div>
                <label style={labelStyle}>Contact / Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="tel"
                  placeholder="+977 9841234567"
                  value={formData.phone}
                  onChange={e => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                  style={inputStyle(!!errors.phone)}
                />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>

              <div>
                <label style={labelStyle}>Email Address <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="email"
                  placeholder="aarav@example.com"
                  value={formData.email}
                  onChange={e => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  style={inputStyle(!!errors.email)}
                />
                {errors.email && <div style={errStyle}>{errors.email}</div>}
              </div>
            </div>
          </div>

          {/* Section 2: Package, Dates & Seat Assignment */}
          <div>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} color="#059669" /> 2. Package & Physical Desk Assignment
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Select Package <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  value={formData.passType}
                  onChange={e => handlePassTypeChange(e.target.value)}
                  style={inputStyle(!!errors.passType)}
                >
                  <option value="DAILY">Daily Pass (Per day base rate)</option>
                  <option value="WEEKLY">Weekly Pass (7 Days - NPR 2,800)</option>
                  <option value="MONTHLY">Monthly Membership (30 Days - NPR 9,500)</option>
                </select>
                {errors.passType && <div style={errStyle}>{errors.passType}</div>}
              </div>

              <div>
                <label style={labelStyle}>Assigned Desk Station <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  value={formData.seatId}
                  onChange={e => {
                    const sid = e.target.value;
                    const s = seats.find(item => item.id === sid);
                    setFormData(prev => ({
                      ...prev,
                      seatId: sid,
                      seatNumber: s ? s.seatNumber : ''
                    }));
                    if (errors.seatId) setErrors({ ...errors, seatId: null });
                  }}
                  style={inputStyle(!!errors.seatId)}
                >
                  <option value="">-- Choose Physical Desk --</option>
                  {selectableSeats.map(s => (
                    <option key={s.id} value={s.id}>
                      Desk #{s.seatNumber} ({s.zone || 'Zone'}) {s.status === 'AVAILABLE' ? '— Open' : '— Assigned'}
                    </option>
                  ))}
                </select>
                {errors.seatId && <div style={errStyle}>{errors.seatId}</div>}
              </div>

              <div>
                <label style={labelStyle}>Start Date <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => handleStartDateChange(e.target.value)}
                  style={inputStyle(!!errors.startDate)}
                />
                {errors.startDate && <div style={errStyle}>{errors.startDate}</div>}
              </div>

              <div>
                <label style={labelStyle}>Calculated Expiry Date <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  style={inputStyle(!!errors.endDate)}
                />
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                  📅 Expiry automated from package duration
                </div>
                {errors.endDate && <div style={errStyle}>{errors.endDate}</div>}
              </div>
            </div>
          </div>

          {/* Section 3: Facilities (Locker & Parking) */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
              3. Lockers & Parking Facilities
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasLocker}
                    onChange={e => {
                      const hasL = e.target.checked;
                      const firstAvail = lockers.find(l => l.status === 'AVAILABLE');
                      const pPrice = calculatePricing(formData.passType, formData.seatId, hasL);
                      setFormData(prev => ({
                        ...prev,
                        hasLocker: hasL,
                        lockerNumber: hasL ? (prev.lockerNumber || firstAvail?.lockerNumber || '') : '',
                        amountPaid: String(pPrice.totalAmount)
                      }));
                    }}
                  />
                  <Lock size={15} color="#6D28D9" /> Key Locker Facility: {formData.hasLocker ? 'Yes' : 'No'}
                </label>
                {formData.hasLocker && (
                  <>
                    <select
                      value={formData.lockerNumber}
                      onChange={e => setFormData({ ...formData, lockerNumber: e.target.value })}
                      style={inputStyle(!!errors.lockerNumber)}
                    >
                      <option value="">-- Choose Locker Unit --</option>
                      {availableLockers.map(l => (
                        <option key={l.id} value={l.lockerNumber}>
                          {l.lockerNumber} ({l.location || 'South Bank'})
                        </option>
                      ))}
                    </select>
                    {errors.lockerNumber && <div style={errStyle}>{errors.lockerNumber}</div>}
                  </>
                )}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.parkingNeeded}
                    onChange={e => setFormData({ ...formData, parkingNeeded: e.target.checked })}
                  />
                  <Car size={15} color="#0284C7" /> Parking Needed: {formData.parkingNeeded ? 'Yes' : 'No'}
                </label>
                {formData.parkingNeeded && (
                  <>
                    <input
                      type="text"
                      placeholder="e.g. Ba 2 Pa 4567 (Bike / Vehicle Number)"
                      value={formData.vehicleNumber}
                      onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      style={inputStyle(!!errors.vehicleNumber)}
                    />
                    {errors.vehicleNumber && <div style={errStyle}>{errors.vehicleNumber}</div>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Payment Recording */}
          <div>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={16} color="#059669" /> 4. Payment Collection
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Payment Mode <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  value={formData.paymentMethod}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  style={inputStyle(!!errors.paymentMethod)}
                >
                  <option value="CASH">Cash</option>
                  <option value="FONEPAY_QR">FonePay QR</option>
                  <option value="ESEWA">eSewa</option>
                  <option value="KHALTI">Khalti</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                {errors.paymentMethod && <div style={errStyle}>{errors.paymentMethod}</div>}
              </div>

              <div>
                <label style={labelStyle}>Amount Paid (NPR) <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  value={formData.amountPaid}
                  onChange={e => {
                    setFormData({ ...formData, amountPaid: e.target.value });
                    if (errors.amountPaid) setErrors({ ...errors, amountPaid: null });
                  }}
                  style={inputStyle(!!errors.amountPaid)}
                />
                {errors.amountPaid && <div style={errStyle}>{errors.amountPaid}</div>}
              </div>
            </div>

            {/* Financial summary bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginTop: '0.75rem'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 600 }}>
                  Base: NPR {basePrice.toLocaleString()} {lockerFee > 0 ? `+ Locker: NPR ${lockerFee}` : ''}
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1E3A8A' }}>
                  Total Package Due: NPR {totalAmount.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>
                  Paid: NPR {(Number(formData.amountPaid) || 0).toLocaleString()}
                </span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: Math.max(0, totalAmount - (Number(formData.amountPaid) || 0)) > 0 ? '#DC2626' : '#047857' }}>
                  {Math.max(0, totalAmount - (Number(formData.amountPaid) || 0)) > 0
                    ? `Balance Due: NPR ${Math.max(0, totalAmount - (Number(formData.amountPaid) || 0)).toLocaleString()}`
                    : '✓ Fully Paid'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Optional Emergency & Referral Information */}
          <details style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>
              + Optional: Emergency Contact & Referral Information
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.85rem' }}>
              <div>
                <label style={labelStyle}>Emergency Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.emergencyContact}
                  onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={labelStyle}>Relation</label>
                <input
                  type="text"
                  placeholder="e.g. Father, Sister"
                  value={formData.emergencyRelation}
                  onChange={e => setFormData({ ...formData, emergencyRelation: e.target.value })}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={labelStyle}>Where did you hear about us?</label>
                <select
                  value={formData.referralSource}
                  onChange={e => setFormData({ ...formData, referralSource: e.target.value })}
                  style={inputStyle(false)}
                >
                  <option value="Social Media">Social Media</option>
                  <option value="Friends">Friends</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.referralSource === 'Other' && (
                <div>
                  <label style={labelStyle}>Please specify</label>
                  <input
                    type="text"
                    placeholder="e.g. Newspaper, Billboard"
                    value={formData.referralOther}
                    onChange={e => setFormData({ ...formData, referralOther: e.target.value })}
                    style={inputStyle(!!errors.referralOther)}
                  />
                  {errors.referralOther && <div style={errStyle}>{errors.referralOther}</div>}
                </div>
              )}
            </div>
          </details>

          {/* Footer CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)'
              }}
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? 'Registering Student...' : 'Register Student'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
