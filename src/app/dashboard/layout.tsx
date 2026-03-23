import { TopNav } from '@/components/layout/TopNav';
import { SessionTimeout } from '@/components/ui/SessionTimeout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-hidden">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <SessionTimeout />
    </div>
  );
}
