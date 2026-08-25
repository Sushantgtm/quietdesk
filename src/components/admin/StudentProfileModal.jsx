import React, { useState, useMemo } from 'react';
import {
  X, User, Phone, Mail, MapPin, Shield, Clock, Bookmark,
  Lock, CreditCard, CheckCircle2, AlertCircle, Edit3,
  Calendar, DollarSign, ChevronRight, Repeat, FileText,
  ArrowDownCircle, Banknote, TrendingUp, Package, Key
} from 'lucide-react';

const TABS = ['profile', 'status', 'financials', 'history'];
const TAB_LABELS = { profile: '👤 Profile', status: '📍 Current Status', financials: '💰 Financials', history: '📋 History' };

const badge = (label, bg, color) => (
  <span style={{ padding: '0.15rem 0.55rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: bg, color }}>{label}</span>
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
}) => {
  const [activeTab, setActiveTab] = useState('profile');

  const userBookings = useMemo(() => {
    if (!user) return [];
    return bookings
      .filter(b => b.userId === user.id || b.userEmail === user.email || b.userPhone === user.phone)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [user, bookings]);

  const activeBooking = useMemo(() =>
    userBookings.find(b => ['CONFIRMED', 'CHECKED_IN', 'RESERVED'].includes(b.status)),
    [userBookings]
  );

  const assignedLocker = useMemo(() =>
    lockers.find(l => l.assignedToUserId === user?.id || l.assignedToUserPhone === user?.phone),
    [lockers, user]
  );

  const activeSeat = useMemo(() =>
    activeBooking ? seats.find(s => s.id === activeBooking.seatId || s.seatNumber === activeBooking.seatNumber) : null,
    [activeBooking, seats]
  );

  const totalPaid = useMemo(() => userBookings.reduce((s, b) => s + (Number(b.amountPaid) || (b.paymentStatus === 'PAID' ? Number(b.totalAmount) || 0 : 0)), 0), [userBookings]);
  const totalDue = useMemo(() => userBookings.reduce((s, b) => s + Math.max(0, Number(b.pendingAmount) || 0), 0), [userBookings]);
  const totalRevenue = useMemo(() => userBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0), [userBookings]);

  if (!user) return null;

  const displayName = user.fullName || user.name || '—';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const userStatus = user.status || user.membershipStatus || 'ACTIVE';

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '760px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* ── Header ── */}
        <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{displayName}</div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                <span>{user.userCode || user.id}</span>
                {badge(user.passType || 'DAILY', '#1E3A8A', '#BFDBFE')}
                {badge(userStatus, userStatus === 'ACTIVE' ? '#064E3B' : '#7F1D1D', userStatus === 'ACTIVE' ? '#6EE7B7' : '#FCA5A5')}
                {totalDue > 0 && badge(`⚠ NPR ${totalDue.toLocaleString()} DUE`, '#92400E', '#FDE68A')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {onEditUser && (
              <button onClick={() => onEditUser(user)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#FFF', padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Edit3 size={13} /> Edit
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.35rem 1rem', gap: '0.25rem' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '0.45rem 1rem', borderRadius: '8px', border: 'none', fontWeight: activeTab === t ? 800 : 600,
              fontSize: '0.8rem', cursor: 'pointer',
              backgroundColor: activeTab === t ? '#0F172A' : 'transparent',
              color: activeTab === t ? '#F59E0B' : '#475569',
              transition: 'all 0.15s ease'
            }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ============ TAB: PROFILE ============ */}
          {activeTab === 'profile' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { icon: <Phone size={14} />, label: 'Phone', value: user.phone || '—' },
                  { icon: <Mail size={14} />, label: 'Email', value: user.email || '—' },
                  { icon: <MapPin size={14} />, label: 'Address', value: user.address || '—' },
                  { icon: <Shield size={14} />, label: 'Emergency Contact', value: user.emergencyContact || '—' },
                  { icon: <FileText size={14} />, label: 'ID Proof', value: user.idProof || '—' },
                  { icon: <Calendar size={14} />, label: 'Joined Date', value: user.joinedDate || user.createdAt ? new Date(user.joinedDate || user.createdAt).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                  { icon: <Package size={14} />, label: 'Current Pass Type', value: user.passType || '—' },
                  { icon: <User size={14} />, label: 'Registration Type', value: user.registrationType || 'PHYSICAL_WALKIN' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', wordBreak: 'break-word' }}>{value}</div>
                  </div>
                ))}
              </div>
              {user.notes && (
                <div style={{ backgroundColor: '#FFFBEB', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.3rem' }}>📝 Notes</div>
                  <div style={{ fontSize: '0.85rem', color: '#78350F' }}>{user.notes}</div>
                </div>
              )}
            </>
          )}

          {/* ============ TAB: CURRENT STATUS ============ */}
          {activeTab === 'status' && (
            <>
              {/* Active Desk */}
              <div style={{ backgroundColor: activeBooking ? '#EFF6FF' : '#F8FAFC', borderRadius: '12px', padding: '1.25rem', border: `1px solid ${activeBooking ? '#BFDBFE' : '#E2E8F0'}` }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: activeBooking ? '#1D4ED8' : '#94A3B8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={13} /> Current Assigned Desk
                </div>
                {activeBooking ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748B' }}>Desk #:</span> <strong style={{ color: '#1D4ED8', fontSize: '1.1rem' }}>{activeBooking.seatNumber}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Zone:</span> <strong>{activeSeat?.zone || '—'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Booking Code:</span> <strong>{activeBooking.bookingCode}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Pass Type:</span> <strong>{activeBooking.passType}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Check-in:</span> <strong>{activeBooking.startDate}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Check-out:</span> <strong>{activeBooking.endDate}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Shift/Time:</span> <strong>{activeBooking.shift || activeBooking.bookingTime || 'Full Day'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Booking Status:</span> {badge(activeBooking.status, '#ECFDF5', '#047857')}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>No active desk booking found.</div>
                )}
              </div>

              {/* Locker */}
              <div style={{ backgroundColor: assignedLocker ? '#F5F3FF' : '#F8FAFC', borderRadius: '12px', padding: '1.25rem', border: `1px solid ${assignedLocker ? '#DDD6FE' : '#E2E8F0'}` }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: assignedLocker ? '#6D28D9' : '#94A3B8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={13} /> Storage Locker
                </div>
                {assignedLocker ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748B' }}>Locker #:</span> <strong style={{ color: '#6D28D9', fontSize: '1.1rem' }}>{assignedLocker.lockerNumber}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Location:</span> <strong>{assignedLocker.location || 'South Storage Bank'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Key size={13} style={{ color: '#6D28D9' }} /><span style={{ color: '#64748B' }}>PIN Code:</span> <strong style={{ letterSpacing: '0.2em', fontFamily: 'monospace', fontSize: '1rem' }}>{assignedLocker.pinCode || '—'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Status:</span> {badge(assignedLocker.status, '#F5F3FF', '#6D28D9')}</div>
                    {assignedLocker.startDate && <div><span style={{ color: '#64748B' }}>From:</span> <strong>{assignedLocker.startDate}</strong></div>}
                    {assignedLocker.endDate && <div><span style={{ color: '#64748B' }}>Until:</span> <strong>{assignedLocker.endDate}</strong></div>}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>No locker assigned to this student.</div>
                )}
              </div>
            </>
          )}

          {/* ============ TAB: FINANCIALS ============ */}
          {activeTab === 'financials' && (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Total Revenue', value: `NPR ${totalRevenue.toLocaleString()}`, bg: '#EFF6FF', color: '#1D4ED8', icon: <TrendingUp size={16} /> },
                  { label: 'Amount Collected', value: `NPR ${totalPaid.toLocaleString()}`, bg: '#ECFDF5', color: '#047857', icon: <CheckCircle2 size={16} /> },
                  { label: 'Outstanding Dues', value: `NPR ${totalDue.toLocaleString()}`, bg: totalDue > 0 ? '#FFF7ED' : '#ECFDF5', color: totalDue > 0 ? '#C2410C' : '#047857', icon: <AlertCircle size={16} /> },
                ].map(({ label, value, bg, color, icon }) => (
                  <div key={label} style={{ backgroundColor: bg, borderRadius: '10px', padding: '1rem', textAlign: 'center', border: `1px solid ${bg}` }}>
                    <div style={{ color, marginBottom: '0.3rem' }}>{icon}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Per-booking due breakdown */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>Booking-wise Financial Ledger</div>
                {userBookings.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', padding: '1rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>No bookings found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {userBookings.map(b => {
                      const total = Number(b.totalAmount) || 0;
                      const paid = Number(b.amountPaid) || (b.paymentStatus === 'PAID' ? total : 0);
                      const due = Math.max(0, Number(b.pendingAmount) || (total - paid));
                      const isPendingPayment = due > 0;
                      return (
                        <div key={b.id} style={{
                          backgroundColor: isPendingPayment ? '#FFFBEB' : '#FFFFFF', borderRadius: '10px', border: `1.5px solid ${isPendingPayment ? '#FED7AA' : '#E2E8F0'}`,
                          padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span>{b.bookingCode}</span>
                              {badge(b.passType, '#F1F5F9', '#475569')}
                              {isPendingPayment && badge('DUE', '#FEF3C7', '#92400E')}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                              Desk {b.seatNumber} · {b.startDate}{b.endDate && b.endDate !== b.startDate ? ` → ${b.endDate}` : ''}
                              {b.hasLocker && ` · Locker ${b.lockerNumber}`}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Total: <strong>NPR {total.toLocaleString()}</strong></div>
                            <div style={{ fontSize: '0.78rem', color: '#047857' }}>Paid: <strong>NPR {paid.toLocaleString()}</strong></div>
                            {isPendingPayment && (
                              <div style={{ fontSize: '0.82rem', color: '#C2410C', fontWeight: 800 }}>Due: NPR {due.toLocaleString()}</div>
                            )}
                          </div>
                          {isPendingPayment && onCollectDue && (
                            <button onClick={() => onCollectDue(b)} style={{
                              backgroundColor: '#D97706', color: '#FFF', border: 'none', borderRadius: '8px',
                              padding: '0.45rem 0.85rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0
                            }}>
                              <Banknote size={13} /> Collect
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                {onNewReservation && (
                  <button onClick={() => { onClose(); onNewReservation(user); }} style={{ backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} /> + New Reservation
                  </button>
                )}
              </div>
            </>
          )}

          {/* ============ TAB: HISTORY ============ */}
          {activeTab === 'history' && (
            <>
              {userBookings.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  No booking history found for this student.
                </div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                        <th style={{ padding: '0.65rem 0.9rem', textAlign: 'left' }}>Code</th>
                        <th style={{ padding: '0.65rem 0.9rem', textAlign: 'left' }}>Desk</th>
                        <th style={{ padding: '0.65rem 0.9rem', textAlign: 'left' }}>Pass / Period</th>
                        <th style={{ padding: '0.65rem 0.9rem', textAlign: 'left' }}>Amount</th>
                        <th style={{ padding: '0.65rem 0.9rem', textAlign: 'left' }}>Payment</th>
                        <th style={{ padding: '0.65rem 0.9rem', textAlign: 'left' }}>Booking Status</th>
                        <th style={{ padding: '0.65rem 0.9rem', textAlign: 'left' }}>Locker</th>
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
                            <td style={{ padding: '0.65rem 0.9rem', fontWeight: 800 }}>{b.bookingCode}</td>
                            <td style={{ padding: '0.65rem 0.9rem', fontWeight: 800, color: '#2563EB' }}>{b.seatNumber || '—'}</td>
                            <td style={{ padding: '0.65rem 0.9rem', color: '#475569' }}>
                              <div>{b.passType}</div>
                              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{b.startDate}{b.endDate && b.endDate !== b.startDate ? ` – ${b.endDate}` : ''}</div>
                            </td>
                            <td style={{ padding: '0.65rem 0.9rem' }}>
                              <div style={{ fontWeight: 700 }}>NPR {total.toLocaleString()}</div>
                              {due > 0 && <div style={{ fontSize: '0.72rem', color: '#C2410C', fontWeight: 700 }}>Due: {due.toLocaleString()}</div>}
                            </td>
                            <td style={{ padding: '0.65rem 0.9rem' }}>
                              {badge(
                                payStatus,
                                payStatus === 'PAID' ? '#ECFDF5' : payStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                                payStatus === 'PAID' ? '#047857' : payStatus === 'PARTIAL' ? '#92400E' : '#991B1B'
                              )}
                            </td>
                            <td style={{ padding: '0.65rem 0.9rem' }}>
                              {badge(
                                b.status,
                                ['CONFIRMED', 'CHECKED_IN'].includes(b.status) ? '#ECFDF5' : b.status === 'PENDING_CONFIRMATION' ? '#FEF3C7' : '#F1F5F9',
                                ['CONFIRMED', 'CHECKED_IN'].includes(b.status) ? '#047857' : b.status === 'PENDING_CONFIRMATION' ? '#B45309' : '#475569'
                              )}
                            </td>
                            <td style={{ padding: '0.65rem 0.9rem', color: '#6D28D9', fontWeight: 700, fontSize: '0.78rem' }}>
                              {b.hasLocker ? b.lockerNumber || 'Yes' : '—'}
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
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
            {userBookings.length} booking(s) · Member since {user.joinedDate || user.createdAt ? new Date(user.joinedDate || user.createdAt).toLocaleDateString('en-NP', { month: 'short', year: 'numeric' }) : 'N/A'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {totalDue > 0 && onCollectDue && (
              <button
                onClick={() => {
                  const firstDueBooking = userBookings.find(b => (Number(b.pendingAmount) || 0) > 0);
                  if (firstDueBooking) onCollectDue(firstDueBooking);
                }}
                style={{ backgroundColor: '#D97706', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0.55rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Banknote size={14} /> Collect Due · NPR {totalDue.toLocaleString()}
              </button>
            )}
            {onNewReservation && (
              <button
                onClick={() => { onClose(); onNewReservation(user); }}
                style={{ backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0.55rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Calendar size={14} /> + Reserve Desk
              </button>
            )}
            <button onClick={onClose} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '0.55rem 1rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
