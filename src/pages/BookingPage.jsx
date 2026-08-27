import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useBooking } from '../context/BookingContext';
import { ACCESS_PLANS } from '../services/mock/mockData';
import { CheckCircle2, User, Mail, Phone, Calendar, ArrowRight, ArrowLeft, ShieldCheck, Ticket, Sparkles, Lock, Clock, Camera } from 'lucide-react';

export const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { seats, createBooking } = useBooking();

  const urlSeatId = searchParams.get('seat');
  const urlPlanId = searchParams.get('plan');

  // Helper to format today's local date YYYY-MM-DD
  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayLocalDate = getTodayLocalDateStr();

  // Helper to compute next 15-minute slot for current local time
  const getNext15MinSlot = (date = new Date()) => {
    const d = new Date(date);
    const remainder = d.getMinutes() % 15;
    if (remainder !== 0) {
      d.setMinutes(d.getMinutes() + (15 - remainder));
    }
    let hour = d.getHours();
    const min = d.getMinutes();
    if (hour < 5) hour = 5;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMin = min < 10 ? `0${min}` : min;
    return `${displayHour < 10 ? '0' + displayHour : displayHour}:${displayMin} ${period}`;
  };

  // Convert "HH:MM AM/PM" to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const [step, setStep] = useState(1);
  const [selectedSeatId, setSelectedSeatId] = useState(urlSeatId || '');
  const [selectedPassType, setSelectedPassType] = useState(urlPlanId ? urlPlanId.toUpperCase() : 'DAILY');
  const [includeLocker, setIncludeLocker] = useState(false);
  const [startDate, setStartDate] = useState(todayLocalDate);
  const [arrivalTime, setArrivalTime] = useState(getNext15MinSlot());
  const [customArrivalTime, setCustomArrivalTime] = useState('');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: ''
  });
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Generate 15-minute time slots from 05:00 AM to 10:00 PM
  const allTimeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 5; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 15) {
        if (hour === 22 && min > 0) break; // Stop at 10:00 PM
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const displayMin = min < 10 ? `0${min}` : min;
        slots.push(`${displayHour < 10 ? '0' + displayHour : displayHour}:${displayMin} ${period}`);
      }
    }
    return slots;
  }, []);

  // Filter time slots if selected date is today (prevent booking past times)
  const availableTimeSlots = useMemo(() => {
    if (startDate !== todayLocalDate) {
      return allTimeSlots;
    }
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const valid = allTimeSlots.filter(slot => {
      const slotMinutes = parseTimeToMinutes(slot);
      return slotMinutes >= currentMinutes;
    });

    return valid.length > 0 ? valid : [allTimeSlots[allTimeSlots.length - 1]];
  }, [startDate, todayLocalDate, allTimeSlots]);

  // Keep arrivalTime synchronized to valid available slot
  useEffect(() => {
    if (startDate === todayLocalDate) {
      const nextSlot = getNext15MinSlot();
      if (availableTimeSlots.includes(nextSlot)) {
        setArrivalTime(nextSlot);
      } else if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(arrivalTime)) {
        setArrivalTime(availableTimeSlots[0]);
      }
    } else if (!availableTimeSlots.includes(arrivalTime) && availableTimeSlots.length > 0) {
      setArrivalTime(availableTimeSlots[0]);
    }
  }, [startDate, availableTimeSlots]);

  useEffect(() => {
    if (urlSeatId && !selectedSeatId) {
      setSelectedSeatId(urlSeatId);
    }
  }, [urlSeatId]);

  // Scroll to top whenever step changes so user sees the form from the top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const selectedSeatObj = seats.find(s => s.id === selectedSeatId) || seats.find(s => s.status === 'AVAILABLE');

  const getLockerFee = () => {
    if (!includeLocker) return 0;
    if (selectedPassType === 'WEEKLY') return 300;
    if (selectedPassType === 'MONTHLY') return 1000;
    return 0;
  };

  const calculateBasePrice = () => {
    if (selectedPassType === 'WEEKLY') return 2800;
    if (selectedPassType === 'MONTHLY') return 9500;
    return selectedSeatObj ? selectedSeatObj.pricePerDay : 500;
  };

  const calculateTotal = () => {
    return calculateBasePrice() + getLockerFee();
  };

  const finalArrivalTime = isCustomTime ? (customArrivalTime || '07:00 AM') : arrivalTime;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1 && (!selectedSeatObj || selectedSeatObj.status !== 'AVAILABLE')) {
      alert('Please select an available desk to proceed.');
      return;
    }
    if (step === 2) {
      if (startDate < todayLocalDate) {
        alert('Reservation date cannot be in the past. Please select today or a future date.');
        return;
      }
      if (startDate === todayLocalDate) {
        const timeToValidate = isCustomTime ? customArrivalTime : arrivalTime;
        const selectedMins = parseTimeToMinutes(timeToValidate);
        const currentNow = new Date();
        const currentMins = currentNow.getHours() * 60 + currentNow.getMinutes();
        if (selectedMins < currentMins) {
          alert(`Expected arrival time cannot be in the past for today. Please select a time slot from ${availableTimeSlots[0]} onwards.`);
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    try {
      const booking = await createBooking({
        seatId: selectedSeatObj.id,
        seatNumber: selectedSeatObj.seatNumber,
        zone: selectedSeatObj.zone || '',
        passType: selectedPassType,
        hasLocker: includeLocker && selectedPassType !== 'DAILY',
        lockerFee: getLockerFee(),
        startDate: startDate,
        endDate: startDate,
        arrivalTime: finalArrivalTime,
        bookingTime: finalArrivalTime,
        userName: formData.userName,
        userEmail: formData.userEmail,
        userPhone: formData.userPhone,
        totalAmount: calculateTotal(),
        status: 'PENDING_CONFIRMATION',
        bookingType: 'WEBSITE_BOOKING'
      });
      setConfirmedBooking(booking);
      setStep(4);
    } catch (err) {
      alert('Error submitting reservation request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Header />

      <main className="section" style={{ flex: 1, paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>

          {/* Stepper Progress Header */}
          {step < 4 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', position: 'relative' }}>
                {['Select Desk & Pass', 'Your Information', 'Review Details'].map((label, index) => {
                  const stepNum = index + 1;
                  const isActive = step === stepNum;
                  const isDone = step > stepNum;
                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--bg-surface)',
                        color: isActive || isDone ? '#FFFFFF' : 'var(--text-muted)',
                        border: isActive ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        marginBottom: '0.5rem',
                        transition: 'all 0.3s ease'
                      }}>
                        {isDone ? <CheckCircle2 size={20} /> : stepNum}
                      </div>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                      }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Select Desk & Access Plan */}
          {step === 1 && (
            <div className="card" style={{ padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>Choose Your Workspace</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Select an open desk and access duration for your Kathmandu study session.
              </p>

              {/* Pass Type Selector */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  1. Select Access Pass Duration
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {[
                    { type: 'DAILY', label: 'Daily Pass', price: 'NPR 500 / day', lockerText: 'Locker on request' },
                    { type: 'WEEKLY', label: 'Weekly Pass', price: 'NPR 2,800 / wk', lockerText: 'Locker available' },
                    { type: 'MONTHLY', label: 'Monthly Membership', price: 'NPR 9,500 / mo', lockerText: 'Locker available' }
                  ].map((plan) => (
                    <button
                      key={plan.type}
                      type="button"
                      onClick={() => {
                        setSelectedPassType(plan.type);
                        if (plan.type === 'DAILY') setIncludeLocker(false);
                      }}
                      style={{
                        padding: '1.25rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: selectedPassType === plan.type ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                        backgroundColor: selectedPassType === plan.type ? 'var(--accent-light)' : 'var(--bg-surface)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{plan.label}</div>
                      {/* Price hidden per owner's request — data retained */}
                      <div style={{ display: 'none', fontSize: '0.85rem', color: 'var(--accent-hover)', fontWeight: 600 }}>{plan.price}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        🔒 {plan.lockerText}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Locker Facility Selector Option */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  2. Key Locker Facility Option
                </label>
                {selectedPassType === 'WEEKLY' || selectedPassType === 'MONTHLY' ? (
                  <div
                    onClick={() => setIncludeLocker(!includeLocker)}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: 'var(--radius-lg)',
                      border: includeLocker ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                      backgroundColor: includeLocker ? 'var(--accent-light)' : 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: includeLocker ? 'var(--accent)' : 'var(--bg-main)',
                        color: includeLocker ? 'var(--primary)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Lock size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          Add Secure Key Locker Facility
                          {includeLocker && (
                            <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--accent)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                              ADDED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Physical key locker to safely store your books &amp; personal tech.
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeLocker}
                      onChange={(e) => setIncludeLocker(e.target.checked)}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--accent-hover)', cursor: 'pointer' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Lock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span>Key lockers are available on-site upon request at reception desk. Select <strong>Weekly</strong> or <strong>Monthly</strong> package to reserve a personal key locker.</span>
                  </div>
                )}
              </div>

              {/* Desk Selector */}
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  3. Select Available Desk Station
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: '0.85rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {seats.map((seat) => {
                    const isSelected = selectedSeatObj && selectedSeatObj.id === seat.id;
                    const isAvailable = seat.status === 'AVAILABLE';

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => isAvailable && setSelectedSeatId(seat.id)}
                        disabled={!isAvailable}
                        style={{
                          padding: '0.85rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected
                            ? '2px solid var(--accent)'
                            : isAvailable
                            ? '1px solid var(--border-accent)'
                            : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected
                            ? 'var(--accent)'
                            : isAvailable
                            ? 'var(--bg-surface)'
                            : 'var(--bg-main)',
                          color: isSelected ? 'var(--primary)' : isAvailable ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          opacity: isAvailable ? 1 : 0.4
                        }}
                      >
                        {seat.seatNumber}
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', marginTop: '0.2rem', fontWeight: 400 }}>
                          {seat.status}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Banner */}
              {selectedSeatObj && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  backgroundColor: 'var(--accent-light)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '2rem',
                  border: '1px solid var(--border-accent)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-hover)', fontWeight: 600 }}>Selected Configuration</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      Desk {selectedSeatObj.seatNumber} • {selectedSeatObj.zone} ({selectedPassType})
                    </div>
                    {/* Price hidden per owner's request — data retained */}
                    <div style={{ display: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Base: NPR {calculateBasePrice()} {getLockerFee() > 0 ? `+ Locker Facility: NPR ${getLockerFee()}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {/* Price hidden per owner's request — data retained */}
                    <div style={{ display: 'none', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-headline)' }}>
                      NPR {calculateTotal()}
                    </div>
                    {includeLocker && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-hover)', fontWeight: 700 }}>
                        🔒 Locker Included
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
                  Next: Contact Info <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info & Arrival Time */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="card" style={{ padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>Scholar Details & Arrival Time</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Enter your contact information and expected arrival time for your check-in ticket.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem 0.85rem 2.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      placeholder="aarav.sharma@example.com"
                      value={formData.userEmail}
                      onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem 0.85rem 2.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                    Phone Number (Nepal) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      required
                      placeholder="+977 9841234567"
                      value={formData.userPhone}
                      onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem 0.85rem 2.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                      Reservation Date *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="date"
                        required
                        min={todayLocalDate}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem 0.85rem 2.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Arrival Time Selector (15-min intervals or custom type) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem' }}>
                        Expected Arrival Time *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomTime(!isCustomTime)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--accent-hover)',
                          fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline'
                        }}
                      >
                        {isCustomTime ? 'Select from list' : 'Type custom time'}
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <Clock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      {isCustomTime ? (
                        <input
                          type="text"
                          required
                          placeholder="e.g. 06:45 AM or 02:30 PM"
                          value={customArrivalTime}
                          onChange={(e) => setCustomArrivalTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        />
                      ) : (
                        <select
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          {availableTimeSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot} {slot === '05:00 AM' || slot === '06:00 AM' ? '(Opening)' : slot === '10:00 PM' ? '(Closing)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {startDate === todayLocalDate ? (
                        <span>Showing real-time slots available from <strong>{availableTimeSlots[0]}</strong> onward today.</span>
                      ) : (
                        <span>Operating hours: 05:00 AM – 10:00 PM (15 min increments)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Review & Confirm <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Review & Request */}
          {step === 3 && (
            <div className="card" style={{ padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>Review & Send Request</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Review your details and submit a reservation request. Our team will confirm your desk within a few hours.
              </p>

              <div style={{
                backgroundColor: 'var(--bg-main)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Desk Station</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Desk {selectedSeatObj?.seatNumber} ({selectedSeatObj?.zone})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Access Duration</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{selectedPassType} Pass</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Key Locker Facility</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: includeLocker ? 'var(--accent-hover)' : 'var(--text-main)' }}>
                      {includeLocker ? '🔒 Key Locker Included' : 'Not Selected'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Arrival</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ⏰ {finalArrivalTime}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scholar Name</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formData.userName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Email</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formData.userEmail}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formData.userPhone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start Date</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{startDate}</div>
                  </div>
                </div>

                {/* Total amount hidden per owner's request — data retained */}
                <div style={{
                  display: 'none',
                  borderTop: '1px dashed var(--border-accent)',
                  paddingTop: '1.25rem',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', display: 'block' }}>Total Amount Payable:</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Base NPR {calculateBasePrice()} {getLockerFee() > 0 ? `+ Locker NPR ${getLockerFee()}` : ''}
                    </span>
                  </div>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-headline)' }}>
                    NPR {calculateTotal()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <button onClick={() => setStep(2)} className="btn btn-outline" disabled={submitting}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ padding: '0.875rem 2.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting ? 'Submitting Request...' : <><Ticket size={18} /> Send Reservation Request</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Digital Confirmation Pass Ticket */}
          {step === 4 && confirmedBooking && (
            <div className="card" style={{ padding: '3rem 2.5rem', textAlign: 'center', border: '2px solid var(--accent)' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <Ticket size={36} />
              </div>

              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Request Submitted!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Your reservation request has been received. Our team will review it and
                <strong> confirm your desk assignment</strong> — typically within a few hours.
                Please visit our reception with your reference code on the reserved date.
              </p>
              <div style={{
                display: 'inline-block',
                padding: '0.4rem 1rem',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '1.75rem',
                border: '1px solid #FCD34D'
              }}>
                ⏳ PENDING ADMIN CONFIRMATION
              </div>

              {/* Digital Pass Ticket Box */}
              <div style={{
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                maxWidth: '500px',
                margin: '0 auto 2rem auto',
                boxShadow: 'var(--shadow-hover)',
                position: 'relative',
                textAlign: 'left'
              }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>The Quiet Desk</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.25rem' }}>Kathmandu Pass Voucher</div>
                  </div>
                  <span style={{
                    padding: '0.3rem 0.75rem',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>CONFIRMATION PENDING</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Reference Code</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-headline)' }}>
                      {confirmedBooking.bookingCode}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Desk Station</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Desk {confirmedBooking.seatNumber}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Scholar</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{confirmedBooking.userName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Pass Type</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{confirmedBooking.passType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Arrival Time</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)' }}>
                      ⏰ {confirmedBooking.arrivalTime || confirmedBooking.bookingTime || finalArrivalTime}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Key Locker Access</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: confirmedBooking.hasLocker ? 'var(--accent)' : 'rgba(255,255,255,0.8)' }}>
                      {confirmedBooking.hasLocker ? '🔒 Key Locker Included' : 'Not Included'}
                    </div>
                  </div>
                  {/* Total Amount hidden per owner's request — data retained */}
                  <div style={{ display: 'none' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Total Amount</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>NPR {confirmedBooking.totalAmount}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
                  Lazimpat, Kathmandu • Present this ticket reference at reception
                </div>
              </div>

              {/* 📸 Screenshot Instruction Note Banner (replacing non-working print button) */}
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '2px dashed #93C5FD',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                maxWidth: '500px',
                margin: '0 auto 2rem auto',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  backgroundColor: '#DBEAFE', color: '#1D4ED8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Camera size={22} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E40AF' }}>
                    📸 Please take a screenshot of this ticket!
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#3B82F6', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    Save this reference code on your phone to show at the reception desk upon check-in.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Link to="/" className="btn btn-primary" style={{ padding: '0.85rem 2.75rem', fontSize: '1rem' }}>
                  Return to Home
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
