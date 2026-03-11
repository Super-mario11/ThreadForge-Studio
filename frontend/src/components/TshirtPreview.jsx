import { motion } from 'framer-motion';

export default function TshirtPreview({
  color = '#ffffff',
  artwork,
  title = 'Front Preview',
  animate = true,
  size = 'large'
}) {
  const dimensions =
    size === 'small' ? 'h-60 w-52' : 'h-[22rem] w-[18rem] sm:h-[28rem] sm:w-[22rem]';

  return (
    <motion.div
      animate={animate ? { rotateZ: [-1, 1, -1], y: [0, -10, 0] } : {}}
      transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      className={`${dimensions} relative rounded-[2.5rem] border border-black/8 bg-white/60 p-4 shadow-[0_40px_100px_rgba(8,8,8,0.12)] backdrop-blur sm:rounded-[3rem] sm:p-5`}
    >
      <div
        className="absolute inset-3 rounded-[2rem] border border-black/5 sm:inset-4 sm:rounded-[2.5rem]"
        style={{ background: `linear-gradient(145deg, ${color}, rgba(255,255,255,0.72))` }}
      />
      <div className="absolute left-1/2 top-8 h-10 w-20 -translate-x-1/2 rounded-b-[999px] border-x border-b border-black/8 bg-paper/50 sm:top-10 sm:h-12 sm:w-24" />
      <div className="absolute left-5 top-16 h-20 w-8 rounded-full bg-black/4 blur-sm sm:left-7 sm:top-20 sm:h-24 sm:w-10" />
      <div className="absolute right-5 top-16 h-20 w-8 rounded-full bg-black/4 blur-sm sm:right-7 sm:top-20 sm:h-24 sm:w-10" />
      <div className="absolute bottom-5 left-1/2 h-52 w-44 -translate-x-1/2 rounded-[1.75rem] border border-dashed border-black/10 sm:bottom-7 sm:h-64 sm:w-52 sm:rounded-[2rem]" />
      <div className="absolute left-1/2 top-12 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.35em] text-black/35 sm:top-16 sm:text-xs">
        {title}
      </div>
      {artwork ? (
        <img
          src={artwork}
          alt="T-shirt design preview"
          className="absolute left-1/2 top-28 max-h-40 max-w-36 -translate-x-1/2 rounded-2xl object-contain drop-shadow-2xl sm:top-32 sm:max-h-48 sm:max-w-44"
        />
      ) : (
        <div className="absolute left-1/2 top-32 flex w-36 -translate-x-1/2 flex-col items-center text-center text-black/35 sm:top-36 sm:w-44">
          <p className="font-display text-lg font-semibold sm:text-xl">Your artwork</p>
          <p className="mt-2 text-xs sm:text-sm">Prompt or upload a design to see it printed live.</p>
        </div>
      )}
    </motion.div>
  );
}
