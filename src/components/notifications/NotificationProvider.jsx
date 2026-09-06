import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationContainer } from './NotificationContainer';

export const NotificationContext = createContext(null);

const DEFAULT_DURATION = 4000;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const confirmationRef = useRef(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setNotifications(current => current.filter(notification => notification.id !== id));
  }, []);

  const notify = useCallback(({ type = 'info', title = '', message, duration = DEFAULT_DURATION }) => {
    const id = ++nextId.current;
    setNotifications(current => [...current, { id, type, title, message: String(message || ''), duration }]);
    if (duration > 0) window.setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((message, options = {}) => notify({ ...options, type: 'success', message }), [notify]);
  const error = useCallback((message, options = {}) => notify({ ...options, type: 'error', message }), [notify]);
  const warning = useCallback((message, options = {}) => notify({ ...options, type: 'warning', message }), [notify]);
  const info = useCallback((message, options = {}) => notify({ ...options, type: 'info', message }), [notify]);

  const cancelConfirmation = useCallback(() => {
    confirmationRef.current?.resolve(false);
    confirmationRef.current = null;
    setConfirmation(null);
  }, []);

  const confirm = useCallback((options = {}) => new Promise(resolve => {
    confirmationRef.current = { resolve };
    setConfirmation({
      title: options.title || 'Please confirm',
      message: options.message || 'Are you sure you want to continue?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      destructive: Boolean(options.destructive)
    });
  }), []);

  const resolveConfirmation = useCallback((confirmed) => {
    confirmationRef.current?.resolve(confirmed);
    confirmationRef.current = null;
    setConfirmation(null);
  }, []);

  useEffect(() => () => {
    confirmationRef.current?.resolve(false);
  }, []);

  const value = useMemo(() => ({ notify, success, error, warning, info, confirm }), [notify, success, error, warning, info, confirm]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        confirmation={confirmation}
        onDismiss={dismiss}
        onConfirm={() => resolveConfirmation(true)}
        onCancel={cancelConfirmation}
      />
    </NotificationContext.Provider>
  );
};
