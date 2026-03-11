import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { currency } from '../lib/format.js';

export default function ProductQuickView({ product, open, onClose }) {
  const shouldReduceMotion = useReducedMotion();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  const sizes = product?.sizes || [];
  const colors = product?.colors || [];

  useEffect(() => {
    if (!open) return;
    setSize(sizes[0] || '');
    setColor(colors[0] || '');
  }, [open, sizes, colors]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const customizationState = useMemo(() => {
    if (!product) return null;
    return {
      product,
      preset: { size, color }
    };
  }, [product, size, color]);

  return (
    <AnimatePresence>
      {open && product ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center px-4 py-6 sm:items-center sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur"
            onClick={onClose}
            aria-label="Close dialog"
            initial={false}
          />

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-ink/12 bg-paper shadow-2xl shadow-ink/20"
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} quick view`}
          >
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-white/80">
                <img src={product.imageUrl} alt={product.name} className="h-72 w-full object-cover sm:h-full" />
                <div className="absolute left-4 top-4 rounded-full bg-paper/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
                  {product.category}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-electric">Quick view</p>
                    <h2 className="mt-3 font-display text-4xl font-bold leading-tight">{product.name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-black/10 bg-white/70 p-3 text-black/60 transition hover:text-ink"
                    aria-label="Close quick view"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="mt-4 text-black/65">{product.description}</p>
                <p className="mt-6 text-2xl font-bold">{currency(product.basePrice)}</p>

                <div className="mt-8 space-y-5">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">Size</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sizes.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSize(option)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                            size === option ? 'bg-ink text-paper' : 'border border-black/10 bg-white/80 hover:-translate-y-0.5'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">Color</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colors.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setColor(option)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                            color === option ? 'bg-ink text-paper' : 'border border-black/10 bg-white/80 hover:-translate-y-0.5'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <Link
                    to="/studio"
                    state={customizationState}
                    onClick={onClose}
                    className="rounded-full bg-accent-gradient px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-glow transition hover:-translate-y-1 active:scale-[0.99]"
                  >
                    Customize in Studio
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-black/10 bg-white/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] transition hover:-translate-y-1"
                  >
                    Keep browsing
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
