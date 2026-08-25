import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Shield, Lock, Mail } from 'lucide-react';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Header />

      <main className="section" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '460px' }}>
          <div className="card" style={{ padding: '2.5rem', border: '1px solid var(--border-accent)' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Shield size={28} />
            </div>

            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>Admin Portal</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Sign in to manage live seat availability, bookings & desk status.
            </p>

            {error && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                  Manager Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email address"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Manager Portal'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
