const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-border/40 ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
          <div className="flex items-start justify-between mb-3">
            <SkeletonBlock className="w-10 h-10" />
            <SkeletonBlock className="w-12 h-4" />
          </div>
          <SkeletonBlock className="w-20 h-7 mb-2" />
          <SkeletonBlock className="w-24 h-3 mb-1" />
          <SkeletonBlock className="w-16 h-3" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <SkeletonBlock className="lg:col-span-3 h-64 certus-shadow" />
      <SkeletonBlock className="lg:col-span-2 h-64 certus-shadow" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SkeletonBlock className="h-56 certus-shadow" />
      <SkeletonBlock className="h-56 certus-shadow" />
    </div>
  </div>
);

export default DashboardSkeleton;
