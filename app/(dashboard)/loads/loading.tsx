export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="h-9 w-full animate-pulse rounded-lg bg-slate-100 sm:w-80" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-3.5 w-16 animate-pulse rounded bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100/70" />
              </div>
              <div className="h-3.5 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-12 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-12 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="h-7 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
