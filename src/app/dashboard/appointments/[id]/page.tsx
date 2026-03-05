'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, XCircle } from 'lucide-react';
import Link from 'next/link';
import { STATUS_COLORS, formatTime, formatDate } from '@/lib/utils';
import { AppointmentStatus } from '@/types';
import { useState, useEffect } from 'react';

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const router = useRouter();
  const role = session?.user?.role;
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  
  // Ensure params.id is available
  const appointmentId = params?.id;

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => fetch(`/api/appointments/${appointmentId}`).then(r => r.json()).then(r => r.data),
    enabled: !!appointmentId,
  });

  // Handle missing appointmentId
  if (!appointmentId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Invalid appointment ID</p>
      </div>
    );
  }

  // Populate notes when appointment data is loaded
  useEffect(() => {
    if (appt) {
      setNotes(appt?.notes || '');
    }
  }, [appt]);

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Updated');
        qc.invalidateQueries({ queryKey: ['appointment', appointmentId] });
        setEditingNotes(false);
      } else {
        toast.error(data.message);
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => fetch(`/api/appointments/${appointmentId}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Appointment cancelled'); router.push('/dashboard/appointments'); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  if (!appt) return <div className="text-slate-500">Appointment not found.</div>;

  return (
    <div className="animate-fade-in max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/appointments" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">Appointment Details</h1>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[appt.status as AppointmentStatus]}`}>
          {appt.status}
        </span>
      </div>

      {/* Summary card */}
      <div className="card space-y-3">
        <InfoRow label="Patient" value={`${appt.patientId?.firstName} ${appt.patientId?.lastName}`} />
        <InfoRow label="Phone" value={appt.patientId?.phone} />
        <InfoRow label="Dentist" value={`Dr. ${appt.dentistId?.userId?.name}`} />
        <InfoRow label="Branch" value={`${appt.branchId?.name} — ${appt.branchId?.city}`} />
        <InfoRow label="Date" value={formatDate(appt.date)} />
        <InfoRow label="Time" value={`${formatTime(appt.startTime)} – ${formatTime(appt.endTime)}`} />
        <InfoRow label="Reason" value={appt.reason} />
      </div>

      {/* Notes */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Treatment Notes</h3>
          {(role === 'dentist' || role === 'admin') && !editingNotes && appt.status !== 'Cancelled' && (
            <button onClick={() => setEditingNotes(true)} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              <Edit size={13} /> Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <textarea className="input" rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => updateMutation.mutate({ notes })} className="btn-primary text-sm px-4">Save</button>
              <button onClick={() => setEditingNotes(false)} className="btn-secondary text-sm px-4">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 text-sm">{appt.notes || <span className="text-slate-400 italic">No notes yet</span>}</p>
        )}
      </div>

      {/* Status actions for dentist */}
      {role === 'dentist' && appt.status === 'Pending' && (
        <div className="card flex gap-3">
          <button onClick={() => updateMutation.mutate({ status: 'Completed' })} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
            Mark Completed
          </button>
          <button onClick={() => updateMutation.mutate({ status: 'Missed' })} className="btn-secondary flex-1 text-red-600 border-red-200 hover:bg-red-50">
            Mark Missed
          </button>
        </div>
      )}

      {/* Cancel action */}
      {(role === 'admin' || role === 'staff') && appt.status === 'Pending' && (
        <div className="card flex gap-3">
          <Link href={`/dashboard/appointments/${appointmentId}/edit`} className="btn-primary flex-1 text-center">
            Edit Appointment
          </Link>
          <button
            onClick={() => { if (confirm('Cancel this appointment?')) cancelMutation.mutate(); }}
            className="btn-danger flex-1 flex items-center justify-center gap-2"
          >
            <XCircle size={16} /> Cancel Appointment
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
      <span className="w-24 text-slate-400 shrink-0">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
