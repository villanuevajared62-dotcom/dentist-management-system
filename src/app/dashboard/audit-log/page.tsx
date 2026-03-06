'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Filter, FileText, Calendar, User } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  CANCEL: 'bg-orange-100 text-orange-700',
};

const MODULE_COLORS: Record<string, string> = {
  Appointment: 'bg-purple-100 text-purple-700',
  Patient: 'bg-cyan-100 text-cyan-700',
  User: 'bg-amber-100 text-amber-700',
  Branch: 'bg-pink-100 text-pink-700',
  Dentist: 'bg-indigo-100 text-indigo-700',
};

const MODULE_OPTIONS = ['Appointment', 'Patient', 'User', 'Branch', 'Dentist'];

export default function AuditLogPage() {
  const qc = useQueryClient();
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, moduleFilter, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (moduleFilter) params.set('module', moduleFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return fetch(`/api/audit-log?${params}`).then(r => r.json()).then(r => r.data);
    },
  });

  useEffect(() => {
    setSelectedIds([]);
  }, [actionFilter, moduleFilter, dateFrom, dateTo, logs.length]);

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => fetch('/api/audit-log', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return;
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const allSelected = logs.length > 0 && selectedIds.length === logs.length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <FileText size={24} /> Audit Log
        </h1>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4 text-slate-600">
          <Filter size={16} />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Action</label>
            <select 
              className="input" 
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="CANCEL">CANCEL</option>
            </select>
          </div>
          <div>
            <label className="label">Module</label>
            <select 
              className="input" 
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
            >
              <option value="">All Modules</option>
              {MODULE_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From Date</label>
            <input 
              type="date" 
              className="input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input 
              type="date" 
              className="input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'No items selected'}
        </div>
        <button
          onClick={() => {
            if (selectedIds.length === 0) return;
            setConfirmOpen(true);
          }}
          disabled={selectedIds.length === 0 || deleteMutation.isPending}
          className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
        </button>
      </div>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Delete audit logs?</h2>
              <p className="text-sm text-slate-500 mt-1">
                You are about to delete {selectedIds.length} audit log{selectedIds.length !== 1 ? 's' : ''}. This action cannot be undone.
              </p>
            </div>
            <div className="p-5 flex gap-3">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  deleteMutation.mutate(selectedIds);
                }}
                className="btn-primary flex-1"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="btn-secondary flex-1"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin mr-3" />
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="mx-auto mb-2 opacity-40" size={40} />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(logs.map((l: any) => l._id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  {['Date & Time', 'Action', 'Module', 'Performed By', 'Details'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(log._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, log._id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== log._id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-slate-100'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODULE_COLORS[log.module] || 'bg-slate-100'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <div>
                          <div>{log.performedBy?.name || 'Unknown'}</div>
                          {log.performedBy && (
                            <div className="text-xs text-slate-400">
                              {log.performedBy.role} - {log.performedBy.branchId?.name || 'No branch'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


