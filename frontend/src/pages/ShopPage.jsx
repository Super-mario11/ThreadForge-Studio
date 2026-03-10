import { useState } from 'react';
import SectionTitle from '../components/SectionTitle.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useProducts } from '../queries/useProducts.js';

const categories = ['All', 'Oversized T-Shirts', 'Regular Fit', 'Hoodies', 'Polo', 'Custom Collection'];
const sizes = ['All', 'S', 'M', 'L', 'XL'];
const colors = ['All', 'Black', 'White', 'Off White', 'Cobalt', 'Crimson', 'Navy'];
const sorts = [
  { label: 'Featured', value: 'featured' },
  { label: 'Popularity', value: 'popularity' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' }
];

export default function ShopPage() {
  const [filters, setFilters] = useState({
    category: 'All',
    size: 'All',
    color: 'All',
    sort: 'featured'
  });
  const { products } = useProducts(filters);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Collection"
        title="Fashion-first blanks built for custom printing"
        description="Filter by fit, color, and price, then move straight into the design studio with the product that fits the idea."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur">
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
        </aside>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
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
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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
