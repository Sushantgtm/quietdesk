import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { Wifi, Zap, Coffee, Lock, Sun, Printer, ShieldAlert, Monitor, Sparkles } from 'lucide-react';

const ICON_MAP = {
  Wifi: <Wifi size={24} />,
  Zap: <Zap size={24} />,
  Coffee: <Coffee size={24} />,
  Lock: <Lock size={24} />,
  Sun: <Sun size={24} />,
  Printer: <Printer size={24} />,
  Monitor: <Monitor size={24} />,
  ShieldAlert: <ShieldAlert size={24} />
};

export const AmenitiesSection = () => {
  const { amenities } = useBooking();

  return (
    <section id="features" className="section">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--accent-hover)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '0.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Sparkles size={14} /> Serene Experience
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Thoughtful Amenities</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Every detail at The Quiet Desk has been hand-selected to optimize productivity and minimize mental fatigue.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.75rem'
        }}>
          {(amenities && amenities.length > 0 ? amenities : []).map((item, idx) => (
            <div
              key={item.id || idx}
              className="card"
              style={{
                padding: '1.75rem',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start'
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {ICON_MAP[item.iconName] || <Sparkles size={24} />}
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', color: 'var(--primary)' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
