import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../providers/CartProvider.jsx';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Collection' },
  { to: '/studio', label: 'Studio' },
  { to: '/dashboard', label: 'Dashboard' }
];

export default function Shell({ children }) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { items } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = items.length;

  const mobileNav = navigation;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent-gradient p-2 text-white shadow-glow">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-display text-lg font-bold">ThreadForge</p>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Studio Store</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition ${isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-full border border-ink/12 bg-white/80 p-3 transition hover:-translate-y-0.5 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <Link to="/auth" className="rounded-full border border-ink/12 p-3 transition hover:-translate-y-0.5">
              <User size={18} />
            </Link>
            <Link to="/cart" className="relative rounded-full bg-ink p-3 text-paper shadow-glow">
              <ShoppingBag size={18} />
              <motion.span
                key={cartCount}
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="absolute -right-1 -top-1 rounded-full bg-accent-gradient px-1.5 py-0.5 text-[10px] font-bold text-white"
                aria-label={`${cartCount} items in cart`}
              >
                {cartCount}
              </motion.span>
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute left-4 right-4 top-4 overflow-hidden rounded-[2.5rem] border border-black/10 bg-paper shadow-2xl shadow-black/20"
            >
              <div className="flex items-center justify-between gap-4 border-b border-black/8 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-electric">Menu</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-black/10 bg-white/70 p-3 text-black/60 transition hover:text-ink"
                  aria-label="Close menu panel"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5">
                <nav className="space-y-2">
                  {mobileNav.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block rounded-[1.5rem] border px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] transition ${
                          isActive ? 'border-electric/30 bg-white text-ink' : 'border-black/8 bg-white/70 text-black/70'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    to="/auth"
                    className="rounded-[1.5rem] border border-black/10 bg-white/80 px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.2em] transition hover:-translate-y-0.5"
                  >
                    Account
                  </Link>
                  <Link
                    to="/cart"
                    className="rounded-[1.5rem] bg-ink px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-paper shadow-glow transition hover:-translate-y-0.5"
                  >
                    Cart ({cartCount})
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {children}
      </motion.main>
    </div>
  );
}
