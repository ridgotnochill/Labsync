import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(supabase ? '' : 'admin@example.com');
  const [password, setPassword] = useState(supabase ? '' : 'password');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!supabase) return onLogin(); // local demo mode: no real accounts
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
      return;
    }
    onLogin();
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--rail)] p-4">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-600 text-white shadow-xl shadow-primary-600/40">
            <FlaskConical size={30} />
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white">LabPilot</h1>
          <p className="mt-1 text-sm text-slate-400">
            Laboratory Management System
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-lg font-semibold text-white">Sign in to continue</h2>
          <p className="mt-1 text-sm text-slate-400">Your role comes from your account.</p>

          {/* Fields */}
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-zest disabled:opacity-60 py-3 text-xs font-bold uppercase tracking-wide text-[#15133d] shadow-lg shadow-zest/20 transition-colors hover:bg-zest-hover"
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © 2024 LabPilot. For authorized laboratory staff only.
        </p>
      </div>
    </div>
  );
}
