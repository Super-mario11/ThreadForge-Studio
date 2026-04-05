import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6 lg:px-8">
      <div className="rounded-[2.5rem] border border-black/8 bg-white/80 p-10 backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-electric">404</p>
        <h1 className="mt-4 font-display text-5xl font-bold">Page not found</h1>
        <p className="mt-4 text-ink/70">The link is broken or the page has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-paper">
            Go Home
          </Link>
          <Link to="/shop" className="rounded-full border border-black/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em]">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
