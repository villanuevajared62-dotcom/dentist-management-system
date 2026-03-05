'use client';
import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Building2, Pencil, Trash2, X } from 'lucide-react';
import { STALE_TIMES } from '@/app/providers';

const emptyForm = { name: '', address: '', city: '', phone: '', email: '' };

export default function BranchesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetch('/api/branches').then(r => r.json()).then(r => r.data),
    staleTime: STALE_TIMES.branches,
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const url = modal === 'edit' ? `/api/branches/${editId}` : '/api/branches';
      const method = modal === 'edit' ? 'PUT' : 'POST';
      return fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return toast.error(data.message);
      toast.success(modal === 'edit' ? 'Branch updated' : 'Branch created');
      qc.invalidateQueries({ queryKey: ['branches'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/branches/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Branch removed'); qc.invalidateQueries({ queryKey: ['branches'] }); },
  });

  function openCreate() { setForm(emptyForm); setModal('create'); }
  function openEdit(b: any) { setForm({ name: b.name, address: b.address, city: b.city, phone: b.phone, email: b.email }); setEditId(b._id); setModal('edit'); }
  function closeModal() { setModal(null); setForm(emptyForm); }
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Branches</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Branch
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">Loading…</div>
      ) : branches.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <Building2 className="mx-auto mb-2 opacity-40" size={40} />
          <p>No branches yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b: any) => (
            <div key={b._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Remove branch?')) deleteMutation.mutate(b._id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mt-3">{b.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{b.address}</p>
              <p className="text-sm text-slate-500">{b.city}</p>
              <p className="text-sm text-brand-600 mt-2">{b.phone}</p>
              <p className="text-xs text-slate-400">{b.email}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">{modal === 'edit' ? 'Edit Branch' : 'New Branch'}</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="label">Branch Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div><label className="label">Address *</label><input className="input" value={form.address} onChange={e => set('address', e.target.value)} required /></div>
              <div><label className="label">City *</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
                <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1">
                  {saveMutation.isPending ? 'Saving…' : 'Save Branch'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
