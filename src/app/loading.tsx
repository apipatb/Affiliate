export default function HomeLoading() {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900">
      {/* Hero skeleton */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-pulse">
          <div className="h-6 w-64 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />
          <div className="h-16 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-4" />
          <div className="h-16 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-6" />
          <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-10" />
          <div className="flex justify-center gap-4">
            <div className="h-12 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-12 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Features skeleton */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 mb-6" />
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products skeleton */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="text-center mb-12">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-4" />
            <div className="h-5 w-80 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
