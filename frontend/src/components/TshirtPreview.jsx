import { motion } from 'framer-motion';

export default function TshirtPreview({
  color = '#ffffff',
  artwork,
  title = 'Front Preview',
  animate = true,
  size = 'large'
}) {
  const dimensions = size === 'small' ? 'h-60 w-52' : 'h-[28rem] w-[22rem]';

  return (
    <motion.div
      animate={animate ? { rotateZ: [-1, 1, -1], y: [0, -10, 0] } : {}}
      transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      className={`${dimensions} relative rounded-[3rem] border border-black/8 bg-white/60 p-5 shadow-[0_40px_100px_rgba(8,8,8,0.12)] backdrop-blur`}
    >
      <div
        className="absolute inset-4 rounded-[2.5rem] border border-black/5"
        style={{ background: `linear-gradient(145deg, ${color}, rgba(255,255,255,0.72))` }}
      />
      <div className="absolute left-1/2 top-10 h-12 w-24 -translate-x-1/2 rounded-b-[999px] border-x border-b border-black/8 bg-paper/50" />
      <div className="absolute left-7 top-20 h-24 w-10 rounded-full bg-black/4 blur-sm" />
      <div className="absolute right-7 top-20 h-24 w-10 rounded-full bg-black/4 blur-sm" />
      <div className="absolute bottom-7 left-1/2 h-64 w-52 -translate-x-1/2 rounded-[2rem] border border-dashed border-black/10" />
      <div className="absolute left-1/2 top-16 -translate-x-1/2 text-xs font-bold uppercase tracking-[0.35em] text-black/35">
        {title}
      </div>
      {artwork ? (
        <img
          src={artwork}
          alt="T-shirt design preview"
          className="absolute left-1/2 top-32 max-h-48 max-w-44 -translate-x-1/2 rounded-2xl object-contain drop-shadow-2xl"
        />
      ) : (
        <div className="absolute left-1/2 top-36 flex w-44 -translate-x-1/2 flex-col items-center text-center text-black/35">
          <p className="font-display text-xl font-semibold">Your artwork</p>
          <p className="mt-2 text-sm">Prompt or upload a design to see it printed live.</p>
        </div>
      )}
    </motion.div>
  );
}
