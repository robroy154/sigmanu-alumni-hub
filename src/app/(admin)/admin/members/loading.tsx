import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMembersLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Table */}
      <div className="rounded-sm bg-sn-surface border border-sn-gray-dark overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-sn-gray-dark">
          {[40, 28, 20, 16].map((w, i) => (
            <Skeleton key={i} className={`h-4 w-${w}`} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-sn-gray-dark/50 last:border-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
