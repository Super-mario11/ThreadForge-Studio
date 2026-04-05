import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SectionTitle from '../components/SectionTitle.jsx';
import { api } from '../lib/api.js';
import { currency } from '../lib/format.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useCart } from '../providers/CartProvider.jsx';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const buildIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildSuccessPath = (orderId, lookupToken) =>
  `/order-success/${orderId}?lookupToken=${encodeURIComponent(lookupToken)}`;

const buildStripeReturnUrl = (orderId, lookupToken) =>
  `${window.location.origin}/#${buildSuccessPath(orderId, lookupToken)}`;

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal } = useCart();
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [email, setEmail] = useState(user?.email || '');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState({
    subtotal,
    shipping: 0,
    tax: 0,
    total: subtotal,
    meta: { currency: 'INR' }
  });
  const [idempotencyKey, setIdempotencyKey] = useState(() => buildIdempotencyKey());
  const [orderSession, setOrderSession] = useState(null);

  useEffect(() => {
    if (!items.length) {
      setQuote({
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        meta: { currency: 'INR' }
      });
      return;
    }

    let active = true;
    setQuoteLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await api('/orders/quote', {
          method: 'POST',
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity
            })),
            shippingAddress: {
              state: address.state,
              postalCode: address.postalCode,
              country: address.country
            }
          })
        });

        if (active) {
          setQuote(data.totals);
        }
      } catch {
        // Keep previous quote on transient failures.
      } finally {
        if (active) {
          setQuoteLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [items, address.state, address.postalCode, address.country]);

  useEffect(() => {
    setOrderSession(null);
    setIdempotencyKey(buildIdempotencyKey());
    setError('');
  }, [
    email,
    address.fullName,
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
    JSON.stringify(items)
  ]);

  const paymentElementOptions = useMemo(
    () => ({
      layout: 'tabs'
    }),
    []
  );

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    if (!items.length) return;

    if (!stripePublishableKey || !stripePromise) {
      setError('Stripe publishable key is missing. Configure VITE_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    setCreatingOrder(true);
    setError('');

    try {
      const data = await api('/orders/checkout', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          email,
          items,
          shippingAddress: address
        })
      });

      setOrderSession({
        orderId: data.orderId,
        trackingId: data.trackingId,
        lookupToken: data.lookupToken,
        clientSecret: data.clientSecret,
        status: data.status
      });

      if (data.status === 'paid') {
        window.location.assign(`/#${buildSuccessPath(data.orderId, data.lookupToken)}`);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Checkout"
        title="Ship the finished pieces"
        description="Enter shipping details, then complete payment securely."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur">
          <form onSubmit={handleCreateOrder} className="grid gap-4 md:grid-cols-2">
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

            <button
              type="submit"
              disabled={creatingOrder || !items.length}
              className="mt-2 w-full rounded-full bg-ink px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-paper transition hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 md:col-span-2"
            >
              {creatingOrder ? 'Preparing Payment...' : orderSession ? 'Refresh Payment Session' : 'Continue to Payment'}
            </button>
          </form>

          {orderSession?.clientSecret ? (
            <div className="mt-6 border-t border-black/10 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/55">
                Order {orderSession.trackingId}
              </p>
              <Elements stripe={stripePromise} options={{ clientSecret: orderSession.clientSecret }}>
                <PaymentForm
                  orderSession={orderSession}
                  paymentElementOptions={paymentElementOptions}
                  successPath={buildSuccessPath(orderSession.orderId, orderSession.lookupToken)}
                  stripeReturnUrl={buildStripeReturnUrl(orderSession.orderId, orderSession.lookupToken)}
                  onError={setError}
                />
              </Elements>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}
        </div>

        <aside className="h-fit rounded-[2rem] border border-black/8 bg-paper p-6">
          <h3 className="font-display text-3xl font-bold">Order Total</h3>
          <div className="mt-6 space-y-3 text-sm text-black/60">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{currency(quote.shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{currency(quote.tax)}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-between border-t border-black/10 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{currency(quote.total)}</span>
          </div>
          <p className="mt-3 text-xs text-black/45">
            {quoteLoading ? 'Updating delivery charges...' : 'Shipping and tax change based on delivery address.'}
          </p>
        </aside>
      </div>
    </div>
  );
}

function PaymentForm({ orderSession, paymentElementOptions, successPath, stripeReturnUrl, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !orderSession?.clientSecret) return;

    setProcessing(true);
    onError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: stripeReturnUrl
        },
        redirect: 'if_required'
      });

      if (error) {
        onError(error.message || 'Payment failed. Please retry.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        window.location.assign(`/#${successPath}`);
        return;
      }

      if (paymentIntent?.status === 'processing' || paymentIntent?.status === 'requires_action') {
        window.location.assign(`/#${successPath}`);
        return;
      }

      onError('Payment is not complete yet. Please retry.');
    } catch (submitError) {
      onError(submitError.message || 'Network error while confirming payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <PaymentElement options={paymentElementOptions} />
      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full rounded-full bg-accent-gradient px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-glow transition hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50"
      >
        {processing ? 'Processing Payment...' : 'Pay and Place Order'}
      </button>
    </form>
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
