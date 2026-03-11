import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { currency } from '../lib/format.js';

export default function ProductCard({ product, onQuickView }) {
  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      className="group overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70 shadow-lg shadow-ink/5 backdrop-blur"
    >
      <div className="relative h-72 overflow-hidden">
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <div className="absolute left-4 top-4 rounded-full bg-paper/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
          {product.category}
        </div>
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2 opacity-100 transition md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="rounded-full border border-ink/12 bg-paper/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur transition hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Quick view
            </button>
          ) : null}
          <Link
            to="/studio"
            state={{ product }}
            className="rounded-full bg-accent-gradient px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-glow transition hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Customize
          </Link>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold">{product.name}</h3>
            <p className="mt-2 text-sm text-black/60">{product.description}</p>
          </div>
          <ArrowUpRight className="mt-1 text-electric" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">{currency(product.basePrice)}</p>
          <div className="flex gap-2">
            {product.colors.slice(0, 3).map((color) => (
              <span key={color} className="rounded-full border border-black/10 px-2 py-1 text-xs">
                {color}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
