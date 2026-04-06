import { Skeleton } from "@/components/ui/skeleton";

export default function MyEventsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <Skeleton className="h-7 w-32" />

      {/* Calendar placeholder */}
      <div className="rounded-sm bg-sn-surface border border-sn-gray-dark p-6">
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Event row skeletons */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-sm bg-sn-surface border border-sn-gray-dark p-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
