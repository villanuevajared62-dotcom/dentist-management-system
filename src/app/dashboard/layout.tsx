import { Sidebar } from '@/components/layout/Sidebar';
import { SessionTimeout } from '@/components/ui/SessionTimeout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen overflow-x-hidden">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <SessionTimeout />
    </div>
  );
}
