/**
 * Reusable Skeleton components for loading states
 * Uses Tailwind animate-pulse for loading effect
 */

interface SkeletonProps {
  className?: string;
}

/**
 * SkeletonRow - For table rows
 * Use inside table tbody to show loading state
 */
export function SkeletonRow({ className = '' }: SkeletonProps) {
  return (
    <tr className="border-b border-slate-50">
      <td className={`px-4 py-3 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
      </td>
      <td className={`px-4 py-3 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
      </td>
      <td className={`px-4 py-3 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-28 animate-pulse" />
      </td>
      <td className={`px-4 py-3 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
      </td>
      <td className={`px-4 py-3 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
      </td>
      <td className={`px-4 py-3 ${className}`}>
        <div className="h-6 bg-slate-200 rounded-full w-16 animate-pulse" />
      </td>
      <td className={`px-4 py-3 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
      </td>
    </tr>
  );
}

/**
 * SkeletonRowCustom - For custom column counts
 * @param columns - number of columns
 * @param width - optional custom width for each column
 */
export function SkeletonRowCustom({ columns = 5, widths = [] }: { columns?: number; widths?: string[] }) {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div 
            className="h-4 bg-slate-200 rounded animate-pulse" 
            style={{ width: widths[i] || '100%' }} 
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * SkeletonCard - For dashboard stat cards
 */
export function SkeletonCard({ label }: { label?: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
      <div className="flex-1">
        <div className="h-8 bg-slate-200 rounded w-12 animate-pulse mb-1" />
        <div className="h-3 bg-slate-200 rounded w-24 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * SkeletonTable - Full table skeleton with header and rows
 */
export function SkeletonTable({ 
  rows = 7, 
  columns = 7,
  columnWidths = []
}: { 
  rows?: number; 
  columns?: number;
  columnWidths?: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="text-left px-4 py-3">
                <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <SkeletonRowCustom 
              key={rowIndex} 
              columns={columns} 
              widths={columnWidths}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * SkeletonCardGrid - Grid of skeleton stat cards for dashboard
 */
export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={`h-4 bg-slate-200 rounded animate-pulse ${className}`} />
  );
}

