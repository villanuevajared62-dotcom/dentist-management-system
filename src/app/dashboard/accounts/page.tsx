'use client';
import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, UserCog, X, ShieldCheck, Stethoscope, Users, KeyRound } from 'lucide-react';

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: ShieldCheck, dentist: Stethoscope, staff: Users,
};

const emptyForm = { name: '', email: '', password: '', role: 'staff' as const, branchId: '' };

export default function AccountsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()).then(r => r.data),
  });

  // Filter out admin from the displayed list
  const filteredUsers = users.filter((u: any) => u.role !== 'admin');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetch('/api/branches').then(r => r.json()).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return toast.error(data.message);
      toast.success('Account created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setModal(false); setForm(emptyForm);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Account deactivated'); qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => 
      fetch(`/api/users/${id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || 'Failed to reset password');
      toast.success('Password reset successfully');
      setResetModal(false);
      setSelectedUser(null);
      setNewPassword('');
    },
    onError: () => toast.error('Failed to reset password'),
  });

  function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!selectedUser) return;
    resetPasswordMutation.mutate({ id: selectedUser._id, password: newPassword });
  }

  function openResetModal(user: any) {
    setSelectedUser(user);
    setNewPassword('');
    setResetModal(true);
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Staff Accounts</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">Loading…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Users className="mr-2" size={20} /> No staff accounts yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name','Email','Role','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: any) => {
                const Icon = ROLE_ICONS[u.role] || Users;
                return (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                        {u.name[0].toUpperCase()}
                      </div>
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Icon size={11} /> {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => openResetModal(u)}
                            className="text-brand-600 hover:underline text-xs font-medium flex items-center gap-1"
                          >
                            <KeyRound size={12} /> Reset Password
                          </button>
                          <button
                            onClick={() => { if (confirm('Deactivate this account?')) deactivateMutation.mutate(u._id); }}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Deactivate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Create Account</h2>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-5 space-y-4">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
              <div><label className="label">Password *</label><input type="password" className="input" placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role *</label>
                  <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="staff">Staff</option>
                    <option value="dentist">Dentist</option>
                  </select>
                </div>
                <div>
                  <label className="label">Branch</label>
                  <select className="input" value={form.branchId} onChange={e => set('branchId', e.target.value)}>
                    <option value="">None</option>
                    {branches.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating…' : 'Create Account'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <KeyRound size={18} /> Reset Password
              </h2>
              <button onClick={() => { setResetModal(false); setSelectedUser(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-500">Resetting password for:</p>
                <p className="font-medium text-slate-900">{selectedUser.name}</p>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <div>
                <label className="label">New Password *</label>
                <input 
                  type="password" 
                  className="input" 
                  placeholder="Minimum 8 characters"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  required 
                  minLength={8}
                />
                <p className="text-xs text-slate-400 mt-1">Password must be at least 8 characters</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={resetPasswordMutation.isPending || newPassword.length < 8} 
                  className="btn-primary flex-1"
                >
                  {resetPasswordMutation.isPending ? 'Resetting…' : 'Reset Password'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setResetModal(false); setSelectedUser(null); }} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
