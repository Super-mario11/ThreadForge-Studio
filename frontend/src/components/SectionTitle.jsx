export default function SectionTitle({ eyebrow, title, description, align = 'left' }) {
  const alignClass = align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl';

  return (
    <div className={alignClass}>
      {eyebrow ? <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-electric">{eyebrow}</p> : null}
      <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-base text-ink/70 sm:text-lg">{description}</p> : null}
    </div>
  );
}
