'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';

export default function NewAppointmentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    patientId: '', dentistId: '', branchId: '',
    date: '', startTime: '', duration: '30', reason: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [minDate, setMinDate] = useState('');

  // Set min date to today on mount and update at midnight
  useEffect(() => {
    const updateMinDate = () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setMinDate(`${yyyy}-${mm}-${dd}`);
    };
    updateMinDate();
    
    // Update at midnight to keep min date current
    const now = new Date();
    const msUntilMidnight = (24 * 60 * 60 * 1000) - (now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000 + now.getSeconds() * 1000);
    const midnightTimer = setTimeout(updateMinDate, msUntilMidnight);
    
    return () => clearTimeout(midnightTimer);
  }, []);

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetch('/api/branches').then(r => r.json()).then(r => r.data),
  });

  // Fetch all dentists (no filter by branch)
  const { data: allDentists = [] } = useQuery({
    queryKey: ['dentists', 'all'],
    queryFn: () => fetch('/api/dentists').then(r => r.json()).then(r => r.data),
  });

  // Filter dentists by selected branch
  const dentists = form.branchId 
    ? allDentists.filter((d: any) => d.branchId?._id === form.branchId || d.branchId === form.branchId)
    : allDentists;

  // Fetch patients (search)
  const { data: patients = [] } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => fetch(`/api/patients?search=${patientSearch}`).then(r => r.json()).then(r => r.data),
    enabled: patientSearch.length > 1,
  });

  // Fetch available slots
  const { data: slotsData } = useQuery({
    queryKey: ['slots', form.dentistId, form.date, form.duration],
    queryFn: () => fetch(`/api/appointments/slots?dentistId=${form.dentistId}&date=${form.date}&duration=${form.duration}`)
      .then(r => r.json()).then(r => r.data),
    enabled: !!form.dentistId && !!form.date,
  });

  const slots: string[] = slotsData?.slots ?? [];

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  // Reset dependent fields when branch changes
  useEffect(() => { set('dentistId', ''); set('startTime', ''); }, [form.branchId]);
  useEffect(() => { set('startTime', ''); }, [form.dentistId, form.date]);
  useEffect(() => { set('startTime', ''); }, [form.duration]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Client-side validation: check for past dates
    if (form.date && minDate) {
      const selectedDate = new Date(form.date);
      const today = new Date(minDate);
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return toast.error('Cannot book an appointment on a past date');
      }
    }
    
    if (!form.startTime) return toast.error('Please select a time slot');
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Appointment created!');
      router.push('/dashboard/appointments');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/appointments" className="p-2 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">New Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Branch */}
        <div>
          <label className="label">Branch *</label>
          <select className="input" value={form.branchId} onChange={e => set('branchId', e.target.value)} required>
            <option value="">Select a branch…</option>
            {branches.map((b: any) => (
              <option key={b._id} value={b._id}>{b.name} — {b.city}</option>
            ))}
          </select>
        </div>

        {/* Dentist */}
        <div>
          <label className="label">Dentist *</label>
          <select className="input" value={form.dentistId} onChange={e => set('dentistId', e.target.value)} required disabled={!form.branchId && allDentists.length === 0}>
            <option value="">Select a dentist…</option>
            {dentists.map((d: any) => (
              <option key={d._id} value={d._id}>
                Dr. {d.userId?.name || 'Unknown'}{d.isPending ? ' ⚠️ (needs profile)' : ''} — {d.specialty}
              </option>
            ))}
          </select>
          {allDentists.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              No dentists available. Please create a dentist profile first.
            </p>
          )}
        </div>

        {/* Patient */}
        <div>
          <label className="label">Patient *</label>
          <input
            className="input mb-2"
            placeholder="Search patient by name or phone…"
            value={patientSearch}
            onChange={e => setPatientSearch(e.target.value)}
          />
          {patients.length > 0 && (
            <select className="input" value={form.patientId} onChange={e => set('patientId', e.target.value)} required>
              <option value="">Select patient…</option>
              {patients.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} — {p.phone}
                </option>
              ))}
            </select>
          )}
          {patientSearch.length > 1 && patients.length === 0 && (
            <p className="text-sm text-slate-400 mt-1">
              No patients found. <Link href="/dashboard/patients/new" className="text-brand-600 hover:underline">Register new patient</Link>
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="label">Date *</label>
          <input
            type="date"
            className="input"
            value={form.date}
            min={minDate}
            onChange={e => set('date', e.target.value)}
            required
            disabled={!form.dentistId || !minDate}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="label flex items-center gap-2">
            <Clock size={14} /> Appointment Duration *
          </label>
          <select
            className="input"
            value={form.duration}
            onChange={e => set('duration', e.target.value)}
            required
            disabled={!form.dentistId || !form.date}
          >
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1 hour 30 minutes</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        {/* Time slot */}
        <div>
          <label className="label flex items-center gap-2">
            <Clock size={14} /> Available Time Slots *
          </label>
          {!form.dentistId || !form.date ? (
            <p className="text-sm text-slate-400">Select a dentist and date first</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              {slotsData?.message ?? 'No slots available on this day'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => set('startTime', slot)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.startTime === slot
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-400'
                  }`}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="label">Reason for Visit *</label>
          <input
            className="input"
            placeholder="e.g. Tooth cleaning, checkup, filling…"
            value={form.reason}
            onChange={e => set('reason', e.target.value)}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Any additional notes…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating…' : 'Create Appointment'}
          </button>
          <Link href="/dashboard/appointments" className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
