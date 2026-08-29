import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ShieldCheck, Eye, Lock, FileText } from 'lucide-react';

export const PrivacyPolicyPage = () => {
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
              <ShieldCheck size={14} /> Trust & Transparency
            </div>
            <h1 style={{ fontFamily: 'var(--font-headline)', color: 'var(--primary)', marginBottom: '1rem' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Last updated: August 30, 2026. How we protect and manage your workspace personal data.
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
                <Eye size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>1. Data Collection</h3>
                <p style={{ fontSize: '0.925rem', margin: 0 }}>
                  We collect information necessary to facilitate study lounge desk reservations and security operations. This includes your name, email address, phone number, academic/professional affiliation, and check-in times.
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
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>2. Information Use & Safety</h3>
                <p style={{ fontSize: '0.925rem', margin: 0 }}>
                  Your contact details are strictly used for booking confirmations, invoices, and emergency security broadcasts. We do not sell, rent, or lease our membership lists to third parties. All local transactions are recorded in line with Nepalese compliance codes.
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
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--primary)' }}>3. Storage & Security</h3>
                <p style={{ fontSize: '0.925rem', margin: 0 }}>
                  Data is processed securely via enterprise Firebase cloud frameworks. Access is restricted to authorized branch management. Physical study areas are monitored by closed-circuit camera networks for member safety.
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginTop: '2.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              If you have any questions or would like to request removal of your registration account details from our database, please contact the branch administrator at <a href="mailto:thequiettdesk83@gmail.com" style={{ color: 'var(--accent-hover)', textDecoration: 'underline' }}>thequiettdesk83@gmail.com</a>.
            </div>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
