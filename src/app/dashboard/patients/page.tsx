'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Users, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { STALE_TIMES } from '@/app/providers';
import ConfirmModal from '@/components/ui/ConfirmModal';

const ITEMS_PER_PAGE = 20;

async function deletePatient(id: string) {
  const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

export default function PatientsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const role = session?.user?.role;

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => fetch(`/api/patients?search=${search}&page=${page}&limit=${ITEMS_PER_PAGE}`).then(r => r.json()),
    staleTime: STALE_TIMES.patients,
  });

  const patients = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 };
  const { total, totalPages } = pagination;

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      toast.success('Patient deleted');
      qc.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: () => toast.error('Failed to delete patient'),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Patients</h1>
        {(role === 'admin' || role === 'staff') && (
          <Link href="/dashboard/patients/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Register Patient
          </Link>
        )}
      </div>

      <div className="card p-4 flex items-center gap-2">
        <Search size={16} className="text-slate-400" />
        <input
          className="input flex-1"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable 
              rows={7} 
              columns={7}
              columnWidths={['w-40', 'w-20', 'w-28', 'w-28', 'w-40', 'w-24', 'w-20']}
            />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="mx-auto mb-2 opacity-40" size={40} />
            <p>{search ? 'No patients match your search' : 'No patients registered yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Name','Gender','Date of Birth','Phone','Email','Registered','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p: any) => (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.gender}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(p.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.registeredBy?.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/patients/${p._id}`} className="text-brand-600 hover:underline text-xs font-medium">
                          View
                        </Link>
                        {(role === 'admin' || role === 'staff') && (
                          <button
                            onClick={() => setDeleteId(p._id)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Delete
                          </button>
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

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} — {total} total patient{total !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete patient?"
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
