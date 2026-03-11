export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70 shadow-lg shadow-ink/5 backdrop-blur">
      <div className="h-72 w-full skeleton" />
      <div className="space-y-4 p-5">
        <div className="space-y-3">
          <div className="h-7 w-2/3 rounded-xl skeleton" />
          <div className="h-4 w-full rounded-xl skeleton" />
          <div className="h-4 w-4/5 rounded-xl skeleton" />
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="h-6 w-24 rounded-xl skeleton" />
          <div className="flex gap-2">
            <div className="h-7 w-14 rounded-full skeleton" />
            <div className="h-7 w-14 rounded-full skeleton" />
            <div className="h-7 w-14 rounded-full skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}
