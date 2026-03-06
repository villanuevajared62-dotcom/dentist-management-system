'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Calendar, Users, Building2, UserCog,
  ClipboardList, LogOut, Menu, X, Stethoscope, ChevronRight, FileText
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard, roles: ['admin','staff','dentist'] },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar,        roles: ['admin','staff','dentist'] },
  { href: '/dashboard/patients',     label: 'Patients',     icon: Users,           roles: ['admin','staff','dentist'] },
  { href: '/dashboard/dentists',     label: 'Dentists',     icon: Stethoscope,     roles: ['admin'] },
  { href: '/dashboard/branches',     label: 'Branches',     icon: Building2,       roles: ['admin'] },
  { href: '/dashboard/accounts',     label: 'Accounts',     icon: UserCog,         roles: ['admin'] },
  { href: '/dashboard/audit-log',    label: 'Audit Log',    icon: FileText,        roles: ['admin'] },
  { href: '/dashboard/schedule',     label: 'My Schedule',  icon: ClipboardList,   roles: ['dentist'] },
];

export function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = session?.user?.role;

  const filtered = NAV_ITEMS.filter(item => role && item.roles.includes(role));

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-lg shadow">🦷</div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">ILoveDentist</p>
            <p className="text-xs text-slate-400 capitalize">{role} Portal</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filtered.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            signOut({ redirect: false }).then(() => {
              router.push('/login');
            });
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-slate-100"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-40 transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <NavContent />
      </aside>
    </>
  );
}
