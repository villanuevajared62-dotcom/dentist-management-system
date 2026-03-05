'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';

export default function EditAppointmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  // Ensure params.id is available
  const appointmentId = params?.id;
  
  const [form, setForm] = useState({ date: '', startTime: '', dentistId: '', branchId: '', reason: '', notes: '' });

  const { data: appt } = useQuery({
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

  // Populate form when appointment data is loaded
  useEffect(() => {
    if (appt) {
      setForm({
        date: appt.date,
        startTime: appt.startTime,
        dentistId: appt.dentistId?._id,
        branchId: appt.branchId?._id,
        reason: appt.reason,
        notes: appt.notes || '',
      });
    }
  }, [appt]);

  const { data: slotsData } = useQuery({
    queryKey: ['slots', form.dentistId, form.date],
    queryFn: () => fetch(`/api/appointments/slots?dentistId=${form.dentistId}&date=${form.date}`)
      .then(r => r.json()).then(r => r.data),
    enabled: !!form.dentistId && !!form.date,
  });

  const slots: string[] = slotsData?.slots ?? [];
  // Include current slot in case it's already booked by this appointment
  const allSlots = form.startTime && !slots.includes(form.startTime)
    ? [form.startTime, ...slots].sort()
    : slots;

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => fetch(`/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return toast.error(data.message);
      toast.success('Appointment updated');
      router.push(`/dashboard/appointments/${appointmentId}`);
    },
  });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/appointments/${appointmentId}`} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">Edit Appointment</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="card space-y-5">
        <div>
          <label className="label">Date *</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>

        <div>
          <label className="label">Time Slot *</label>
          <div className="flex flex-wrap gap-2">
            {allSlots.map(slot => (
              <button
                key={slot} type="button" onClick={() => set('startTime', slot)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${form.startTime === slot ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-400'}`}
              >
                {formatTime(slot)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Reason *</label>
          <input className="input" value={form.reason} onChange={e => set('reason', e.target.value)} required />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/dashboard/appointments/${appointmentId}`} className="btn-secondary flex-1 text-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

