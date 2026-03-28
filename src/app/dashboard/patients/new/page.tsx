'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: 'Male', address: '',
    medicalHistory: '', allergies: '',
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
    // Clear field error when user starts typing
    if (k === 'phone' || k === 'email') {
      setFieldErrors(e => ({ ...e, [k]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        // Handle duplicate error - highlight the field
        if (res.status === 409) {
          const errorMsg = data.message || '';
          if (errorMsg.includes('phone')) {
            setFieldErrors({ phone: errorMsg });
            toast.error(errorMsg);
          } else if (errorMsg.includes('email')) {
            setFieldErrors({ email: errorMsg });
            toast.error(errorMsg);
          } else {
            toast.error(errorMsg);
          }
          return;
        }
        throw new Error(data.message);
      }
      toast.success('Patient registered!');
      router.push('/dashboard/patients');
    } catch (err: any) {
      toast.error(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/patients" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">Register New Patient</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone *</label>
            <input 
              className={`input ${fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`} 
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
            {fieldErrors.phone && <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input 
              className={`input ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`} 
              type="email" 
              value={form.email} 
              onChange={e => set('email', e.target.value)} 
            />
            {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Date of Birth *</label>
            <input className="input" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
          </div>
          <div>
            <label className="label">Gender *</label>
            <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>

        <div>
          <label className="label">Medical History</label>
          <textarea className="input" rows={3} placeholder="Pre-existing conditions, medications…" value={form.medicalHistory} onChange={e => set('medicalHistory', e.target.value)} />
        </div>

        <div>
          <label className="label">Allergies</label>
          <input className="input" placeholder="e.g. Penicillin, latex…" value={form.allergies} onChange={e => set('allergies', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Registering…' : 'Register Patient'}
          </button>
          <Link href="/dashboard/patients" className="btn-secondary flex-1 text-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
