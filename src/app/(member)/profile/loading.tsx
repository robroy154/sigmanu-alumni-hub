import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Avatar + name */}
      <div className="rounded-sm bg-sn-surface border border-sn-gray-dark p-8 flex flex-col items-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Contact details card */}
      <div className="rounded-sm bg-sn-surface border border-sn-gray-dark p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* Family line card */}
      <div className="rounded-sm bg-sn-surface border border-sn-gray-dark p-6 space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}
