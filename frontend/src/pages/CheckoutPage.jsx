import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle.jsx';
import { api } from '../lib/api.js';
import { currency } from '../lib/format.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useCart } from '../providers/CartProvider.jsx';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States'
  });
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const shipping = subtotal > 100 ? 0 : 9;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = subtotal + shipping + tax;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const data = await api('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          email,
          items,
          shippingAddress: address
        })
      });

      if (data.clientSecret === 'offline-demo') {
        await api(`/orders/${data.orderId}/confirm-offline`, {
          method: 'POST'
        });
      }

      clearCart();
      navigate(`/order-success/${data.orderId}`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Checkout"
        title="Ship the finished pieces"
        description="Enter shipping details."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email" value={email} onChange={setEmail} type="email" />
            <Input label="Full Name" value={address.fullName} onChange={(value) => setAddress((current) => ({ ...current, fullName: value }))} />
            <div className="md:col-span-2">
              <Input label="Address Line 1" value={address.line1} onChange={(value) => setAddress((current) => ({ ...current, line1: value }))} />
            </div>
            <div className="md:col-span-2">
              <Input label="Address Line 2" value={address.line2} onChange={(value) => setAddress((current) => ({ ...current, line2: value }))} />
            </div>
            <Input label="City" value={address.city} onChange={(value) => setAddress((current) => ({ ...current, city: value }))} />
            <Input label="State" value={address.state} onChange={(value) => setAddress((current) => ({ ...current, state: value }))} />
            <Input label="Postal Code" value={address.postalCode} onChange={(value) => setAddress((current) => ({ ...current, postalCode: value }))} />
            <Input label="Country" value={address.country} onChange={(value) => setAddress((current) => ({ ...current, country: value }))} />
          </div>
          <button
            type="submit"
            disabled={submitting || !items.length}
            className="mt-6 w-full rounded-full bg-accent-gradient px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-glow transition hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Pay and Place Order'}
          </button>
          {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}
        </form>

        <aside className="h-fit rounded-[2rem] border border-black/8 bg-paper p-6">
          <h3 className="font-display text-3xl font-bold">Order Total</h3>
          <div className="mt-6 space-y-3 text-sm text-black/60">
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
          <div className="mt-6 flex justify-between border-t border-black/10 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{currency(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.25rem] border border-black/10 bg-paper px-4 py-3 outline-none"
      />
    </label>
  );
}
