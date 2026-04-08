import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 lg:px-6">
      {/* Page title */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton variant="circle" className="h-10 w-10" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mt-4 h-8 w-24" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton variant="rect" className="mt-4 h-[260px] w-full" />
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
          >
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton variant="circle" className="h-8 w-8" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-1 h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
