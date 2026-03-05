'use client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDate, STATUS_COLORS, formatTime } from '@/lib/utils';
import { AppointmentStatus } from '@/types';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const patientId = params?.id;

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetch(`/api/patients/${patientId}`).then(r => r.json()).then(r => r.data),
    enabled: !!patientId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?patientId=${patientId}`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    enabled: !!patientId,
  });

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Invalid patient ID</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  if (!patient) return <div className="text-slate-500">Patient not found.</div>;

  return (
    <div className="animate-fade-in max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/patients" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="page-title">{patient.firstName} {patient.lastName}</h1>
          {patient.isActive === false && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              Inactive
            </span>
          )}
        </div>
        <Link href={`/dashboard/patients/${params.id}/edit`} className="ml-auto btn-secondary text-sm">
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-2">
          <h3 className="section-title mb-3">Personal Info</h3>
          <InfoRow label="Phone" value={patient.phone} />
          <InfoRow label="Email" value={patient.email || '—'} />
          <InfoRow label="Gender" value={patient.gender} />
          <InfoRow label="DOB" value={formatDate(patient.dateOfBirth)} />
          <InfoRow label="Address" value={patient.address || '—'} />
        </div>
        <div className="card space-y-2">
          <h3 className="section-title mb-3">Medical Info</h3>
          <div>
            <p className="text-xs text-slate-400 mb-1">Medical History</p>
            <p className="text-sm text-slate-700">
              {patient.medicalHistory || <span className="italic text-slate-400">None on record</span>}
            </p>
          </div>
          <div className="pt-3">
            <p className="text-xs text-slate-400 mb-1">Allergies</p>
            <p className="text-sm text-slate-700">
              {patient.allergies || <span className="italic text-slate-400">None known</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Appointment History</h3>
        {appointments.length === 0 ? (
          <p className="text-slate-400 text-sm">No appointments yet</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((a: any) => (
              <div key={a._id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{formatDate(a.date)} · {formatTime(a.startTime)}</p>
                  <p className="text-slate-500 text-xs">Dr. {a.dentistId?.userId?.name} — {a.reason}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[a.status as AppointmentStatus]}`}>
                  {a.status}
                </span>
                <Link href={`/dashboard/appointments/${a._id}`} className="text-brand-600 hover:underline text-xs">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-20 text-slate-400 shrink-0">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}