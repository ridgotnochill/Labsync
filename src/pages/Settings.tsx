import { useState } from 'react';
import { User, Lock, Bell, Database, Cog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { profile } from '../data';
import { BtnPrimary, PageHeader } from '../components/ui';

const SECTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'backup', label: 'Backup', icon: Database },
  { key: 'system', label: 'System', icon: Cog },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        defaultValue={value}
        className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </label>
  );
}

export default function Settings() {
  const [active, setActive] = useState('profile');

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, security preferences, and system configuration"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sub-nav */}
        <div className="card h-max p-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active === s.key
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <s.icon size={17} /> {s.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Profile Information</h3>

          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-slate-50/60 p-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-xl font-semibold text-white">
              A
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">Dr. Admin</div>
              <div className="text-sm muted">Administrator · Mithibai College</div>
            </div>
            <button className="ml-auto rounded-lg border border-primary-200 bg-primary-50 px-3.5 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100">
              Change Photo
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Full Name" value={profile.fullName} />
            <Field label="Employee ID" value={profile.employeeId} />
            <Field label="Email Address" value={profile.email} />
            <Field label="Phone Number" value={profile.phone} />
            <Field label="Department" value={profile.department} />
            <Field label="Designation" value={profile.designation} />
          </div>

          <div className="mt-6 flex justify-end">
            <BtnPrimary>Save Changes</BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
