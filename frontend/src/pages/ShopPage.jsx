import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import SectionTitle from '../components/SectionTitle.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductCardSkeleton from '../components/ProductCardSkeleton.jsx';
import ProductQuickView from '../components/ProductQuickView.jsx';
import { useProducts } from '../queries/useProducts.js';

const categories = ['All', 'Regular Fit'];
const sizes = ['All', 'S', 'M', 'L', 'XL'];
const colors = ['All', 'Black', 'White'];
const sorts = [
  { label: 'Featured', value: 'featured' },
  { label: 'Popularity', value: 'popularity' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' }
];

export default function ShopPage() {
  const shouldReduceMotion = useReducedMotion();
  const [filters, setFilters] = useState({
    category: 'All',
    size: 'All',
    color: 'All',
    sort: 'featured'
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const { products, loading } = useProducts(filters);

  const hasActiveFilters = filters.category !== 'All' || filters.size !== 'All' || filters.color !== 'All';

  const clearFilters = () => {
    setFilters((current) => ({ ...current, category: 'All', size: 'All', color: 'All' }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Collection"
        title="T-Shirt Collection"
        description="Choose black or white and jump into the studio."
      />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="btn-outline flex items-center gap-2"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="btn-outline bg-paper"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur lg:block">
          <FilterPanel filters={filters} setFilters={setFilters} />
        </aside>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <ProductCardSkeleton key={index} />)
            : products.map((product) => (
                <ProductCard key={product.slug} product={product} onQuickView={setQuickView} />
              ))}
        </div>
      </div>

      <MobileFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        shouldReduceMotion={shouldReduceMotion}
      />

      <ProductQuickView
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}

function FilterGroup({ label, options, active, onChange }) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-black/45">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
              active === option ? 'bg-ink text-paper' : 'border border-black/10 bg-white/90 hover:-translate-y-0.5'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterPanel({ filters, setFilters }) {
  return (
    <div className="space-y-6">
      <FilterGroup label="Category" options={categories} active={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
      <FilterGroup label="Size" options={sizes} active={filters.size} onChange={(value) => setFilters((current) => ({ ...current, size: value }))} />
      <FilterGroup label="Color" options={colors} active={filters.color} onChange={(value) => setFilters((current) => ({ ...current, color: value }))} />

      <label className="block">
        <span className="mb-3 block text-sm font-bold uppercase tracking-[0.25em] text-black/45">Sort</span>
        <select
          value={filters.sort}
          onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
          className="w-full rounded-2xl border border-black/10 bg-paper px-4 py-3 outline-none"
        >
          {sorts.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function MobileFilters({
  open,
  onClose,
  filters,
  setFilters,
  hasActiveFilters,
  clearFilters,
  shouldReduceMotion
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[65] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur"
            onClick={onClose}
            aria-label="Close filters"
          />
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-x-4 bottom-4 max-h-[80vh] overflow-auto rounded-[2.5rem] border border-black/10 bg-paper p-6 shadow-2xl shadow-black/20"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-electric">Filters</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 bg-white/70 p-3 text-black/60 transition hover:text-ink"
                aria-label="Close filters panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6">
              <FilterPanel filters={filters} setFilters={setFilters} />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-ink px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-paper"
              >
                View results
              </button>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-black/10 bg-white/80 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em]"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
