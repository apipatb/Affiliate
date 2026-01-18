export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto animate-pulse">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div>
            <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
          <div className="h-48 bg-slate-100 dark:bg-slate-700 rounded" />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="h-12 bg-slate-100 dark:bg-slate-700 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
