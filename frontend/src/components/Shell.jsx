import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, User } from 'lucide-react';
import { useCart } from '../providers/CartProvider.jsx';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Collection' },
  { to: '/studio', label: 'Studio' },
  { to: '/dashboard', label: 'Dashboard' }
];

export default function Shell({ children }) {
  const { items } = useCart();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-paper/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-ink p-2 text-paper">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-display text-lg font-bold">ThreadForge</p>
              <p className="text-xs uppercase tracking-[0.3em] text-black/45">Studio Store</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition ${isActive ? 'text-ink' : 'text-black/55 hover:text-ink'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/auth" className="rounded-full border border-black/10 p-3 transition hover:-translate-y-0.5">
              <User size={18} />
            </Link>
            <Link to="/cart" className="relative rounded-full bg-ink p-3 text-paper shadow-glow">
              <ShoppingBag size={18} />
              <span className="absolute -right-1 -top-1 rounded-full bg-electric px-1.5 py-0.5 text-[10px] font-bold">
                {items.length}
              </span>
            </Link>
          </div>
        </div>
      </header>

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
