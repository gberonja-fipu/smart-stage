import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type }]); // max 5 visible
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast mora biti unutar ToastProvider');
  return ctx.addToast;
}

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

function ToastItem({ toast, onRemove }) {
  const ref = useRef(null);

  // Mark entering → triggers CSS enter animation
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (ref.current) ref.current.classList.add('toast--in');
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => dismiss(), 3000);
    return () => clearTimeout(t);
  }, [toast.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    if (!ref.current) return;
    ref.current.classList.remove('toast--in');
    ref.current.classList.add('toast--out');
    setTimeout(() => onRemove(toast.id), 280);
  }

  return (
    <div
      ref={ref}
      className={`toast toast--${toast.type}`}
      onClick={dismiss}
      role="alert"
    >
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
    </div>
  );
}
