import React, { useState } from 'react';
import { DoorOpen, Lock, Key, User, CheckCircle2, AlertCircle, Clock, Sparkles, MapPin, Compass, Phone, ShieldCheck } from 'lucide-react';
import { SEAT_LAYOUT, SEAT_NUMBER_BY_PHYSICAL_ID } from '../../services/mock/seatLayout';

export const StudyRoomFloorPlan = ({
  seats = [],
  bookings = [],
  lockers = [],
  onSelectCabin,
  onOpenWalkinForSeat,
  onSelectLocker
}) => {
  const [hoveredItem, setHoveredItem] = useState(null); // { type: 'CABIN' | 'LOCKER', data: ... }

  // Map Firestore / context seats by seatNumber for O(1) lookup
  const seatMap = {};
  seats.forEach(s => {
    if (s) {
      seatMap[s.id] = s;
      seatMap[s.seatNumber] = s;
    }
  });

  // Map Firestore / context lockers by lockerNumber and ID
  const lockerMap = {};
  lockers.forEach(l => {
    if (l) {
      if (l.lockerNumber) lockerMap[l.lockerNumber] = l;
      if (l.id) lockerMap[l.id] = l;
    }
  });

  // Active occupants lookup by seatNumber or seatId
  const occupantMap = {};
  bookings.forEach(b => {
    if (b && (b.status === 'OCCUPIED' || b.status === 'CHECKED_IN' || b.status === 'RESERVED' || b.status === 'CONFIRMED')) {
      if (b.seatNumber) occupantMap[b.seatNumber] = b;
      if (b.seatId) occupantMap[b.seatId] = b;
    }
  });

  // Cabin statistics
  const totalCabins = 62;
  const occupiedCabins = seats.filter(s => s.status === 'OCCUPIED').length;
  const reservedCabins = seats.filter(s => s.status === 'RESERVED').length;
  const availableCabins = Math.max(0, totalCabins - occupiedCabins - reservedCabins);

  // Locker statistics
  const totalLockers = lockers.length > 0 ? lockers.length : 20;
  const assignedLockers = lockers.filter(l => l.status === 'ASSIGNED').length;
  const maintLockers = lockers.filter(l => l.status === 'MAINTENANCE').length;
  const availableLockers = Math.max(0, totalLockers - assignedLockers - maintLockers);

  // Render an individual Cabin Box
  const renderCabin = (physicalSeatId, defaultZone = 'Left Quiet Row (Zone A)', defaultRate = 500) => {
    const seatNumber = SEAT_NUMBER_BY_PHYSICAL_ID[physicalSeatId];
    const seat = seatMap[`seat_${physicalSeatId}`] || {
      id: `seat_${physicalSeatId}`,
      seatNumber,
      zone: defaultZone,
      pricePerDay: defaultRate,
      status: 'AVAILABLE'
    };

    const occupant = occupantMap[seatNumber] || occupantMap[physicalSeatId] || occupantMap[seat.id];
    const status = seat.status || (occupant ? occupant.status : 'AVAILABLE');

    let bg = '#FFFFFF';
    let border = '#CBD5E1';
    let text = '#0F172A';
    let badgeBg = '#E2E8F0';
    let badgeText = '#475569';

    if (status === 'OCCUPIED') {
      bg = '#FEF2F2';
      border = '#F87171';
      text = '#991B1B';
      badgeBg = '#FEE2E2';
      badgeText = '#DC2626';
    } else if (status === 'RESERVED') {
      bg = '#FFFBEB';
      border = '#FCD34D';
      text = '#92400E';
      badgeBg = '#FEF3C7';
      badgeText = '#D97706';
    } else if (status === 'AVAILABLE') {
      bg = '#F0FDF4';
      border = '#86EFAC';
      text = '#166534';
      badgeBg = '#DCFCE7';
      badgeText = '#15803D';
    }

    return (
      <div
        key={physicalSeatId}
        onClick={() => onSelectCabin && onSelectCabin(seat)}
        onMouseEnter={() => setHoveredItem({ type: 'CABIN', data: { ...seat, seatNumber, occupant } })}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          backgroundColor: bg,
          border: `2px solid ${border}`,
          borderRadius: '8px',
          padding: '0.45rem 0.5rem',
          minWidth: '58px',
          minHeight: '52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: text, fontFamily: 'Inter, sans-serif' }}>
          {seatNumber}
        </span>
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: '4px',
          backgroundColor: badgeBg,
          color: badgeText,
          marginTop: '0.15rem',
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          {status === 'OCCUPIED' ? 'BUSY' : status === 'RESERVED' ? 'RSVD' : 'FREE'}
        </span>
      </div>
    );
  };

  // Render a Wall Locker Box (mapped to real DB lockers)
  const renderWallLocker = (targetLockerNum, label) => {
    const lockerData = lockerMap[targetLockerNum] || {
      id: `locker_${targetLockerNum.replace(/\D/g, '')}`,
      lockerNumber: targetLockerNum,
      label: label || targetLockerNum,
      status: 'AVAILABLE'
    };

    const isAssigned = lockerData.status === 'ASSIGNED';
    const isMaint = lockerData.status === 'MAINTENANCE';

    return (
      <div
        key={targetLockerNum}
        onClick={() => onSelectLocker && onSelectLocker(lockerData)}
        onMouseEnter={() => setHoveredItem({ type: 'LOCKER', data: lockerData })}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          backgroundColor: isAssigned ? '#1E3A8A' : isMaint ? '#7F1D1D' : '#1E293B',
          border: `2px solid ${isAssigned ? '#60A5FA' : isMaint ? '#F87171' : '#0F172A'}`,
          borderRadius: '8px',
          padding: '0.4rem',
          minWidth: '58px',
          minHeight: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F8FAFC',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', fontWeight: 900, color: isAssigned ? '#93C5FD' : '#C9A574' }}>
          <Lock size={12} />
          <span>{targetLockerNum}</span>
        </div>
        <span style={{
          fontSize: '0.58rem',
          fontWeight: 700,
          color: isAssigned ? '#DBEAFE' : isMaint ? '#FECACA' : '#94A3B8',
          marginTop: '1px',
          textTransform: 'uppercase'
        }}>
          {isAssigned ? (lockerData.assignedToUserName ? lockerData.assignedToUserName.split(' ')[0] : 'BUSY') : isMaint ? 'MAINT' : 'FREE'}
        </span>
      </div>
    );
  };

  // Render a Locker Tile in the 20-Locker Bank Grid (Alphabetical A-T)
  const renderLockerBankItem = (letter) => {
    const targetLockerNum = `Locker ${letter}`;
    const lockerData = lockerMap[targetLockerNum] || lockerMap[`L-${letter}`] || lockerMap[`locker_${letter.toLowerCase()}`] || {
      id: `locker_${letter.toLowerCase()}`,
      lockerNumber: targetLockerNum,
      label: `Locker ${letter}`,
      status: 'AVAILABLE'
    };

    const isAssigned = lockerData.status === 'ASSIGNED';
    const isMaint = lockerData.status === 'MAINTENANCE';

    let bg = '#F8FAFC';
    let border = '#CBD5E1';
    let lockColor = '#10B981'; // Green
    let statusText = 'AVAILABLE';
    let statusBg = '#DCFCE7';
    let statusColor = '#15803D';

    if (isAssigned) {
      bg = '#EFF6FF';
      border = '#93C5FD';
      lockColor = '#2563EB'; // Blue
      statusText = 'ASSIGNED';
      statusBg = '#DBEAFE';
      statusColor = '#1E40AF';
    } else if (isMaint) {
      bg = '#FEF2F2';
      border = '#FCA5A5';
      lockColor = '#DC2626'; // Red
      statusText = 'MAINT';
      statusBg = '#FEE2E2';
      statusColor = '#991B1B';
    }

    return (
      <div
        key={targetLockerNum}
        onClick={() => onSelectLocker && onSelectLocker(lockerData)}
        onMouseEnter={() => setHoveredItem({ type: 'LOCKER', data: lockerData })}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          backgroundColor: bg,
          border: `2px solid ${border}`,
          borderRadius: '10px',
          padding: '0.65rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.3rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          userSelect: 'none',
          position: 'relative'
        }}
      >
        {/* Top: Icon + Number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Lock size={14} style={{ color: lockColor }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
            {lockerData.label || targetLockerNum}
          </span>
        </div>

        {/* Status Badge */}
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 800,
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: statusBg,
          color: statusColor,
          letterSpacing: '0.02em',
          textTransform: 'uppercase'
        }}>
          {statusText}
        </span>

        {/* Occupant Preview or Desk tag */}
        {isAssigned && lockerData.assignedToUserName && (
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#1E40AF',
            textAlign: 'center',
            maxWidth: '75px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {lockerData.assignedToUserName}
          </div>
        )}

        {isAssigned && lockerData.assignedSeatNumber && (
          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748B' }}>
            Desk #{lockerData.assignedSeatNumber}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* ── Top Legend & Occupancy Summary ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '1.1rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Summary Numbers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={20} style={{ color: '#C9A574' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                Study Room Floor Plan
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                62 Study Cabins • 20 Key Lockers
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 700, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🟢 {availableCabins} Cabins Free
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔴 {occupiedCabins} Occupied
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🟡 {reservedCabins} Reserved
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#EFF6FF', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #BFDBFE' }}>
              🔒 {availableLockers} / {totalLockers} Lockers Free
            </span>
          </div>
        </div>

        {/* Right: Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#86EFAC', border: '1px solid #16A34A', display: 'inline-block' }} /> Available
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#F87171', border: '1px solid #DC2626', display: 'inline-block' }} /> Occupied
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#FCD34D', border: '1px solid #D97706', display: 'inline-block' }} /> Reserved
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#1E293B', display: 'inline-block' }} /> 🔒 Locker
          </span>
        </div>
      </div>

      {/* ── Main Architectural Floor Map Canvas ── */}
      <div style={{
        backgroundColor: '#F8FAFC',
        border: '3px solid #0F172A',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        minWidth: '880px',
        overflowX: 'auto'
      }}>
        {/* 🚪 Top Entrance Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '0.55rem 2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <DoorOpen size={18} style={{ color: '#C9A574' }} />
            <span>🚪 MAIN ENTRANCE & RECEPTION CHECK-IN</span>
          </div>
        </div>

        {/* ── 3-Column Architectural Study Room Layout (62 Cabins) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 44px minmax(360px, 1fr) 44px 110px',
          gap: '1.25rem',
          alignItems: 'start'
        }}>
          
          {/* ══════════════════════════════════════════════════════════════
              1. LEFT WALL ROW (13 Seats + Locker L-01)
              Sequence: 13 numbered seats (28–40)
             ══════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            backgroundColor: '#FFFFFF',
            padding: '0.75rem 0.5rem',
            borderRadius: '10px',
            border: '2px solid #CBD5E1',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.2rem', textAlign: 'center' }}>
              Left Wall (Stations 28–40)
            </div>

            {/* All 13 Left Wall Cabins Contiguous */}
            {SEAT_LAYOUT.leftWall.map(physicalSeatId =>
              renderCabin(physicalSeatId, 'Left Quiet Row (Zone A)', 500)
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              🚶 LEFT WALKING AISLE
             ══════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#CBD5E1',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.15em',
            writingMode: 'vertical-rl',
            borderLeft: '1px dashed #E2E8F0',
            borderRight: '1px dashed #E2E8F0',
            padding: '1rem 0',
            minHeight: '640px'
          }}>
            WALKING AISLE • QUIET ZONE
          </div>

          {/* ══════════════════════════════════════════════════════════════
              2. CENTER SECTION (34 Seats Total)
              - Double Column (24 Seats: 12 Left C1-C12, 12 Right C13-C24)
              - Reverse-T Wing Base (3 Seats: T2-T4)
              - Below Reverse-T Row (6 Seats: B1-B6)
             ══════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            
            {/* Center Double Vertical Column (24 Seats) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #CBD5E1',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '0.4rem'
              }}>
                Center Focus Row (24 Cabins)
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem' }}>
                {/* Left Side: stations 16 to 27 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {SEAT_LAYOUT.centerLeft.map(physicalSeatId =>
                    renderCabin(physicalSeatId, 'Center Focus Row (Zone C)', 600)
                  )}
                </div>

                {/* Central Divider Soundproof Spine */}
                <div style={{
                  width: '6px',
                  backgroundColor: '#1E293B',
                  borderRadius: '3px',
                  margin: '0 0.25rem'
                }} />

                {/* Right Side: stations 1 to 12 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {SEAT_LAYOUT.centerRight.map(physicalSeatId =>
                    renderCabin(physicalSeatId, 'Center Focus Row (Zone C)', 600)
                  )}
                </div>
              </div>
            </div>

            {/* Reverse-T Shape Wing (3 Cabins: T2 to T4) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #CBD5E1',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ┴ Reverse-T Wing (3 Cabins) ┴
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {SEAT_LAYOUT.tWing.map(physicalSeatId =>
                  renderCabin(physicalSeatId, 'Center T-Wing Section (Zone T)', 550)
                )}
              </div>
            </div>

            {/* Below Reverse-T Row (6 Cabins: B1 to B6) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #CBD5E1',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                South Baseline (6 Cabins)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem' }}>
                {SEAT_LAYOUT.baseline.map(physicalSeatId =>
                  renderCabin(physicalSeatId, 'South Baseline Row (Zone B)', 450)
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              🚶 RIGHT WALKING AISLE
             ══════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#CBD5E1',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.15em',
            writingMode: 'vertical-rl',
            borderLeft: '1px dashed #E2E8F0',
            borderRight: '1px dashed #E2E8F0',
            padding: '1rem 0',
            minHeight: '640px'
          }}>
            WALKING AISLE • QUIET ZONE
          </div>

          {/* ══════════════════════════════════════════════════════════════
              3. RIGHT WALL ROW (16 Seats + 4 Lockers L-02 to L-05)
              Sequence: 3 Seats -> Locker -> 3 Seats -> Locker -> 3 Seats -> Locker -> 3 Seats -> Locker -> 3 Seats
             ══════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            backgroundColor: '#FFFFFF',
            padding: '0.75rem 0.5rem',
            borderRadius: '10px',
            border: '2px solid #CBD5E1',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.2rem', textAlign: 'center' }}>
              Right Wall (Stations 47–62)
            </div>

            {/* All 16 Right Window Wall Cabins Contiguous */}
            {SEAT_LAYOUT.rightWall.map(physicalSeatId =>
              renderCabin(physicalSeatId, 'Right Window Wall (Zone R)', 700)
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            4. DEDICATED DIGITAL STORAGE LOCKER BANK (20 UNITS: L-01 to L-20)
            Displayed prominently at the bottom/end of the architectural floor plan
           ══════════════════════════════════════════════════════════════ */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.75rem',
          borderTop: '2px dashed #CBD5E1'
        }}>
          {/* Locker Bank Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Lock size={18} style={{ color: '#C9A574' }} />
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  Key Storage Locker Bank (20 Units: L-01 to L-20)
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: '0.75rem' }}>
                  Physical Key Security • South Facility Zone
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534' }}>
                🟢 {availableLockers} Free
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                🔵 {assignedLockers} Assigned
              </span>
              {maintLockers > 0 && (
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  🔴 {maintLockers} Maint
                </span>
              )}
            </div>
          </div>

          {/* 20 Locker Grid (2 rows of 10 lockers, Alphabetical A-T) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '0.65rem'
          }}>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'].map(letter =>
              renderLockerBankItem(letter)
            )}
          </div>

          <div style={{ marginTop: '0.6rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
            💡 Click any locker unit above to assign a scholar, inspect PIN, or release storage space.
          </div>
        </div>

        {/* ── Hover Tooltip Drawer at Bottom ── */}
        {hoveredItem && (
          <div style={{
            marginTop: '1.5rem',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.15s ease'
          }}>
            {hoveredItem.type === 'CABIN' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#C9A574', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                    {hoveredItem.data.seatNumber}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      Desk #{hoveredItem.data.seatNumber} • {hoveredItem.data.zone || 'Quiet Zone'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.1rem' }}>
                      Rate: NPR {hoveredItem.data.pricePerDay || 500}/day • Status: <strong style={{ color: hoveredItem.data.status === 'OCCUPIED' ? '#F87171' : hoveredItem.data.status === 'RESERVED' ? '#FCD34D' : '#86EFAC' }}>{hoveredItem.data.status}</strong>
                    </div>
                  </div>
                </div>

                {hoveredItem.data.occupant ? (
                  <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div><strong>Scholar:</strong> {hoveredItem.data.occupant.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{hoveredItem.data.occupant.passType || 'Monthly'} • {hoveredItem.data.occupant.shift || hoveredItem.data.occupant.bookingTime || 'Full Day'}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#86EFAC', fontWeight: 700 }}>
                    Click desk to assign registered student or reserve →
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {hoveredItem.data.label || hoveredItem.data.lockerNumber} • Storage Locker
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.1rem' }}>
                      Status: <strong style={{ color: hoveredItem.data.status === 'ASSIGNED' ? '#93C5FD' : hoveredItem.data.status === 'MAINTENANCE' ? '#F87171' : '#86EFAC' }}>{hoveredItem.data.status}</strong>
                      {hoveredItem.data.pinCode && <span> • PIN: <code>{hoveredItem.data.pinCode}</code></span>}
                    </div>
                  </div>
                </div>

                {hoveredItem.data.status === 'ASSIGNED' ? (
                  <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div><strong>Assigned To:</strong> {hoveredItem.data.assignedToUserName || 'Scholar'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {hoveredItem.data.assignedSeatNumber ? `Desk #${hoveredItem.data.assignedSeatNumber}` : 'General Locker'} • {hoveredItem.data.passType || 'Monthly'}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#86EFAC', fontWeight: 700 }}>
                    Click locker to assign scholar or manage PIN →
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
