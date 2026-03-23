'use client';
import { useState, FormEvent } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getLoginUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin + '/login';
    }
    return '/login';
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    // Clear any existing session first to prevent conflicts
    await signOut({ redirect: false, callbackUrl: getLoginUrl() });
    
    const res = await signIn('credentials', {
      email, password, redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🦷</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">ILoveDentist</h1>
          <p className="text-slate-500 mt-1">Clinic Management System</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-xl border-0">
          <h2 className="section-title mb-6 text-center">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@clinic.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Authorization reminder */}
          <div className="mt-6 p-3 bg-amber-50 rounded-lg text-xs text-amber-800">
            <p className="font-semibold mb-1">Authorized access only</p>
            <p>This system is for authorized personnel only. Unauthorized access is prohibited.</p>
            <div className="mt-2">
              <Link href="/landing" className="text-amber-700 underline">
                Back to Landing Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

