import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Shirt, Truck, Wand2 } from 'lucide-react';
import SectionTitle from '../components/SectionTitle.jsx';
import TshirtPreview from '../components/TshirtPreview.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductCardSkeleton from '../components/ProductCardSkeleton.jsx';
import ProductQuickView from '../components/ProductQuickView.jsx';
import { testimonials } from '../data/prompts.js';
import { useFeaturedProducts } from '../queries/useProducts.js';
import { useState } from 'react';

const features = [
  { icon: Wand2, title: 'AI Generator', text: 'Prompt → artwork in seconds.' },
  { icon: Shirt, title: 'Premium Blanks', text: 'Clean fit. Crisp prints.' },
  { icon: Truck, title: 'Quick Shipping', text: 'Trackable delivery.' }
];

export default function HomePage() {
  const [quickView, setQuickView] = useState(null);
  const { products, loading } = useFeaturedProducts();

  return (
    <div className="pb-20">
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/65 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-electric"
          >
            <Sparkles size={16} />
            AI Fashion Studio
          </motion.p>
          <h1 className="max-w-2xl font-display text-5xl font-bold tracking-tight sm:text-7xl">
            Design. Print. Wear.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/70 sm:text-xl">Create a custom tee in minutes.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/studio"
              className="btn-primary"
            >
              Start Designing
            </Link>
            <Link
              to="/shop"
              className="btn-secondary"
            >
              Explore Collection
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <TshirtPreview color="#fefefe" artwork="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" title="Rotating Mockup" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="rounded-[2rem] border border-black/8 bg-white/75 p-6 shadow-lg shadow-black/5 backdrop-blur"
          >
            <feature.icon className="text-electric" />
            <h3 className="mt-5 font-display text-2xl font-bold">{feature.title}</h3>
            <p className="mt-3 text-black/60">{feature.text}</p>
          </motion.div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Featured"
          title="Pick a blank, then customize"
          description="Fast picks for quick demos."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />)
            : products.map((product) => (
                <ProductCard key={product.slug} product={product} onQuickView={setQuickView} />
              ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Proof"
          title="Simple, smooth, and fun"
          description="From prompt to checkout with fewer steps."
          align="center"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur"
            >
              <p className="text-lg leading-8 text-black/70">“{item.text}”</p>
              <p className="mt-6 font-bold">{item.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-7xl border-t border-black/8 px-4 py-10 text-sm text-black/55 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ThreadForge Studio</p>
          <div className="flex flex-wrap gap-5">
            <a href="#social">Instagram</a>
            <a href="#social">TikTok</a>
            <a href="#contact">Contact</a>
            <a href="#policy">Policies</a>
          </div>
        </div>
      </footer>

      <ProductQuickView
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}
