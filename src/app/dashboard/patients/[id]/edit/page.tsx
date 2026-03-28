'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditPatientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  // Ensure params.id is available
  const patientId = params?.id;
  
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: 'Male', address: '',
    medicalHistory: '', allergies: '',
  });
  const [ready, setReady] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetch(`/api/patients/${patientId}`).then(r => r.json()).then(r => r.data),
    enabled: !!patientId,
  });

  // Handle missing patientId
  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Invalid patient ID</p>
      </div>
    );
  }

  // Populate form when patient data is loaded
  useEffect(() => {
    if (patient) {
      setForm({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email || '',
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
        gender: patient.gender,
        address: patient.address || '',
        medicalHistory: patient.medicalHistory || '',
        allergies: patient.allergies || '',
      });
      setReady(true);
    }
  }, [patient]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => fetch(`/api/patients/${patientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) return toast.error(data.message);
      toast.success('Patient updated');
      router.push(`/dashboard/patients/${patientId}`);
    },
  });

  function normalizePhilPhoneInput(raw: string) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('+')) {
      const digits = trimmed.slice(1).replace(/\D/g, '');
      const withCountry = `+${digits}`;
      return withCountry.slice(0, 13); // +63 + 10 digits
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    return digitsOnly.slice(0, 11); // 09 + 9 digits
  }

  function set(k: string, v: string) { 
    const nextValue = k === 'phone' ? normalizePhilPhoneInput(v) : v;
    setForm(f => ({ ...f, [k]: nextValue })); 
  }

  if (!ready) return <div className="text-center py-16 text-slate-400">Loading…</div>;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/patients/${patientId}`} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">Edit Patient</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></div>
          <div><label className="label">Last Name *</label><input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone *</label>
            <input 
              className="input" 
              type="tel" 
              value={form.phone} 
              onChange={e => set('phone', e.target.value)} 
              inputMode="numeric"
              maxLength={form.phone.startsWith('+') ? 13 : 11}
              pattern="^(09\d{9}|\+639\d{9})$"
              placeholder="09XXXXXXXXX or +639XXXXXXXXX"
              title="Use PH mobile format: 09XXXXXXXXX or +639XXXXXXXXX"
              required 
            />
          </div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Date of Birth *</label><input className="input" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required /></div>
          <div><label className="label">Gender *</label><select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
        </div>
        <div><label className="label">Address</label><input className="input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
        <div><label className="label">Medical History</label><textarea className="input" rows={3} value={form.medicalHistory} onChange={e => set('medicalHistory', e.target.value)} /></div>
        <div><label className="label">Allergies</label><input className="input" value={form.allergies} onChange={e => set('allergies', e.target.value)} /></div>
        <div className="flex gap-3">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/dashboard/patients/${patientId}`} className="btn-secondary flex-1 text-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
