import { useState } from 'react';
import { FlaskConical, GraduationCap, Beaker, UserCog, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ROLES: { key: string; label: string; icon: LucideIcon; desc: string }[] = [
  { key: 'admin', label: 'Admin', icon: Shield, desc: 'Full system access' },
  { key: 'assistant', label: 'Lab Assistant', icon: UserCog, desc: 'Manage lab resources' },
  { key: 'faculty', label: 'Faculty', icon: Beaker, desc: 'Schedule & reports' },
  { key: 'student', label: 'Student', icon: GraduationCap, desc: 'View & request' },
];

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [role, setRole] = useState('admin');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--rail)] p-4">
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
          <h1 className="mt-4 text-3xl font-bold text-white">LabSync</h1>
          <p className="mt-1 text-sm text-slate-400">
            Laboratory Management System
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-lg font-semibold text-white">Sign in to continue</h2>
          <p className="mt-1 text-sm text-slate-400">Select your role and enter your credentials.</p>

          {/* Role selector */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-500/15 ring-1 ring-primary-500/40'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      active ? 'bg-primary-600 text-white' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    <r.icon size={16} />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-medium text-white">{r.label}</span>
                    <span className="block text-[11px] text-slate-400">{r.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fields */}
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onLogin();
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email / Employee ID</label>
              <input
                defaultValue="admin@example.com"
                className="w-full rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                defaultValue="password"
                className="w-full rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-zest py-3 text-xs font-bold uppercase tracking-wide text-[#15133d] shadow-lg shadow-zest/20 transition-colors hover:bg-zest-hover"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © 2024 LabSync. For authorized laboratory staff only.
        </p>
      </div>
    </div>
  );
}
