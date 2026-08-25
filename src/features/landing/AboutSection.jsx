import React from 'react';
import { VolumeX, Shield, Award, Sparkles } from 'lucide-react';

export const AboutSection = () => {
  return (
    <section id="about" className="section" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--accent-hover)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '0.5rem'
          }}>
            Our Philosophy
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Designed for Scholars & Thinkers</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Traditional cafes are noisy, and public libraries lack ergonomics. The Quiet Desk fills the void in Kathmandu with a sanctuary tailored specifically for distraction-free deep work.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-hover)',
              marginBottom: '1.25rem'
            }}>
              <VolumeX size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Strict Silence Protocol</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Zero group discussions or loud phone calls in main zones. We enforce acoustic discipline so your concentration remains unbroken.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-hover)',
              marginBottom: '1.25rem'
            }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Guaranteed Desks</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              No more wandering Kathmandu searching for an available power socket. Lock in your reserved desk online before leaving home.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-hover)',
              marginBottom: '1.25rem'
            }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Ergonomic Comfort</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Custom oak desks, adjustable mesh chairs, dedicated warm reading lamps, and warm power strip access on every single station.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
