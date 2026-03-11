import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

const variants = {
  info: 'border-ink/12 bg-white/85 text-ink',
  success: 'border-electric/35 bg-white/85 text-ink',
  error: 'border-crimson/35 bg-white/85 text-ink'
};

function createToast({ title, description, variant = 'info', durationMs = 3200 }) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    variant,
    durationMs
  };
}

export function ToastProvider({ children }) {
  const shouldReduceMotion = useReducedMotion();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast) => {
      setToasts((current) => [toast, ...current].slice(0, 4));

      if (toast.durationMs > 0) {
        const timer = setTimeout(() => dismiss(toast.id), toast.durationMs);
        timersRef.current.set(toast.id, timer);
      }

      return toast.id;
    },
    [dismiss]
  );

  const api = useMemo(() => {
    return {
      toast: {
        info(payload) {
          return push(createToast({ ...payload, variant: 'info' }));
        },
        success(payload) {
          return push(createToast({ ...payload, variant: 'success' }));
        },
        error(payload) {
          return push(createToast({ ...payload, variant: 'error', durationMs: 4200 }));
        },
        dismiss
      }
    };
  }, [dismiss, push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6">
        <div className="w-full max-w-sm space-y-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto overflow-hidden rounded-[1.5rem] border p-4 shadow-2xl shadow-black/10 backdrop-blur ${variants[toast.variant] || variants.info}`}
                role={toast.variant === 'error' ? 'alert' : 'status'}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-black/55">{toast.title}</p>
                    {toast.description ? <p className="mt-2 text-sm text-black/65">{toast.description}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="rounded-full border border-black/10 bg-white/70 p-2 text-black/60 transition hover:text-ink"
                    aria-label="Dismiss notification"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
