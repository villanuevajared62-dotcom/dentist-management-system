'use client';
import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Stethoscope, X, Trash2 } from 'lucide-react';
import { STALE_TIMES } from '@/app/providers';
import ConfirmModal from '@/components/ui/ConfirmModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyForm = {
  userId: '', branchId: '', specialty: '', licenseNumber: '',
  schedule: [] as { dayOfWeek: number; startTime: string; endTime: string }[],
};

async function deleteDentist(id: string) {
  const res = await fetch(`/api/dentists/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

export default function DentistsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: dentists = [], isLoading } = useQuery({
    queryKey: ['dentists'],
    queryFn: () => fetch('/api/dentists').then(r => r.json()).then(r => r.data),
    staleTime: STALE_TIMES.dentists,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'dentist'],
    queryFn: () => fetch('/api/users?role=dentist').then(r => r.json()).then(r => r.data),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetch('/api/branches').then(r => r.json()).then(r => r.data),
  });

const createMutation = useMutation({
    mutationFn: (data: typeof form) => fetch('/api/dentists', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return toast.error(data.message);
      toast.success('Dentist profile created');
      qc.invalidateQueries({ queryKey: ['dentists'] });
      setModal(false); setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDentist,
    onSuccess: () => {
      toast.success('Dentist deactivated');
      qc.invalidateQueries({ queryKey: ['dentists'] });
    },
    onError: () => toast.error('Failed to deactivate dentist'),
  });

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  function toggleDay(day: number) {
    const has = form.schedule.find(s => s.dayOfWeek === day);
    if (has) {
      set('schedule', form.schedule.filter(s => s.dayOfWeek !== day));
    } else {
      set('schedule', [...form.schedule, { dayOfWeek: day, startTime: '09:00', endTime: '17:00' }]);
    }
  }

  function updateSchedule(day: number, field: string, value: string) {
    set('schedule', form.schedule.map(s =>
      s.dayOfWeek === day ? { ...s, [field]: value } : s
    ));
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Dentists</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Dentist Profile
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dentists.map((d: any) => (
            <div key={d._id} className="card">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-3">
                  <Stethoscope size={18} />
                </div>
                {d.isActive !== false && (
                  <button
                    onClick={() => setDeleteId(d._id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Deactivate"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <h3 className="font-bold text-slate-900">Dr. {d.userId?.name}</h3>
              <p className="text-sm text-brand-600">{d.specialty}</p>
              <p className="text-xs text-slate-400 mt-1">License: {d.licenseNumber}</p>
              <p className="text-xs text-slate-500 mt-1">📍 {d.branchId?.name}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.schedule?.map((s: any) => (
                  <span key={s.dayOfWeek} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs">
                    {DAYS[s.dayOfWeek]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-900">Create Dentist Profile</h2>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-5 space-y-4">
              <div>
                <label className="label">User Account *</label>
                <select className="input" value={form.userId} onChange={e => set('userId', e.target.value)} required>
                  <option value="">Select dentist user…</option>
                  {users.map((u: any) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Branch *</label>
                <select className="input" value={form.branchId} onChange={e => set('branchId', e.target.value)} required>
                  <option value="">Select branch…</option>
                  {branches.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Specialty *</label><input className="input" placeholder="e.g. General Dentistry" value={form.specialty} onChange={e => set('specialty', e.target.value)} required /></div>
                <div><label className="label">License # *</label><input className="input" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} required /></div>
              </div>

              {/* Weekly schedule */}
              <div>
                <label className="label">Work Schedule *</label>
                <div className="space-y-2">
                  {DAYS.map((day, i) => {
                    const s = form.schedule.find(x => x.dayOfWeek === i);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`w-12 text-xs font-medium py-1 rounded-lg border transition ${s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          {day}
                        </button>
                        {s && (
                          <>
                            <input type="time" className="input flex-1 text-xs" value={s.startTime} onChange={e => updateSchedule(i, 'startTime', e.target.value)} />
                            <span className="text-slate-400 text-xs">to</span>
                            <input type="time" className="input flex-1 text-xs" value={s.endTime} onChange={e => updateSchedule(i, 'endTime', e.target.value)} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating…' : 'Create Profile'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Deactivate dentist?"
        message="This will hide the dentist profile from the list."
        confirmLabel="Yes, Deactivate"
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
