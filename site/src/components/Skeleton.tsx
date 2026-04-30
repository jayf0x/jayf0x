export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-[var(--surface-2)] ${className}`} />
)
