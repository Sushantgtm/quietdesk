import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Coffee } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="section" style={{ paddingTop: '4rem', paddingBottom: '5rem', position: 'relative' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center'
        }}>
          {/* Left Column: Hero Copy */}
          <div>
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
              marginBottom: '1.5rem',
              border: '1px solid var(--border-accent)'
            }}>
              <Sparkles size={14} />
              Kathmandu's Premier Study Lounge
            </div>

            <h1 style={{ marginBottom: '1.25rem' }}>
              Silence, <br />
              <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>by design.</span>
            </h1>

            <p style={{ fontSize: '1.125rem', marginBottom: '2rem', maxWidth: '520px', lineHeight: 1.7 }}>
              Bring the books. We've got the space. A premium study environment blending academic rigor with boutique hospitality in Lazimpat.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <Link to="/book" className="btn btn-primary" style={{ padding: '0.875rem 1.75rem', fontSize: '1rem' }}>
                Reserve Your Seat <ArrowRight size={18} />
              </Link>
              <a href="#about" className="btn btn-outline" style={{ padding: '0.875rem 1.75rem', fontSize: '1rem' }}>
                Explore the Space
              </a>
            </div>

            {/* Highlights Bar */}
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={18} color="var(--accent)" />
                <span>100% Quiet Zone</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Clock size={18} color="var(--accent)" />
                <span>Flexible Hours</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Coffee size={18} color="var(--accent)" />
                <span>Free Artisanal Beverages</span>
              </div>
            </div>
          </div>

          {/* Right Column: Line-Art SVG Illustration Container */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-hover)',
              border: '1px solid var(--border-accent)',
              textAlign: 'center'
            }}>
              {/* Minimal Line Art Artwork */}
              <svg viewBox="0 0 400 300" width="100%" height="auto" fill="none" stroke="#C9A574" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Desk Surface */}
                <path d="M 40 220 L 360 220" strokeWidth="4" stroke="#151B2E" />
                <path d="M 60 220 L 60 270" strokeWidth="3" stroke="#151B2E" />
                <path d="M 340 220 L 340 270" strokeWidth="3" stroke="#151B2E" />
                
                {/* Open Book */}
                <path d="M 120 220 C 140 200, 180 200, 200 220 C 220 200, 260 200, 280 220" />
                <line x1="200" y1="205" x2="200" y2="220" strokeWidth="1.5" />
                <line x1="140" y1="210" x2="185" y2="210" strokeWidth="1.5" opacity="0.6" />
                <line x1="140" y1="215" x2="180" y2="215" strokeWidth="1.5" opacity="0.6" />
                <line x1="215" y1="210" x2="260" y2="210" strokeWidth="1.5" opacity="0.6" />
                <line x1="215" y1="215" x2="255" y2="215" strokeWidth="1.5" opacity="0.6" />
                
                {/* Study Lamp */}
                <path d="M 90 220 L 90 140 L 140 100" strokeWidth="3" stroke="#151B2E" />
                <path d="M 130 90 L 165 110 L 145 125 Z" fill="#C9A574" fillOpacity="0.15" />
                
                {/* Coffee Cup */}
                <rect x="300" y="195" width="25" height="25" rx="3" strokeWidth="2" />
                <path d="M 325 200 Q 333 207.5 325 215" strokeWidth="2" />
                
                {/* Plant Succulent */}
                <path d="M 350 220 L 345 200 L 365 200 Z" />
                <path d="M 355 200 Q 350 185 340 190" />
                <path d="M 355 200 Q 360 180 370 185" />
                
                {/* Sound Waves floating (Silence concept) */}
                <path d="M 180 80 Q 200 65 220 80" strokeDasharray="3 3" opacity="0.7" />
                <path d="M 170 65 Q 200 45 230 65" strokeDasharray="3 3" opacity="0.4" />
              </svg>

              <div style={{
                marginTop: '1.5rem',
                fontFamily: 'var(--font-headline)',
                fontWeight: 600,
                color: 'var(--primary)',
                fontSize: '1.1rem'
              }}>
                Crafted for Deep Focus
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Equipped with acoustic isolation & high-speed Wi-Fi
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
