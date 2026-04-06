import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Welcome header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column — upcoming events */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-sm bg-sn-surface border border-sn-gray-dark p-6 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-28 mt-2" />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Birthdays card */}
          <div className="rounded-sm bg-sn-surface border border-sn-gray-dark p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
          {/* Quick links card */}
          <div className="rounded-sm bg-sn-surface border border-sn-gray-dark p-6 space-y-3">
            <Skeleton className="h-5 w-24" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
