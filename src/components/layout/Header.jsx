import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../../image/logo.png';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (anchorId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + anchorId);
    } else {
      const element = document.querySelector(anchorId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'About', anchor: '#about' },
    { label: 'Amenities', anchor: '#features' },
    { label: 'Seat Map', anchor: '#seats' },
    { label: 'Pricing', anchor: '#pricing' },
    { label: 'FAQ', anchor: '#faq' }
  ];

  return (
    <>
      <style>{`
        .nav-header {
          position: sticky;
          top: 0;
          z-index: 100;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-header.scrolled {
          background: rgba(248, 244, 236, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 4px 32px rgba(74, 60, 43, 0.08), 0 1px 0 rgba(201,165,116,0.10);
        }
        .nav-header.top {
          background: rgba(248, 244, 236, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .nav-link {
          background: none;
          border: none;
          padding: 0.45rem 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 100px;
          transition: color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .nav-link:hover {
          color: var(--primary);
          background: rgba(74,60,43,0.06);
        }
        .nav-cta {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1.2rem;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.9rem;
          background: var(--primary);
          color: var(--accent) !important;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(74,60,43,0.18);
        }
        .nav-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(74,60,43,0.28);
        }
        .admin-pill {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.35rem 0.9rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          border: 1px solid var(--border-subtle);
          transition: all 0.2s;
        }
        .admin-pill:hover {
          color: var(--primary);
          border-color: var(--border-accent);
          background: rgba(74,60,43,0.04);
        }
        .mobile-drawer {
          background: rgba(248, 244, 236, 0.97);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(201,165,116,0.15);
          padding: 1.25rem 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .mobile-nav-btn {
          background: none;
          border: none;
          padding: 0.7rem 1rem;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-md);
          text-align: left;
          transition: all 0.15s;
          font-family: inherit;
        }
        .mobile-nav-btn:hover {
          color: var(--primary);
          background: rgba(74,60,43,0.05);
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>

      <header className={`nav-header ${scrolled ? 'scrolled' : 'top'}`}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px'
        }}>
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <img
              src={logoImg}
              alt="The Quiet Desk Logo"
              style={{
                height: '44px',
                width: 'auto',
                objectFit: 'contain',
                mixBlendMode: 'multiply',
                display: 'block'
              }}
            />
            <div>
              <div style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--primary)',
                lineHeight: 1.15
              }}>
                The Quiet Desk
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: 'var(--accent-hover)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                Kathmandu · Less noise, more progress.
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {navLinks.map(({ label, anchor }) => (
              <button key={label} onClick={() => handleNavClick(anchor)} className="nav-link">
                {label}
              </button>
            ))}

            <div style={{ width: '1px', height: '22px', background: 'var(--border-subtle)', margin: '0 0.75rem' }} />

            <Link to="/book" className="nav-cta">
              <UserCheck size={16} /> Reserve a Seat
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--primary)',
              borderRadius: '8px'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer">
            {navLinks.map(({ label, anchor }) => (
              <button key={label} onClick={() => handleNavClick(anchor)} className="mobile-nav-btn">{label}</button>
            ))}
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />
            <Link to="/book" onClick={() => setMobileMenuOpen(false)} className="nav-cta" style={{ justifyContent: 'center', marginTop: '0.25rem' }}>
              <UserCheck size={16} /> Reserve a Seat
            </Link>
          </div>
        )}
      </header>
    </>
  );
};
