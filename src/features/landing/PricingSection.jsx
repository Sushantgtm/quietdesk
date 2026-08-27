import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, ArrowRight, Lock } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { ACCESS_PLANS as FALLBACK_PLANS } from '../../services/mock/mockData';

export const PricingSection = () => {
  const { plans } = useBooking();
  const rawPlans = (plans && plans.length > 0) ? plans : FALLBACK_PLANS;

  // Normalize plans so Firestore / Admin records and mock records render consistently
  const displayPlans = rawPlans.map(plan => {
    const title = plan.name || plan.title || 'Access Pass';

    // Format price
    let formattedPrice = plan.price;
    if (typeof plan.price === 'number') {
      formattedPrice = `NPR ${plan.price.toLocaleString()}`;
    } else if (typeof plan.price === 'string' && !plan.price.toUpperCase().includes('NPR')) {
      formattedPrice = `NPR ${plan.price}`;
    }

    // Format period
    const period = plan.period || plan.duration || (
      plan.id?.includes('daily') ? 'day' : plan.id?.includes('weekly') ? 'week' : 'month'
    );

    // Format features array
    let featuresList = [];
    if (Array.isArray(plan.features)) {
      featuresList = plan.features;
    } else if (typeof plan.features === 'string') {
      featuresList = plan.features.split(',').map(f => f.trim()).filter(Boolean);
    } else {
      featuresList = ['Full workspace access', 'High-speed Wi-Fi', 'Quiet focus environment'];
    }

    // Determine key locker note (without showing price)
    let lockerNote = plan.lockerEligible === false || plan.id?.includes('daily')
      ? 'Optional on-site upon request'
      : 'Secure Key Locker Available';

    const cta = plan.cta || (
      plan.id?.includes('daily') ? 'Get Day Pass' : plan.id?.includes('weekly') ? 'Reserve Week' : 'Join Membership'
    );

    const description = plan.description || plan.desc || (
      plan.id?.includes('daily')
        ? 'Full-day access for focused study sprints and research.'
        : plan.id?.includes('weekly')
          ? '7 consecutive days with full amenity access and locker option.'
          : 'Dedicated workstation access with priority perks and premium storage.'
    );

    const isHighlighted = plan.highlighted || plan.id?.includes('weekly') || plan.isPopular;

    return {
      ...plan,
      title,
      formattedPrice,
      period,
      featuresList,
      lockerNote,
      cta,
      description,
      isHighlighted
    };
  });

  return (
    <section id="pricing" className="section" style={{ backgroundColor: 'var(--bg-surface)' }}>
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
            Flexible Access
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Access Plans</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Choose a pass that matches your study schedule. Optional secure lockers available for weekly & monthly packages. Contact us for current pricing.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'stretch'
        }}>
          {displayPlans.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                border: plan.isHighlighted ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                transform: plan.isHighlighted ? 'scale(1.03)' : 'none',
                boxShadow: plan.isHighlighted ? 'var(--shadow-hover)' : 'var(--shadow-card)'
              }}
            >
              {plan.isHighlighted && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--primary)',
                  padding: '0.25rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Star size={12} fill="var(--primary)" /> Most Popular
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  {plan.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', minHeight: '40px' }}>
                  {plan.description}
                </p>

                {/* Price hidden per owner's request — data retained */}
                <div style={{ display: 'none' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-headline)' }}>
                    {plan.formattedPrice}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    /{plan.period}
                  </span>
                </div>

                {/* Key Locker Facility Highlight Banner (no price) */}
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: plan.isHighlighted ? 'var(--accent-light)' : 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  border: plan.isHighlighted ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Lock size={15} style={{ color: plan.isHighlighted ? 'var(--accent-hover)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <span>Key Locker: <strong>{plan.lockerNote}</strong></span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '2rem' }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {plan.featuresList.map((feat, fIdx) => (
                      <li key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to={`/book?plan=${plan.id}`}
                className={`btn ${plan.isHighlighted ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {plan.cta} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
