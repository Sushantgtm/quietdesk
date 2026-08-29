import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Scale, VolumeX, ShieldAlert, Award } from 'lucide-react';

export const TermsOfServicePage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }}>
      <Header />
      <main style={{ flex: 1, padding: '4rem 0 6rem 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          
          {/* Header section */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              backgroundColor: 'var(--accent-light)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent-hover)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              border: '1px solid var(--border-accent)'
            }}>
              <Scale size={14} /> Lounge Regulations
            </div>
            <h1 style={{ fontFamily: 'var(--font-headline)', color: 'var(--primary)', marginBottom: '1rem' }}>
              Terms of Service
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Welcome to Kathmandu's premier study lounge. Please review our workspace guidelines and policy commitments.
            </p>
          </div>

          {/* Document Content */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-soft)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8
          }}>
            
            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <VolumeX size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>1. Strict Silence Discipline</h3>
                <p style={{ fontSize: '0.925rem', margin: 0 }}>
                  Silence is our primary offering. Members must ensure their mobile phones are kept on silent mode at all times. Whispering, phone calls, and audible audio listening are strictly prohibited within designated silent study cabins. Failure to comply may lead to immediate lounge session termination.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>2. Booking & Cancellation</h3>
                <p style={{ fontSize: '0.925rem', margin: 0 }}>
                  A study seat reservation must be made through our web booking portal or verified in-person by the manager. Cancellations or rescheduling requests must be submitted at least 24 hours prior to the booked slot for refund consideration. Unused slots are non-refundable.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>3. General Conduct & Liability</h3>
                <p style={{ fontSize: '0.925rem', margin: 0 }}>
                  Members are responsible for their own belongings. The Quiet Desk provides key-operated secure lockers, but does not assume liability for lost items. Respectful, quiet professional conduct is expected of all visitors.
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginTop: '2.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              By checking in at the Lazimpat branch of The Quiet Desk, you agree to comply with the rules outlined above. Thank you for helping us maintain a premium focus environment.
            </div>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
