import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { Modal } from '../../components/common/Modal';
import { CheckCircle2, Sparkles, UserCheck, Layers } from 'lucide-react';

const ZONE_META = {
  'Left Quiet Row (Zone A)':        { color: '#4A3C2B', light: '#F5EFE4', accent: '#C9A574', label: 'A', icon: '📚', rate: 500 },
  'Center Focus Row (Zone C)':      { color: '#5C3A1E', light: '#FBF0E6', accent: '#D4845A', label: 'C', icon: '🎯', rate: 600 },
  'Center T-Wing Section (Zone T)': { color: '#2D5A27', light: '#EBF5E9', accent: '#5BAD52', label: 'T', icon: '┴', rate: 550 },
  'South Baseline Row (Zone B)':    { color: '#1E3A8A', light: '#EFF6FF', accent: '#3B82F6', label: 'B', icon: '📖', rate: 450 },
  'Right Window Wall (Zone R)':     { color: '#1A5C73', light: '#E6F4F8', accent: '#4BA3C3', label: 'R', icon: '🪟', rate: 700 },
};

const STATUS_DOT = {
  AVAILABLE: { bg: '#22C55E', label: 'Available' },
  OCCUPIED:  { bg: '#EF4444', label: 'Occupied' },
  RESERVED:  { bg: '#F59E0B', label: 'Reserved' },
};

export const SeatMap = () => {
  const { seats, selectSeat, loading } = useBooking();
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [activeModalSeat, setActiveModalSeat] = useState(null);
  const navigate = useNavigate();

  const zones = ['ALL', ...Object.keys(ZONE_META)];

  const filteredSeats = selectedZone === 'ALL' ? seats : seats.filter(s => s.zone === selectedZone);

  const availableCount = seats.filter(s => s.status === 'AVAILABLE').length;
  const occupiedCount  = seats.filter(s => s.status === 'OCCUPIED').length;
  const reservedCount  = seats.filter(s => s.status === 'RESERVED').length;
  const total = seats.length || 1;

  const handleSeatClick = (seat) => { if (seat.status === 'AVAILABLE') setActiveModalSeat(seat); };
  const handleConfirmSeatSelection = () => {
    if (activeModalSeat) {
      selectSeat(activeModalSeat);
      setActiveModalSeat(null);
      navigate(`/book?seat=${activeModalSeat.id}`);
    }
  };

  // Natural sort helper (e.g., A1, A2 ... A10, A11)
  const naturalSort = (a, b) => {
    return (a.seatNumber || '').localeCompare(b.seatNumber || '', undefined, { numeric: true, sensitivity: 'base' });
  };

  // Group filtered seats by zone and sort naturally
  const grouped = filteredSeats.reduce((acc, seat) => {
    const zoneName = seat.zone || 'Other Study Area';
    if (!acc[zoneName]) acc[zoneName] = [];
    acc[zoneName].push(seat);
    return acc;
  }, {});

  Object.keys(grouped).forEach(zoneKey => {
    grouped[zoneKey].sort(naturalSort);
  });

  return (
    <section id="seats" className="section">
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.35); }
          70% { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .desk-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          cursor: pointer;
          outline: none;
          border: none;
        }
        .desk-btn:hover { transform: translateY(-3px) scale(1.04); }
        .desk-btn:disabled { cursor: not-allowed; }
        .desk-btn.available { animation: pulse-ring 2.2s infinite; }
        .zone-pill {
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .zone-pill:hover { transform: translateY(-1px); }
        .stat-card { transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
      `}</style>

      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 2.5rem auto' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-hover)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={13} /> Live Firestore Sync
          </div>
          <h2 style={{ marginBottom: '0.75rem' }}>Interactive Floor Map</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time desk availability — click any green desk to begin your reservation.
          </p>
        </div>

        {/* Stat Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2.5rem', maxWidth: '560px', margin: '0 auto 2.5rem auto' }}>
          {[
            { label: 'Available', count: availableCount, color: '#22C55E', pct: Math.round(availableCount/total*100) },
            { label: 'Occupied',  count: occupiedCount,  color: '#EF4444', pct: Math.round(occupiedCount/total*100) },
            { label: 'Reserved',  count: reservedCount,  color: '#F59E0B', pct: Math.round(reservedCount/total*100) },
          ].map(s => (
            <div key={s.label} className="stat-card card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-headline)', lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.25rem' }}>{s.label}</div>
              <div style={{ marginTop: '0.5rem', height: '3px', borderRadius: '2px', background: 'var(--bg-main)', overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: '2px', transition: 'width 0.8s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Zone Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {zones.map(zone => {
            const meta = ZONE_META[zone];
            const active = selectedZone === zone;
            return (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className="zone-pill"
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '100px',
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 500,
                  background: active ? (meta ? meta.color : 'var(--primary)') : 'var(--bg-surface)',
                  color: active ? '#FFF' : 'var(--text-secondary)',
                  boxShadow: active ? '0 3px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                  border: active ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                {meta ? `${meta.icon} ${zone}` : <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Layers size={13} /> All Zones</span>}
              </button>
            );
          })}
        </div>

        {/* Floor Map - Grouped by Zone */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading live availability from Firestore...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Object.entries(grouped).map(([zone, zoneSeats]) => {
              const meta = ZONE_META[zone] || { color: '#4A3C2B', light: '#F5EFE4', accent: '#C9A574', icon: '🏢', rate: 500 };
              const zoneAvail = zoneSeats.filter(s => s.status === 'AVAILABLE').length;
              return (
                <div key={zone} style={{ borderRadius: '20px', overflow: 'hidden', border: `1.5px solid ${meta.accent}22`, background: 'var(--bg-surface)' }}>
                  {/* Zone Header */}
                  <div style={{
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${meta.color}11 0%, ${meta.light} 100%)`,
                    borderBottom: `1px solid ${meta.accent}22`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{meta.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: meta.color, fontSize: '1rem' }}>{zone}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NPR {meta.rate}/day · {zoneSeats.length} desks</div>
                      </div>
                    </div>
                    <div style={{
                      padding: '0.3rem 0.85rem',
                      borderRadius: '100px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: zoneAvail > 0 ? '#DCFCE7' : '#FEE2E2',
                      color: zoneAvail > 0 ? '#166534' : '#991B1B'
                    }}>
                      {zoneAvail} open
                    </div>
                  </div>

                  {/* Desk Grid */}
                  <div style={{
                    padding: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {zoneSeats.map(seat => {
                      const isAvail = seat.status === 'AVAILABLE';
                      const isOcc   = seat.status === 'OCCUPIED';
                      const dot = STATUS_DOT[seat.status] || STATUS_DOT.OCCUPIED;
                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          disabled={!isAvail}
                          className={`desk-btn${isAvail ? ' available' : ''}`}
                          title={`Desk ${seat.seatNumber} · ${seat.status}`}
                          style={{
                            borderRadius: '14px',
                            padding: '0.85rem 0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            background: isAvail
                              ? '#FFFFFF'
                              : isOcc
                              ? `${meta.color}CC`
                              : `${meta.accent}22`,
                            border: isAvail
                              ? `2px solid ${meta.accent}`
                              : isOcc
                              ? `2px solid ${meta.color}`
                              : `1.5px dashed ${meta.accent}88`,
                            opacity: isOcc ? 0.75 : 1,
                          }}
                        >
                          <div style={{
                            width: '8px', height: '8px',
                            borderRadius: '50%',
                            background: dot.bg
                          }} />
                          <span style={{
                            fontFamily: 'var(--font-headline)',
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: isOcc ? '#FFFFFF' : meta.color,
                            lineHeight: 1
                          }}>
                            {seat.seatNumber}
                          </span>
                          <span style={{
                            fontSize: '0.6rem',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: isOcc ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
                          }}>
                            {isAvail ? 'Open' : isOcc ? 'Taken' : 'Hold'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_DOT).map(([status, { bg, label }]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: bg }} />
              {label}
            </div>
          ))}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>· Click a green desk to reserve</div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={!!activeModalSeat} onClose={() => setActiveModalSeat(null)} title={`Reserve Desk ${activeModalSeat?.seatNumber}`}>
        {activeModalSeat && (() => {
          const meta = ZONE_META[activeModalSeat.zone] || {};
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: meta.light || 'var(--bg-main)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: meta.color || 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 800 }}>
                  {activeModalSeat.seatNumber}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: meta.color || 'var(--primary)' }}>{activeModalSeat.zone}</h4>
                  {/* Price hidden per owner's request — data retained */}
                  <div style={{ display: 'none', fontSize: '0.875rem', color: 'var(--text-muted)' }}>NPR <strong>{activeModalSeat.pricePerDay}</strong> / day</div>
                </div>
              </div>

              <h5 style={{ marginBottom: '0.75rem', color: 'var(--primary)' }}>Included Amenities:</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(activeModalSeat.amenities || ['Ergonomic Mesh Chair', 'Dedicated Power Outlet', 'High-Speed Wi-Fi']).map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={16} color={meta.accent || 'var(--accent-hover)'} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <button onClick={() => setActiveModalSeat(null)} className="btn btn-outline">Cancel</button>
                <button onClick={handleConfirmSeatSelection} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={18} /> Continue to Booking
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </section>
  );
};
