export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-sm bg-sn-surface ${className ?? ""}`} />
  );
}
