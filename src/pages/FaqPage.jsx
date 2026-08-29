import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useBooking } from '../context/BookingContext';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const FaqPage = () => {
  const { faqs } = useBooking();
  const [openFaqId, setOpenFaqId] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

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
              <HelpCircle size={14} /> Frequently Asked Questions
            </div>
            <h1 style={{ fontFamily: 'var(--font-headline)', color: 'var(--primary)', marginBottom: '1rem' }}>
              Common Questions
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Everything you need to know about cabins, bookings, and policies at The Quiet Desk.
            </p>
          </div>

          {/* FAQ Accordion list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs && faqs.length > 0 ? (
              faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-soft)',
                      overflow: 'hidden',
                      transition: 'var(--transition)'
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      style={{
                        width: '100%',
                        padding: '1.25rem 1.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit'
                      }}
                    >
                      <span style={{
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: isOpen ? 'var(--accent-hover)' : 'var(--primary)',
                        transition: 'color 0.2s ease'
                      }}>
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp size={18} style={{ color: 'var(--accent-hover)' }} />
                      ) : (
                        <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div style={{
                        padding: '0 1.5rem 1.5rem 1.5rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        lineHeight: 1.7,
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '1rem',
                        backgroundColor: 'rgba(74, 60, 43, 0.02)'
                      }}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No FAQs available. Please add FAQs in the admin panel.
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
