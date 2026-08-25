import React from 'react';
import { X, Printer, CheckCircle, Copy, MapPin, Phone, Mail, Calendar, Clock, Lock, DollarSign, FileText } from 'lucide-react';

export const RegistrationReceiptModal = ({
  isOpen,
  onClose,
  receiptData
}) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `
=== THE QUIET DESK | STUDENT REGISTRATION RECEIPT ===
Student Name: ${receiptData.fullName}
Student ID: ${receiptData.userCode || 'N/A'}
Contact: ${receiptData.phone} | ${receiptData.address}
Package: ${receiptData.passType} Pass
Arrival Shift: ${receiptData.shiftText}
Validity: ${receiptData.startDate} to ${receiptData.endDate}
Assigned Desk: ${receiptData.seatNumber || 'Floating Desk'}
Locker Facility: ${receiptData.hasLocker ? `Yes (${receiptData.lockerNumber})` : 'No'}
-----------------------------------------------------
Package Base Fee: NPR ${receiptData.basePrice}
Locker Fee: NPR ${receiptData.lockerFee}
Total Amount: NPR ${receiptData.totalAmount}
Amount Paid: NPR ${receiptData.amountPaid}
Remaining Balance Due: NPR ${receiptData.pendingAmount}
Payment Status: ${receiptData.paymentStatus} (${receiptData.paymentMethod})
Notes: ${receiptData.notes || 'None'}
Date: ${receiptData.timestamp}
=====================================================
    `.trim();

    navigator.clipboard.writeText(text);
    alert('✓ Receipt summary copied to clipboard!');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
        maxWidth: '640px',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #CBD5E1'
      }}>
        {/* Receipt Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #C9A574'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle size={22} style={{ color: '#10B981' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Registration Confirmed & Receipt
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Ref: {receiptData.bookingCode} • Student Code: {receiptData.userCode}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Institution Header */}
          <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px dashed #CBD5E1' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', fontFamily: 'Playfair Display, Georgia, serif' }}>
              THE QUIET DESK
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
              Silence, by design • Premium Study & Focus Sanctuary
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.1rem' }}>
              Official Student Admission & Billing Voucher
            </div>
          </div>

          {/* Student & Shift Info */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Student Name</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{receiptData.fullName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Phone Number</span>
              <strong style={{ color: '#0F172A' }}>{receiptData.phone}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Physical Address</span>
              <strong style={{ color: '#0F172A' }}>{receiptData.address}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Package Enrolled</span>
              <span style={{
                display: 'inline-block',
                marginTop: '0.15rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8'
              }}>
                {receiptData.passType} PASS
              </span>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Daily Arrival Slot</span>
              <strong style={{ color: '#0F172A', fontSize: '0.8rem' }}>{receiptData.shiftText}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Membership Dates</span>
              <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>
                {receiptData.startDate} to {receiptData.endDate}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Station & Locker</span>
              <span style={{ color: '#334155', fontWeight: 700, fontSize: '0.8rem' }}>
                {receiptData.seatNumber} • {receiptData.hasLocker ? `Locker ${receiptData.lockerNumber}` : 'No Locker'}
              </span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Description</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Amount (NPR)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>
                    {receiptData.passType} Study Pass Fee ({receiptData.shiftText})
                  </td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    NPR {Number(receiptData.basePrice).toLocaleString()}
                  </td>
                </tr>
                {receiptData.hasLocker && (
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>
                      Personal Storage Locker Facility ({receiptData.lockerNumber})
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: '#2563EB' }}>
                      +NPR {Number(receiptData.lockerFee).toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#0F172A' }}>Total Amount</td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 900, color: '#0F172A', fontSize: '1rem' }}>
                    NPR {Number(receiptData.totalAmount).toLocaleString()}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#ECFDF5' }}>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#047857' }}>
                    Amount Paid Upfront ({receiptData.paymentMethod})
                  </td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                    NPR {Number(receiptData.amountPaid).toLocaleString()}
                  </td>
                </tr>
                <tr style={{ backgroundColor: receiptData.pendingAmount > 0 ? '#FEF2F2' : '#F8FAFC' }}>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: receiptData.pendingAmount > 0 ? '#DC2626' : '#059669' }}>
                    Remaining Pending Due Balance
                  </td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 900, color: receiptData.pendingAmount > 0 ? '#DC2626' : '#059669', fontSize: '1rem' }}>
                    NPR {Number(receiptData.pendingAmount).toLocaleString()} {receiptData.pendingAmount === 0 ? '(Cleared)' : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {receiptData.notes && (
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem'
            }}>
              <span style={{ color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Student Remarks / Notes:</span>
              <div style={{ color: '#334155' }}>{receiptData.notes}</div>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
            Registered on {receiptData.timestamp} • Thank you for choosing The Quiet Desk.
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Printer size={16} /> Print Receipt
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Copy size={16} /> Copy Details
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
