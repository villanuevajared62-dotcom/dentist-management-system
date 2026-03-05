'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUS_COLORS, formatTime } from '@/lib/utils';
import { AppointmentStatus } from '@/types';
import Link from 'next/link';

export default function SchedulePage() {
  const { data: session } = useSession();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const from = format(weekStart, 'yyyy-MM-dd');
  const to = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', 'schedule', from, to],
    queryFn: () =>
      fetch(`/api/appointments?dateFrom=${from}&dateTo=${to}`)
        .then(r => r.json()).then(r => r.data),
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function getDayAppts(date: Date) {
    const d = format(date, 'yyyy-MM-dd');
    return appointments.filter((a: any) => a.date === d);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Schedule</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(w => addDays(w, -7))} className="btn-secondary p-2">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-40 text-center">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setWeekStart(w => addDays(w, 7))} className="btn-secondary p-2">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="btn-secondary text-sm">
            Today
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading schedule…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, i) => {
            const appts = getDayAppts(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`card min-h-32 ${isToday ? 'border-brand-300 bg-brand-50/50' : ''}`}>
                <div className="mb-3">
                  <p className={`text-xs font-medium uppercase ${isToday ? 'text-brand-600' : 'text-slate-400'}`}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-brand-700' : 'text-slate-800'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {appts.length === 0 ? (
                    <p className="text-xs text-slate-300">—</p>
                  ) : (
                    appts.map((a: any) => (
                      <Link
                        key={a._id}
                        href={`/dashboard/appointments/${a._id}`}
                        className="block p-2 rounded-lg bg-white border border-slate-100 hover:border-brand-200 transition text-xs"
                      >
                        <p className="font-mono text-slate-500">{formatTime(a.startTime)}</p>
                        <p className="font-medium text-slate-800 truncate">
                          {a.patientId?.firstName} {a.patientId?.lastName}
                        </p>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[a.status as AppointmentStatus]}`}>
                          {a.status}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view for today */}
      <div className="card">
        <h2 className="section-title mb-4">Today&apos;s Appointments — {format(new Date(), 'EEEE, MMMM d')}</h2>
        {getDayAppts(new Date()).length === 0 ? (
          <p className="text-slate-400 text-sm">No appointments today</p>
        ) : (
          <div className="space-y-2">
            {getDayAppts(new Date()).map((a: any) => (
              <Link key={a._id} href={`/dashboard/appointments/${a._id}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition text-sm">
                <span className="font-mono text-slate-500 text-xs w-16">{formatTime(a.startTime)}</span>
                <span className="flex-1 font-medium">{a.patientId?.firstName} {a.patientId?.lastName}</span>
                <span className="text-slate-500 text-xs">{a.reason}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[a.status as AppointmentStatus]}`}>
                  {a.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
