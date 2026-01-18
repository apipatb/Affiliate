export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-8" />

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-2">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
