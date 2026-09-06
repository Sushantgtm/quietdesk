import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export const Toast = ({ notification, onDismiss }) => {
  const Icon = icons[notification.type] || Info;

  return (
    <div className={`notification-toast notification-toast-${notification.type}`} role={notification.type === 'error' ? 'alert' : 'status'}>
      <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
      <div className="notification-toast-content">
        {notification.title && <strong>{notification.title}</strong>}
        <p>{notification.message}</p>
      </div>
      <button className="notification-close" type="button" onClick={() => onDismiss(notification.id)} aria-label="Dismiss notification">
        <X size={17} />
      </button>
    </div>
  );
};
