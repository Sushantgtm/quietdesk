import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDialog = ({ confirmation, onConfirm, onCancel }) => {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!confirmation) return undefined;
    confirmButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmation, onCancel]);

  if (!confirmation) return null;

  return (
    <div className="notification-confirm-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="notification-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="notification-confirm-title" aria-describedby="notification-confirm-message">
        <div className="notification-confirm-icon"><AlertTriangle size={24} /></div>
        <button className="notification-close notification-confirm-close" type="button" onClick={onCancel} aria-label="Close confirmation dialog">
          <X size={18} />
        </button>
        <h2 id="notification-confirm-title">{confirmation.title}</h2>
        <p id="notification-confirm-message">{confirmation.message}</p>
        <div className="notification-confirm-actions">
          <button className="btn btn-outline" type="button" onClick={onCancel}>{confirmation.cancelText}</button>
          <button ref={confirmButtonRef} className={`btn ${confirmation.destructive ? 'notification-confirm-danger' : 'btn-secondary'}`} type="button" onClick={onConfirm}>{confirmation.confirmText}</button>
        </div>
      </section>
    </div>
  );
};
