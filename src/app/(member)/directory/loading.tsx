import { Skeleton } from "@/components/ui/skeleton";

export default function DirectoryLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      {/* Search bar */}
      <Skeleton className="h-9 w-full max-w-sm" />

      {/* Member grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-sm bg-sn-surface border border-sn-gray-dark p-4 flex flex-col items-center gap-3">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
