import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-4">
      {/* Greeting row */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.25">
        {/* Next Event — 2x2 */}
        <div className="md:col-span-2 lg:row-span-2 bg-sn-surface border border-white/8 rounded-2xl p-5 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-auto space-y-2 pt-4">
            <Skeleton className="h-1.25 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-[9px]" />
          </div>
        </div>

        {/* Lineage — 2x1 */}
        <div className="md:col-span-2 bg-sn-surface border border-white/8 rounded-2xl p-4.5 space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-1.75">
            <Skeleton className="flex-1 h-14 rounded-[10px]" />
            <Skeleton className="flex-1 h-14 rounded-[10px]" />
            <Skeleton className="flex-1 h-14 rounded-[10px]" />
          </div>
        </div>

        {/* Stat tiles */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-sn-surface border border-white/8 rounded-2xl p-4.5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}

        {/* Announcement — span 3 */}
        <div className="md:col-span-2 lg:col-span-3 bg-sn-surface border border-white/8 rounded-2xl p-4.5 space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Quick links */}
        <div className="bg-sn-surface border border-white/8 rounded-2xl p-4.5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
