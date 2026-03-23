'use client';
import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, UserCog, X, ShieldCheck, Stethoscope, Users, KeyRound, Eye, Pencil } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: ShieldCheck, dentist: Stethoscope, staff: Users,
};

const emptyForm = { name: '', email: '', password: '', role: 'staff' as const, branchId: '' };
const emptyEditForm = { name: '', email: '', role: 'staff' as const, branchId: '' };

export default function AccountsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyEditForm);

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Account deleted'); qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: typeof emptyEditForm }) => fetch(`/api/users/${payload.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.data),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || 'Failed to update account');
      toast.success('Account updated');
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditModal(false);
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to update account'),
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

  function openViewModal(user: any) {
    setSelectedUser(user);
    setViewModal(true);
  }

  function openEditModal(user: any) {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'staff',
      branchId: user.branchId?._id || '',
    });
    setEditModal(true);
  }

  function openDeleteModal(userId: string) {
    setDeleteId(userId);
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function setEdit(k: string, v: string) { setEditForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
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
                        <div className="flex gap-3">
                          {u.isActive && (
                            <button
                              onClick={() => openResetModal(u)}
                              className="text-brand-600 hover:underline text-xs font-medium flex items-center gap-1"
                            >
                              <KeyRound size={12} /> Reset Password
                            </button>
                          )}
                          <button
                            onClick={() => openViewModal(u)}
                            className="text-slate-600 hover:underline text-xs font-medium flex items-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="text-amber-600 hover:underline text-xs font-medium flex items-center gap-1"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(u._id)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      <ConfirmModal
        open={!!deleteId}
        title="Delete account?"
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

      {/* View Details Modal */}
      {viewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserCog size={18} /> Account Details
              </h2>
              <button onClick={() => { setViewModal(false); setSelectedUser(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div>
                <div className="text-slate-400 text-xs">Name</div>
                <div className="font-medium text-slate-900">{selectedUser.name}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Email</div>
                <div className="text-slate-700">{selectedUser.email}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Role</div>
                <div className="text-slate-700">{selectedUser.role}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Branch</div>
                <div className="text-slate-700">{selectedUser.branchId?.name || 'None'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Status</div>
                <div className="text-slate-700">{selectedUser.isActive ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Pencil size={18} /> Edit Account
              </h2>
              <button onClick={() => { setEditModal(false); setSelectedUser(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedUser) return;
                updateMutation.mutate({ id: selectedUser._id, data: {
                  name: editForm.name,
                  email: editForm.email,
                  role: editForm.role,
                  branchId: editForm.branchId,
                }});
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={editForm.name} onChange={e => setEdit('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={editForm.email} onChange={e => setEdit('email', e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Role *</label>
                  <select className="input" value={editForm.role} onChange={e => setEdit('role', e.target.value)}>
                    <option value="staff">Staff</option>
                    <option value="dentist">Dentist</option>
                  </select>
                </div>
                <div>
                  <label className="label">Branch</label>
                  <select className="input" value={editForm.branchId} onChange={e => setEdit('branchId', e.target.value)}>
                    <option value="">None</option>
                    {branches.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setEditModal(false); setSelectedUser(null); }} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
