import { Navigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useOrders } from '../queries/useOrders.js';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const { orders } = useOrders(Boolean(user));

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle
          eyebrow="Dashboard"
          title={user ? `Welcome back, ${user.name}` : 'Loading account'}
          description="View order history, revisit saved designs, and jump back into the studio from one place."
        />
        {user ? (
          <button type="button" onClick={logout} className="rounded-full border border-black/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em]">
            Logout
          </button>
        ) : null}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur">
          <h3 className="font-display text-3xl font-bold">Saved Designs</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {user?.savedDesigns?.length ? (
              user.savedDesigns.map((design) => (
                <article key={`${design.name}-${design.createdAt}`} className="rounded-[1.5rem] border border-black/8 bg-paper p-4">
                  <img src={design.previewUrl} alt={design.name} className="h-40 w-full rounded-[1rem] object-cover" />
                  <h4 className="mt-3 font-display text-xl font-bold">{design.name}</h4>
                  <p className="text-sm text-black/60">{design.productType}</p>
                </article>
              ))
            ) : (
              <p className="text-black/60">No saved designs yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/8 bg-ink p-6 text-paper">
          <h3 className="font-display text-3xl font-bold">Order History</h3>
          <div className="mt-6 space-y-4">
            {orders.length ? (
              orders.map((order) => (
                <article key={order._id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">#{order._id.slice(-6)}</p>
                    <p className="text-sm uppercase tracking-[0.2em] text-paper/60">{order.status}</p>
                  </div>
                  <p className="mt-2 text-sm text-paper/70">{order.items.length} items · ${order.amountTotal}</p>
                </article>
              ))
            ) : (
              <p className="text-paper/65">No orders yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
