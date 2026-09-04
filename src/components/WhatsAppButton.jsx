import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const WHATSAPP_URL = "https://wa.me/9779764826810?text=Hello%20Quiet%20Desk%2C%20I%27d%20like%20to%20know%20more%20about%20booking%20a%20seat.";

export const WhatsAppButton = () => {
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <style>{`
        .whatsapp-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          color: #fff;
          background: #25d366;
          border-radius: 50%;
          box-shadow: 0 5px 16px rgba(21, 27, 46, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        .whatsapp-fab:hover {
          background: #20bd5b;
          transform: scale(1.06);
          box-shadow: 0 8px 22px rgba(21, 27, 46, 0.26);
        }

        .whatsapp-fab:focus-visible {
          outline: 3px solid var(--accent);
          outline-offset: 4px;
        }

        .whatsapp-fab-icon {
          width: 29px;
          height: 29px;
        }

        .whatsapp-fab-tooltip {
          position: absolute;
          right: calc(100% + 12px);
          top: 50%;
          padding: 0.45rem 0.7rem;
          color: var(--text-inverse);
          background: var(--primary);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-50%) translateX(4px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .whatsapp-fab:hover .whatsapp-fab-tooltip,
        .whatsapp-fab:focus-visible .whatsapp-fab-tooltip {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        @media (max-width: 768px) {
          .whatsapp-fab {
            right: 16px;
            bottom: calc(16px + env(safe-area-inset-bottom));
            width: 52px;
            height: 52px;
          }

          .whatsapp-fab-icon {
            width: 27px;
            height: 27px;
          }

          .whatsapp-fab-tooltip {
            display: none;
          }
        }
      `}</style>

      <a
        className="whatsapp-fab"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Quiet Desk on WhatsApp"
      >
        <FaWhatsapp className="whatsapp-fab-icon" aria-hidden="true" />
        <span className="whatsapp-fab-tooltip" role="tooltip">
          Chat with us on WhatsApp
        </span>
      </a>
    </>
  );
};
