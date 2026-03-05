import { SkeletonCardGrid } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-slate-200 rounded w-64 animate-pulse" />
      </div>

      {/* Stats Grid skeleton */}
      <SkeletonCardGrid count={4} />

      {/* Today's Appointments skeleton */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-slate-200 rounded w-40 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3">
                  <div className="h-3 bg-slate-200 rounded w-12 animate-pulse" />
                </th>
                <th className="text-left py-2 px-3">
                  <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
                </th>
                <th className="text-left py-2 px-3">
                  <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
                </th>
                <th className="text-left py-2 px-3">
                  <div className="h-3 bg-slate-200 rounded w-12 animate-pulse" />
                </th>
                <th className="text-left py-2 px-3">
                  <div className="h-3 bg-slate-200 rounded w-14 animate-pulse" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2.5 px-3">
                    <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="h-4 bg-slate-200 rounded w-28 animate-pulse" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="h-6 bg-slate-200 rounded-full w-16 animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

