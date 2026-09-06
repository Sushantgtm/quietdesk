import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Toast } from './Toast';

export const NotificationContainer = ({ notifications, confirmation, onDismiss, onConfirm, onCancel }) => (
  <>
    <div className="notification-container" aria-live="polite" aria-atomic="false">
      {notifications.map(notification => (
        <Toast key={notification.id} notification={notification} onDismiss={onDismiss} />
      ))}
    </div>
    <ConfirmDialog confirmation={confirmation} onConfirm={onConfirm} onCancel={onCancel} />
  </>
);
