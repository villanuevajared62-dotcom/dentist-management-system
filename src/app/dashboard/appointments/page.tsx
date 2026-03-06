'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Calendar, Plus, Search, Filter, Printer, Download } from 'lucide-react';
import { STATUS_COLORS, formatTime, formatDate } from '@/lib/utils';
import { AppointmentStatus } from '@/types';
import Link from 'next/link';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { STALE_TIMES } from '@/app/providers';
import ConfirmModal from '@/components/ui/ConfirmModal';

async function fetchAppointments(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/appointments?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch appointments');
  const json = await res.json();
  return json.data;
}

async function deleteAppointment(id: string) {
  const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

// CSV Export function using vanilla JavaScript
function exportToCSV(appointments: any[]) {
  const headers = ['Date', 'Time', 'Patient Name', 'Dentist', 'Branch', 'Reason', 'Status'];
  
  const rows = appointments.map((appt) => {
    const date = formatDate(appt.date);
    const time = `${formatTime(appt.startTime)} - ${formatTime(appt.endTime)}`;
    const patientName = `${appt.patientId?.firstName || ''} ${appt.patientId?.lastName || ''}`.trim();
    const dentist = `Dr. ${appt.dentistId?.userId?.name || ''}`;
    const branch = appt.branchId?.name || '';
    const reason = appt.reason || '';
    const status = appt.status || '';
    
    // Escape quotes and wrap fields in quotes to handle commas
    return [date, time, patientName, dentist, branch, reason, status]
      .map(field => `"${String(field).replace(/"/g, '""')}"`)
      .join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `appointments-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const role = session?.user?.role;

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['appointments', date, status, search],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (date) params.date = date;
      if (status) params.status = status;
      if (search) params.search = search;
      return fetchAppointments(params);
    },
    staleTime: STALE_TIMES.appointments,
  });

  // Handle response from API (could be array or object with message)
  const appointments = Array.isArray(rawData) ? rawData : (rawData?.appointments || []);
  const needsProfile = rawData?.needsProfile;
  const profileMessage = rawData?.message;

  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      toast.success('Appointment deleted');
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => toast.error('Failed to delete appointment'),
  });

  // Use appointments directly from API (filtering is now done on backend)
  const appointmentCount = appointments.length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <h1 className="page-title">Appointments</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2"
            title="Print appointments"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={() => exportToCSV(appointments)}
            className="btn-secondary flex items-center gap-2"
            title="Export to CSV"
          >
            <Download size={16} /> Export CSV
          </button>
          {(role === 'admin' || role === 'staff') && (
            <Link href="/dashboard/appointments/new" className="btn-primary flex items-center gap-2">
              <Plus size={16} /> New Appointment
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={16} className="text-slate-400" />
          <input
            className="input flex-1"
            placeholder="Search patient…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <input
          type="date"
          className="input w-auto"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <select
          className="input w-auto"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {['Pending','Completed','Missed','Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(date || status || search) && (
          <button
            onClick={() => { setDate(''); setStatus(''); setSearch(''); setSearchInput(''); }}
            className="btn-secondary text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-slate-500 print:hidden">
          {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable 
              rows={7} 
              columns={7}
              columnWidths={['w-28', 'w-32', 'w-28', 'w-24', 'w-32', 'w-20', 'w-20']}
            />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar className="mx-auto mb-2 opacity-40" size={40} />
            <p className="font-medium">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Date & Time','Patient','Dentist','Branch','Reason','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt: any) => (
                  <tr key={appt._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{formatDate(appt.date)}</p>
                      <p className="text-xs text-slate-400 font-mono">{formatTime(appt.startTime)} – {formatTime(appt.endTime)}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {appt.patientId?.firstName} {appt.patientId?.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Dr. {appt.dentistId?.userId?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{appt.branchId?.name}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-32 truncate">{appt.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[appt.status as AppointmentStatus]}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 print:hidden">
                        <Link
                          href={`/dashboard/appointments/${appt._id}`}
                          className="text-brand-600 hover:underline text-xs font-medium"
                        >
                          View
                        </Link>
                        {(role === 'admin' || role === 'staff') && appt.status === 'Pending' && (
                          <>
                            <Link
                              href={`/dashboard/appointments/${appt._id}/edit`}
                              className="text-amber-600 hover:underline text-xs font-medium"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => setDeleteId(appt._id)}
                              className="text-red-500 hover:underline text-xs font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete appointment?"
        message="This action cannot be undone."
        confirmLabel="Yes, Delete"
        confirmClassName="btn-danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
