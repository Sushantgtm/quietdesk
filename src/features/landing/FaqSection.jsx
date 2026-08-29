import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FaqSection = () => {
  const { faqs } = useBooking();
  const [openFaqId, setOpenFaqId] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Only display first 5 FAQs on the landing page
  const displayFaqs = faqs ? faqs.slice(0, 5) : [];

  return (
    <section id="faq" className="section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container">
        
        {/* Title Block */}
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
            <Sparkles size={14} /> Clear Answers
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Got questions about cabins, space rules, or facilities? Here are answers to our most common inquiries.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {displayFaqs.length > 0 ? (
              displayFaqs.map((faq) => {
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
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No FAQs available.
              </div>
            )}
          </div>

          {/* View All Button */}
          {faqs && faqs.length > 5 && (
            <div style={{ textAlign: 'center' }}>
              <Link to="/faq" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
                View All FAQs
              </Link>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
