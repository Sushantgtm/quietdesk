import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { INITIAL_AMENITIES } from '../../services/firebase/amenityService';
import { Wifi, Zap, Lock, Key, Wind, VolumeX, Armchair, ShieldAlert, Sparkles } from 'lucide-react';

const ICON_MAP = {
  Wind: <Wind size={24} />,
  VolumeX: <VolumeX size={24} />,
  Armchair: <Armchair size={24} />,
  Zap: <Zap size={24} />,
  Key: <Key size={24} />,
  Lock: <Lock size={24} />,
  Wifi: <Wifi size={24} />,
  ShieldAlert: <ShieldAlert size={24} />
};

export const AmenitiesSection = () => {
  const { amenities } = useBooking();

  // Ensure legacy deprecated items are filtered and the requested amenities always display
  const rawList = (amenities && amenities.length > 0) ? amenities : INITIAL_AMENITIES;
  const filtered = rawList.filter(item => {
    const title = (item.title || '').toLowerCase();
    const id = item.id || '';
    if (id === 'amenity_beverage' || title.includes('artisanal') || title.includes('beverage') || title.includes('coffee')) return false;
    if (id === 'amenity_print' || title.includes('printing') || title.includes('scanning')) return false;
    if (id === 'amenity_monitors' || title.includes('monitor')) return false;
    if (id === 'amenity_lighting' || title.includes('lighting')) return false;
    return true;
  });

  const displayList = filtered.length >= 4 ? filtered : INITIAL_AMENITIES;

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
          {displayList.map((item, idx) => (
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
