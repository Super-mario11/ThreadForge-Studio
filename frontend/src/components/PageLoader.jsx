import { motion, useReducedMotion } from 'framer-motion';

export default function PageLoader({ label = 'Loading experience…' }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-ink/10 bg-white/70 p-8 shadow-lg shadow-ink/5 backdrop-blur">
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-sm font-bold uppercase tracking-[0.3em] text-black/45"
        >
          {label}
        </motion.p>
        <div className="mt-6 space-y-3">
          <div className="h-7 w-2/3 rounded-xl skeleton" />
          <div className="h-4 w-full rounded-xl skeleton" />
          <div className="h-4 w-4/5 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
