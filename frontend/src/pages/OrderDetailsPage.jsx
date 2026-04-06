import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle.jsx';
import { api } from '../lib/api.js';
import { currency, formatDate } from '../lib/format.js';
import { useAuth } from '../providers/AuthProvider.jsx';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!orderId) {
      setFetching(false);
      setError('Order ID is missing.');
      return;
    }

    setFetching(true);
    setError('');

    api(`/orders/${orderId}`)
      .then((data) => {
        if (!active) return;
        setOrder(data.order || null);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Unable to load order details.');
      })
      .finally(() => {
        if (!active) return;
        setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const trackingId = useMemo(() => {
    if (!orderId) return '';
    return order?.trackingId || `TF-LEGACY-${orderId.slice(-6).toUpperCase()}`;
  }, [order?.trackingId, orderId]);

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle
          eyebrow="Order Summary"
          title={fetching ? 'Loading your order' : trackingId || 'Order details'}
          description="Images, shipping summary, and payment status."
        />
        <Link
          to="/dashboard"
          className="rounded-full border border-black/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em]"
        >
          Back to Dashboard
        </Link>
      </div>

      {error ? <p className="mt-6 text-sm text-crimson">{error}</p> : null}

      {fetching ? (
        <p className="mt-6 text-black/60">Loading order details...</p>
      ) : order ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur">
            <h3 className="font-display text-3xl font-bold">Items</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(order.items || []).map((item, index) => (
                <article key={`${item.productId}-${index}`} className="rounded-[1.5rem] border border-black/8 bg-paper p-4">
                  <img
                    src={item.previewUrl}
                    alt={item.name || 'Order item'}
                    className="h-44 w-full rounded-[1rem] object-cover"
                  />
                  <h4 className="mt-3 font-display text-xl font-bold">{item.name || 'Custom Tee'}</h4>
                  <p className="mt-1 text-sm text-black/60">
                    Size {item.variant?.size || 'M'} | {item.variant?.color || 'Black'}
                  </p>
                  <p className="mt-1 text-sm text-black/60">Qty {item.quantity}</p>
                  <p className="mt-2 text-sm font-semibold">{currency(item.unitPrice || 0)} each</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-black/8 bg-ink p-6 text-paper">
            <h3 className="font-display text-3xl font-bold">Summary</h3>
            <div className="mt-6 space-y-2 text-sm">
              <p>
                Tracking ID: <span className="font-bold">{trackingId}</span>
              </p>
              <p className="uppercase tracking-[0.18em] text-paper/70">Status: {order.status}</p>
              <p>Placed on: {formatDate(order.createdAt)}</p>
            </div>

            <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currency(order.amountSubtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{currency(order.amountShipping || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{currency(order.amountTax || 0)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-base font-bold">
                <span>Total</span>
                <span>{currency(order.amountTotal || 0)}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 text-sm text-paper/80">
              <p className="font-semibold">Shipping Address</p>
              <p className="mt-2">{order.shippingAddress?.fullName || '-'}</p>
              <p>{order.shippingAddress?.line1 || '-'}</p>
              {order.shippingAddress?.line2 ? <p>{order.shippingAddress.line2}</p> : null}
              <p>
                {[order.shippingAddress?.city, order.shippingAddress?.state]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
              <p>
                {[order.shippingAddress?.postalCode, order.shippingAddress?.country]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <p className="mt-6 text-black/60">Order not found.</p>
      )}
    </div>
  );
}
