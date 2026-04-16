export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-l-4 border-slate-200 border-l-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-8 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-3 w-28 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="mt-3 h-7 w-full animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-14 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="divide-y divide-slate-100">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100/70" />
              </div>
              <div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-12 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
