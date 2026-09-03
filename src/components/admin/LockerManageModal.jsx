import React, { useState } from 'react';
import { X, Lock, Key, User, Phone, Mail, Calendar, Shield, AlertTriangle, CheckCircle2, UserPlus, Search, Sliders, RefreshCw } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';

export const LockerManageModal = ({
  isOpen,
  onClose,
  locker,
  onAssignLocker,
  onReleaseLocker,
  onUpdateStatus
}) => {
  const { users, seats, lockers } = useBooking();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState('');
  const [passType, setPassType] = useState('MONTHLY');
  const [customPin, setCustomPin] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('DETAILS'); // 'DETAILS' | 'ASSIGN'

  if (!isOpen || !locker) return null;

  const isAssigned = locker.status === 'ASSIGNED';
  const isMaintenance = locker.status === 'MAINTENANCE';

  // Check if selected student already has an active locker (Max 1 locker rule)
  const studentExistingLocker = selectedStudent ? (lockers || []).find(l => 
    l.id !== locker.id && 
    l.status === 'ASSIGNED' && 
    ((l.assignedToUserId && l.assignedToUserId === selectedStudent.id) ||
     (l.assignedToUserPhone && selectedStudent.phone && l.assignedToUserPhone.replace(/\D/g, '') === selectedStudent.phone.replace(/\D/g, '')))
  ) : null;

  // Filter students for assignment
  const filteredStudents = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.fullName || u.name || '').toLowerCase().includes(q);
    const phoneMatch = (u.phone || '').includes(q);
    const codeMatch = (u.userCode || u.studentCode || '').toLowerCase().includes(q);
    return !searchQuery || nameMatch || phoneMatch || codeMatch;
  });

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please select a student to assign this locker.');
      return;
    }

    if (studentExistingLocker) {
      const confirmChange = window.confirm(
        `Notice: ${selectedStudent.fullName || selectedStudent.name} is currently assigned ${studentExistingLocker.label || studentExistingLocker.lockerNumber}.\n\nUnder the 1-locker-per-student rule, assigning this locker will automatically release their previous locker first.\n\nDo you want to proceed?`
      );
      if (!confirmChange) return;
    }

    setIsProcessing(true);
    try {
      const pinToUse = customPin.trim() || `${Math.floor(1000 + Math.random() * 9000)}`;
      await onAssignLocker(locker.id, {
        userId: selectedStudent.id,
        userName: selectedStudent.fullName || selectedStudent.name,
        userPhone: selectedStudent.phone || '',
        userEmail: selectedStudent.email || '',
        seatNumber: selectedSeatNumber || selectedStudent.seatNumber || selectedStudent.assignedSeat || '',
        passType,
        pinCode: pinToUse,
        notes
      });
      onClose();
    } catch (err) {
      alert('Failed to assign locker: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    if (window.confirm(`Are you sure you want to release ${locker.label || locker.lockerNumber} and make it AVAILABLE?`)) {
      setIsProcessing(true);
      try {
        await onReleaseLocker(locker.id);
        onClose();
      } catch (err) {
        alert('Failed to release locker: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleToggleMaintenance = async () => {
    const newStatus = isMaintenance ? 'AVAILABLE' : 'MAINTENANCE';
    setIsProcessing(true);
    try {
      await onUpdateStatus(locker.id, newStatus, {
        notes: isMaintenance ? '' : 'Under electronic lock maintenance'
      });
      onClose();
    } catch (err) {
      alert('Failed to update locker status: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px'
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
              fontWeight: 900
            }}>
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {locker.label || locker.lockerNumber} • Storage Management
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Physical Key Storage Locker Unit
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#1E293B',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Strip */}
        <div style={{
          padding: '0.85rem 1.5rem',
          backgroundColor: isAssigned ? '#EFF6FF' : isMaintenance ? '#FEF2F2' : '#F0FDF4',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Locker Status:</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: isAssigned ? '#DBEAFE' : isMaintenance ? '#FEE2E2' : '#DCFCE7',
              color: isAssigned ? '#1D4ED8' : isMaintenance ? '#991B1B' : '#166534',
              textTransform: 'uppercase'
            }}>
              {locker.status}
            </span>
          </div>

          {locker.pinCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
              <Key size={14} style={{ color: '#D97706' }} />
              <span>Digital Keypad PIN: <code style={{ backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', color: '#B45309' }}>{locker.pinCode}</code></span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* If Locker is Assigned: Display Current Occupant Scholar Card */}
          {isAssigned && (
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '2px solid #BFDBFE',
              padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} /> Assigned Scholar Information
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Scholar Name</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {locker.assignedToUserName || 'Registered Scholar'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Linked Desk / Cabin</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                    {locker.assignedSeatNumber ? `Desk #${locker.assignedSeatNumber}` : 'Unassigned Cabin'}
                  </div>
                </div>

                {locker.assignedToUserPhone && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Contact Phone</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={13} style={{ color: '#64748B' }} /> {locker.assignedToUserPhone}
                    </div>
                  </div>
                )}

                {locker.passType && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Membership Pass</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                      {locker.passType} Pass (+NPR {locker.passType === 'MONTHLY' ? '1,000' : '300'})
                    </div>
                  </div>
                )}

                {locker.startDate && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Duration</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
                      {locker.startDate} → {locker.endDate || 'Active'}
                    </div>
                  </div>
                )}
              </div>

              {locker.notes && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#64748B' }}>
                  <strong>Notes:</strong> {locker.notes}
                </div>
              )}
            </div>
          )}

          {/* If Locker is Available: Option to Assign Scholar */}
          {!isAssigned && !isMaintenance && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserPlus size={16} style={{ color: '#C9A574' }} /> Assign Locker to Registered Scholar
              </div>

              {/* Student Search */}
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search registered student by name, phone, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Student Picker List */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                marginBottom: '1rem',
                backgroundColor: '#F8FAFC'
              }}>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => {
                    const isSelected = selectedStudent && selectedStudent.id === student.id;
                    return (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          if (student.assignedSeat || student.seatNumber) {
                            setSelectedSeatNumber(student.seatNumber || student.assignedSeat.replace(/\D/g, ''));
                          }
                        }}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderBottom: '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#1D4ED8' : '#0F172A' }}>
                            {student.fullName || student.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {student.phone} • {student.userCode || student.passType || 'Standard'}
                            {(() => {
                              const existing = (lockers || []).find(l => 
                                l.id !== locker.id && 
                                l.status === 'ASSIGNED' && 
                                ((l.assignedToUserId && l.assignedToUserId === student.id) ||
                                 (l.assignedToUserPhone && student.phone && l.assignedToUserPhone.replace(/\D/g, '') === student.phone.replace(/\D/g, '')))
                              );
                              return existing ? (
                                <span style={{ marginLeft: '6px', color: '#D97706', fontWeight: 700, backgroundColor: '#FEF3C7', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                  Holds {existing.label || existing.lockerNumber} (Will Release)
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </div>

                        {isSelected && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <CheckCircle2 size={14} /> Selected
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                    No matching students found. Register student first via Register Student button.
                  </div>
                )}
              </div>

              {/* Assignment Options Form */}
              {selectedStudent && (
                <div style={{ backgroundColor: '#F1F5F9', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                        Linked Desk / Cabin
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. C2, A7, R4"
                        value={selectedSeatNumber}
                        onChange={(e) => setSelectedSeatNumber(e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                        Keypad PIN Code
                      </label>
                      <input
                        type="text"
                        placeholder="Auto-generated if blank"
                        value={customPin}
                        maxLength={6}
                        onChange={(e) => setCustomPin(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                      Membership Duration Pass
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['DAILY', 'WEEKLY', 'MONTHLY'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPassType(t)}
                          style={{
                            flex: 1,
                            padding: '0.45rem',
                            borderRadius: '6px',
                            border: passType === t ? '2px solid #2563EB' : '1px solid #CBD5E1',
                            backgroundColor: passType === t ? '#DBEAFE' : '#FFFFFF',
                            color: passType === t ? '#1E40AF' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If Locker is under Maintenance */}
          {isMaintenance && (
            <div style={{
              backgroundColor: '#FEF2F2',
              borderRadius: '10px',
              border: '1px solid #FECACA',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#991B1B'
            }}>
              <AlertTriangle size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Locker Unit Under Maintenance</div>
                <div style={{ fontSize: '0.78rem', color: '#B91C1C', marginTop: '2px' }}>
                  {locker.notes || 'This locker is currently locked for service or battery inspection.'}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          borderBottomLeftRadius: '15px',
          borderBottomRightRadius: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <div>
            <button
              type="button"
              onClick={handleToggleMaintenance}
              disabled={isProcessing}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #CBD5E1',
                color: isMaintenance ? '#15803D' : '#D97706',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {isMaintenance ? '✓ Restore to Available' : '⚠ Set Maintenance'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isAssigned && (
              <button
                type="button"
                onClick={handleRelease}
                disabled={isProcessing}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {isProcessing ? 'Releasing...' : 'Release Locker (Free Up)'}
              </button>
            )}

            {!isAssigned && !isMaintenance && selectedStudent && (
              <button
                type="button"
                onClick={handleAssign}
                disabled={isProcessing}
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isProcessing ? 'Assigning...' : 'Assign Locker to Scholar'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
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
