import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Mail, Phone, Instagram, Facebook, Shield } from 'lucide-react';

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <BookOpen size={20} />
              </div>
              <span style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#FFFFFF'
              }}>
                The Quiet Desk
              </span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Silence, by design. A premium study and workspace environment located in the heart of Kathmandu.
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
                <span>+977 984-1234567</span>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 style={{ color: 'var(--accent)', marginBottom: '1.25rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legal & Admin
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <li><a href="#about" style={{ color: 'inherit' }}>About Us</a></li>
              <li><a href="#privacy" style={{ color: 'inherit' }}>Privacy Policy</a></li>
              <li><a href="#terms" style={{ color: 'inherit' }}>Terms of Service</a></li>
              <li><a href="#faq" style={{ color: 'inherit' }}>FAQ</a></li>
              <li style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Link to="/admin/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={14} /> Staff / Admin Login
                </Link>
              </li>
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
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span>Crafted for Focus in Kathmandu</span>
            <Link to="/admin/login" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.8rem' }}>Admin Access</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
