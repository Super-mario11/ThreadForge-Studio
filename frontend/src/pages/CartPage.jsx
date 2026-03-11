import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import SectionTitle from '../components/SectionTitle.jsx';
import { currency } from '../lib/format.js';
import { useCart } from '../providers/CartProvider.jsx';
import { useToast } from '../providers/ToastProvider.jsx';

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const toast = useToast();
  const shipping = subtotal > 100 ? 0 : 9;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Cart"
        title="Review the pieces before production"
        description="One last look before checkout."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.length ? (
            items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-[2rem] border border-black/8 bg-white/80 p-5 backdrop-blur sm:flex-row">
                <img src={item.previewUrl} alt={item.name} className="h-36 w-full rounded-[1.5rem] object-cover sm:w-36" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-bold">{item.name}</h3>
                      <p className="mt-2 text-sm text-black/60">
                        Size {item.variant.size} · {item.variant.color}
                      </p>
                      <p className="mt-2 text-sm text-black/50">{item.customization.prompt}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeItem(item.id);
                        toast.info({ title: 'Removed', description: item.name });
                      }}
                      className="text-black/45 transition hover:text-crimson"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-paper px-3 py-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="rounded-full border border-black/10 bg-white/70 p-2 text-black/60 transition hover:text-ink disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-full border border-black/10 bg-white/70 p-2 text-black/60 transition hover:text-ink"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-lg font-bold">{currency(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/50 p-10 text-center">
              <p className="font-display text-3xl font-bold">Your cart is empty</p>
              <Link to="/studio" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-paper">
                Build a Design
              </Link>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-[2rem] border border-black/8 bg-ink p-6 text-paper shadow-glow">
          <h3 className="font-display text-3xl font-bold">Summary</h3>
          <div className="mt-6 space-y-3 text-sm text-paper/75">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{currency(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{currency(tax)}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-between border-t border-white/10 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{currency(total)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block rounded-full bg-accent-gradient px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-white shadow-glow transition hover:-translate-y-0.5 active:scale-[0.99]"
            onClick={() => {
              if (!items.length) return;
              toast.info({ title: 'Checkout', description: 'Confirm shipping details and place the order.' });
            }}
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
