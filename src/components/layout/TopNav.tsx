'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Menu, X, LogOut, LayoutDashboard, Calendar, Users, Building2, UserCog, ClipboardList, FileText, Stethoscope } from 'lucide-react';
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

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [open, setOpen] = useState(false);

  const filtered = NAV_ITEMS.filter(item => role && item.roles.includes(role));

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg border border-slate-100 bg-white shadow-sm"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Stethoscope size={18} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">ILoveDentist</p>
              <p className="text-xs text-slate-400 capitalize">{role} Portal</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-4 overflow-x-auto">
            {filtered.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-right min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate max-w-[180px]">{session?.user?.name}</p>
              <p className="text-xs text-slate-400 truncate max-w-[180px]">{session?.user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => {
                signOut({ redirect: false }).then(() => {
                  router.push('/login');
                });
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl border-r border-slate-100 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                  <Stethoscope size={16} />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-slate-900">ILoveDentist</p>
                  <p className="text-xs text-slate-400 capitalize">{role} Portal</p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filtered.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                  {session?.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
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
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
