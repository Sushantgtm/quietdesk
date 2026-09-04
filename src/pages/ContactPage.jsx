import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { submitContactInquiry } from '../services/firebase/contactService';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  message: ''
};

const validateForm = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  if (!form.email.trim()) {
    errors.email = 'Please enter your email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!form.phone.trim()) errors.phone = 'Please enter your phone number.';
  if (!form.message.trim()) errors.message = 'Please tell us how we can help.';
  return errors;
};

export const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submission, setSubmission] = useState({ status: 'idle', message: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
    if (submission.status !== 'idle') setSubmission({ status: 'idle', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmission({ status: 'submitting', message: '' });
    try {
      await submitContactInquiry(form);
      setForm(initialForm);
      setSubmission({
        status: 'success',
        message: 'Thank you. Your message has been sent, and our team will be in touch soon.'
      });
    } catch (error) {
      console.error('Unable to submit contact inquiry:', error);
      setSubmission({
        status: 'error',
        message: 'We could not send your message right now. Please try again or contact us directly.'
      });
    }
  };

  const fieldProps = (field) => ({
    id: field,
    name: field,
    value: form[field],
    onChange: handleChange,
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
    required: true
  });

  return (
    <div className="contact-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <style>{`
          .contact-intro {
            padding: 4.25rem 0 2.75rem;
            text-align: center;
          }
          .contact-intro p {
            max-width: 590px;
            margin: 0 auto;
            line-height: 1.7;
          }
          .contact-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
            gap: 2rem;
            align-items: start;
            padding-bottom: 5rem;
          }
          .contact-panel {
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-soft);
            padding: 2rem;
          }
          .contact-panel h2 {
            font-size: 1.55rem;
            margin-bottom: 0.4rem;
          }
          .contact-panel > p {
            font-size: 0.92rem;
            margin-bottom: 1.5rem;
          }
          .contact-form {
            display: grid;
            gap: 1rem;
          }
          .contact-field {
            display: grid;
            gap: 0.4rem;
          }
          .contact-field label {
            color: var(--primary);
            font-size: 0.85rem;
            font-weight: 600;
          }
          .contact-field input,
          .contact-field textarea {
            width: 100%;
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-md);
            background: var(--bg-canvas);
            color: var(--text-primary);
            font: inherit;
            padding: 0.75rem 0.85rem;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .contact-field textarea {
            min-height: 130px;
            resize: vertical;
          }
          .contact-field input:focus,
          .contact-field textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(201, 165, 116, 0.18);
          }
          .contact-field input[aria-invalid="true"],
          .contact-field textarea[aria-invalid="true"] {
            border-color: var(--status-occupied);
          }
          .contact-error {
            color: var(--status-occupied);
            font-size: 0.78rem;
          }
          .contact-status {
            display: flex;
            align-items: flex-start;
            gap: 0.55rem;
            padding: 0.8rem 0.9rem;
            border-radius: var(--radius-md);
            font-size: 0.86rem;
            line-height: 1.45;
          }
          .contact-status.success {
            color: var(--status-available);
            background: var(--status-available-bg);
          }
          .contact-status.error {
            color: var(--status-occupied);
            background: var(--status-occupied-bg);
          }
          .contact-map {
            width: 100%;
            height: 330px;
            display: block;
            border: 0;
            border-radius: var(--radius-md);
          }
          .contact-location {
            display: grid;
            gap: 1rem;
            margin-top: 1.25rem;
          }
          .contact-detail {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
          }
          .contact-detail svg {
            flex: 0 0 auto;
            color: var(--accent-hover);
            margin-top: 0.15rem;
          }
          .contact-detail a {
            color: inherit;
            text-decoration: underline;
            text-decoration-color: var(--border-accent);
            text-underline-offset: 3px;
          }
          .contact-detail a:hover {
            color: var(--primary);
          }
          .contact-directions {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            margin-top: 1.5rem;
            color: var(--accent-hover);
            font-size: 0.9rem;
            font-weight: 700;
          }
          .contact-directions:hover {
            color: var(--primary);
          }
          @media (max-width: 820px) {
            .contact-layout {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 560px) {
            .contact-intro {
              padding: 3rem 0 2rem;
              text-align: left;
            }
            .contact-panel {
              padding: 1.25rem;
            }
            .contact-map {
              height: 270px;
            }
          }
        `}</style>

        <section className="contact-intro">
          <div className="container">
            <div className="divider-gold" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ marginBottom: '0.8rem' }}>Contact Us</h1>
            <p>
              Have a question about Quiet Desk? We're here to help with seat bookings, membership packages,
              study room information, availability, and anything else you need to plan a focused visit.
            </p>
          </div>
        </section>

        <section className="container contact-layout" aria-label="Contact Quiet Desk">
          <div className="contact-panel">
            <h2>Send an inquiry</h2>
            <p>Tell us a little about what you need, and the Quiet Desk team will respond soon.</p>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-field">
                <label htmlFor="name">Name</label>
                <input {...fieldProps('name')} type="text" placeholder="Enter your name" autoComplete="name" />
                {errors.name && <span className="contact-error" id="name-error">{errors.name}</span>}
              </div>
              <div className="contact-field">
                <label htmlFor="email">Email</label>
                <input {...fieldProps('email')} type="email" placeholder="Enter your email" autoComplete="email" />
                {errors.email && <span className="contact-error" id="email-error">{errors.email}</span>}
              </div>
              <div className="contact-field">
                <label htmlFor="phone">Phone</label>
                <input {...fieldProps('phone')} type="tel" placeholder="Enter your phone number" autoComplete="tel" />
                {errors.phone && <span className="contact-error" id="phone-error">{errors.phone}</span>}
              </div>
              <div className="contact-field">
                <label htmlFor="message">Message</label>
                <textarea {...fieldProps('message')} placeholder="How can we help you?" rows="5" />
                {errors.message && <span className="contact-error" id="message-error">{errors.message}</span>}
              </div>
              {submission.status !== 'idle' && submission.status !== 'submitting' && (
                <div className={`contact-status ${submission.status}`} role="status">
                  {submission.status === 'success' ? <CheckCircle2 size={18} /> : <MessageSquare size={18} />}
                  <span>{submission.message}</span>
                </div>
              )}
              <button className="btn btn-primary" type="submit" disabled={submission.status === 'submitting'}>
                {submission.status === 'submitting' ? 'Sending...' : 'Send Message'}
                {submission.status !== 'submitting' && <ArrowRight size={17} />}
              </button>
            </form>
          </div>

          <div className="contact-panel">
            <h2>Find Quiet Desk</h2>
            <p>Visit our Lazimpat study room and find a calm place to make progress.</p>
            <iframe
              className="contact-map"
              title="The Quiet Desk Study Room on Google Maps"
              src="https://www.google.com/maps?q=The+Quiet+Desk+(Study+Room)&ll=27.7205737,85.3188648&z=17&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="contact-location">
              <div className="contact-detail">
                <MapPin size={18} />
                <span>Lazimpat Road (Near Standard Chartered Bank), Kathmandu 44600</span>
              </div>
              <div className="contact-detail">
                <Phone size={18} />
                <a href="tel:+9779764826810">9764826810</a>
              </div>
              <div className="contact-detail">
                <Mail size={18} />
                <a href="mailto:thequiettdesk83@gmail.com">thequiettdesk83@gmail.com</a>
              </div>
              <div className="contact-detail">
                <Clock size={18} />
                <span>6:00 AM - 9:00 PM, seven days a week</span>
              </div>
            </div>
            <a
              className="contact-directions"
              href="https://maps.app.goo.gl/vZY5YC7h85T5UzkN9"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get directions to The Quiet Desk Study Room"
            >
              Get Directions <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
