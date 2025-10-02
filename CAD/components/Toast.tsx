import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { SuccessIcon, ErrorIcon, InfoIcon, CloseIcon } from './icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Array<(toasts: ToastMessage[]) => void> = [];

const toastStore = {
  toasts: [] as ToastMessage[],
  addToast(message: string, type: ToastType) {
    if (this.toasts.some(t => t.message === message)) return;
    this.toasts = [...this.toasts, { id: toastId++, message, type }];
    this.emitChange();
  },
  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.emitChange();
  },
  subscribe(listener: (toasts: ToastMessage[]) => void) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
  emitChange() {
    for (const listener of listeners) {
      listener(this.toasts);
    }
  },
};

export const toast = {
  success: (message: string) => toastStore.addToast(message, 'success'),
  error: (message: string) => toastStore.addToast(message, 'error'),
  info: (message: string) => toastStore.addToast(message, 'info'),
};

const Toast: React.FC<ToastMessage & { onRemove: (id: number) => void }> = ({ id, message, type, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleManualRemove = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(id), 300);
    }, 4000);

    return () => {
      if(timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id, onRemove]);

  const typeDetails = {
    success: {
      barColor: 'bg-[var(--color-success)]',
      icon: <SuccessIcon className="w-5 h-5 text-[var(--color-success)]" />,
    },
    error: {
      barColor: 'bg-[var(--color-error)]',
      icon: <ErrorIcon className="w-5 h-5 text-[var(--color-error)]" />,
    },
    info: {
      barColor: 'bg-[var(--color-info)]',
      icon: <InfoIcon className="w-5 h-5 text-[var(--color-info)]" />,
    },
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex items-center w-80 p-3 rounded-lg shadow-lg bg-[var(--color-panel)]/80 backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${isExiting ? 'opacity-0 translate-x-[calc(100%+2rem)]' : 'opacity-100 translate-x-0'}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeDetails.barColor}`}></div>
      <div className="flex-shrink-0 mx-3">{typeDetails.icon}</div>
      <div className="flex-1 text-sm text-[var(--color-text-primary)]">{message}</div>
      <button
        onClick={handleManualRemove}
        aria-label="Dismiss notification"
        className="absolute top-1 right-1 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState(toastStore.toasts);

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(setToasts);
    return () => unsubscribe();
  }, []);

  const handleRemove = useCallback((id: number) => {
    toastStore.removeToast(id);
  }, []);

  // Use a different key for the portal's container to ensure it's unique
  const portalKey = 'toast-portal-container';
  let portalRoot = document.getElementById(portalKey);
  if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = portalKey;
      document.body.appendChild(portalRoot);
  }

  return ReactDOM.createPortal(
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onRemove={handleRemove} />
      ))}
    </div>,
    portalRoot
  );
};

export default ToastContainer;