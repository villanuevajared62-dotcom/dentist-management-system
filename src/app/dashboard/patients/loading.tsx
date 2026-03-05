import { SkeletonTable } from '@/components/ui/Skeleton';

export default function PatientsLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-slate-200 rounded w-40 animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="card p-4 flex items-center gap-2">
        <div className="h-10 bg-slate-200 rounded-lg flex-1 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4">
          <SkeletonTable 
            rows={7} 
            columns={7}
            columnWidths={['w-40', 'w-20', 'w-28', 'w-28', 'w-40', 'w-24', 'w-20']}
          />
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="h-4 bg-slate-200 rounded w-40 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-slate-200 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

