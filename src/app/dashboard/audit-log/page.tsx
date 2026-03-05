'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, FileText, Calendar, User, Folder } from 'lucide-react';

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
};

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
              <option value="Appointment">Appointment</option>
              <option value="Patient">Patient</option>
              <option value="User">User</option>
              <option value="Branch">Branch</option>
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
                  {['Date & Time', 'Action', 'Module', 'Performed By', 'Details'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log._id} className="border-b border-slate-50 hover:bg-slate-50">
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
                        {log.performedBy?.name || 'Unknown'}
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

