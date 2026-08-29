import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Instagram, Facebook, Shield } from 'lucide-react';
import whiteLogoImg from '../../../image/White logo.jpg';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--primary)',
      color: 'rgba(255, 255, 255, 0.8)',
      padding: '4rem 0 2rem 0',
      borderTop: '2px solid var(--accent)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <img
                src={whiteLogoImg}
                alt="The Quiet Desk White Logo"
                style={{
                  height: '46px',
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  display: 'block'
                }}
              />
              <div>
                <div style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.15
                }}>
                  The Quiet Desk
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'var(--accent)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}>
                  Kathmandu · Less noise, more progress.
                </div>
              </div>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Less noise, more progress. A premium study and workspace environment located in the heart of Kathmandu.
            </p>
          </div>

          {/* Contact Details */}
          <div>
            <h4 style={{ color: 'var(--accent)', marginBottom: '1.25rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact Us
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={16} color="var(--accent)" />
                <span>Lazimpat, Kathmandu, Nepal</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={16} color="var(--accent)" />
                <a href="mailto:thequiettdesk83@gmail.com" style={{ color: 'inherit' }}>thequiettdesk83@gmail.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={16} color="var(--accent)" />
                <span>+977 9864826810</span>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 style={{ color: 'var(--accent)', marginBottom: '1.25rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Information & Policies
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <li><a href="#about" style={{ color: 'inherit' }}>About Us</a></li>
              <li><Link to="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link></li>
              <li><Link to="/terms" style={{ color: 'inherit' }}>Terms of Service</Link></li>
              <li><Link to="/faq" style={{ color: 'inherit' }}>FAQ</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 style={{ color: 'var(--accent)', marginBottom: '1.25rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connect With Us
            </h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a
                href="https://instagram.com/thequiettdesk"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  transition: 'var(--transition)'
                }}
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  transition: 'var(--transition)'
                }}
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <div>© {new Date().getFullYear()} The Quiet Desk. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <span>Crafted for Focus in Kathmandu</span>
            <Link
              to="/admin/login"
              title="Admin Portal"
              style={{
                color: 'rgba(255,255,255,0.3)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              <Shield size={14} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
