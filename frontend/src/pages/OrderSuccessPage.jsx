import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useCart } from '../providers/CartProvider.jsx';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const lookupToken = searchParams.get('lookupToken') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let active = true;
    let intervalId = null;

    const fetchOrder = async () => {
      if (!orderId || !lookupToken) {
        if (active) {
          setError('Missing order verification token.');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await api(`/orders/${orderId}?lookupToken=${encodeURIComponent(lookupToken)}`);
        if (!active) return;
        setOrder(data.order);
        setError('');
        setLoading(false);

        if (data.order?.status === 'paid') {
          clearCart();
        }
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Unable to verify order status.');
        setLoading(false);
      }
    };

    setLoading(true);
    void fetchOrder();

    intervalId = setInterval(() => {
      if (order?.status === 'paid') return;
      void fetchOrder();
    }, 4000);

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, lookupToken, clearCart, order?.status]);

  const status = order?.status || 'pending';
  const trackingId = order?.trackingId || `TF-LEGACY-${orderId?.slice(-6).toUpperCase()}`;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6 lg:px-8">
      <div className="rounded-[2.5rem] border border-black/8 bg-white/80 p-10 backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-electric">Order Status</p>
        <h1 className="mt-4 font-display text-5xl font-bold">
          {loading ? 'Verifying payment...' : status === 'paid' ? 'Payment Confirmed' : 'Payment Processing'}
        </h1>
        <p className="mt-4 text-ink/70">
          Tracking ID: <span className="font-bold">{trackingId}</span>
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-black/55">Current status: {status}</p>
        {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-black/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em]"
          >
            Retry Status Check
          </button>
          <Link to="/dashboard" className="rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-paper">
            View Dashboard
          </Link>
          <Link to="/checkout" className="rounded-full border border-black/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em]">
            Back to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
