import { useState } from 'react';
import { User, Lock, Bell, Database, Cog, Trash2, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { profile } from '../data';
import { BtnGhost, BtnPrimary, PageHeader } from '../components/ui';
import { useLabData } from '../lib/labStore';

const SECTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'backup', label: 'Data & Backup', icon: Database },
  { key: 'system', label: 'System', icon: Cog },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--text-body)]">{label}</span>
      <input
        defaultValue={value}
        className="w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-strong)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
              className={`flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
                active === s.key
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                  : 'text-[var(--text-body)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <s.icon size={17} /> {s.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        {active === 'backup' ? (
          <DataPanel />
        ) : (
          <div className="card p-6">
            <h3 className="display text-lg font-bold text-[var(--text-strong)]">Profile Information</h3>

            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-xl font-semibold text-white">
                A
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-[var(--text-strong)]">Dr. Admin</div>
                <div className="text-sm muted">Administrator · Mithibai College</div>
              </div>
              <button className="ml-auto rounded-full border border-primary-200 dark:border-primary-500/25 bg-primary-50 dark:bg-primary-500/10 px-3.5 py-2 text-sm font-medium text-primary-700 dark:text-primary-400 transition-colors hover:bg-primary-100 dark:hover:bg-primary-500/20">
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
        )}
      </div>
    </div>
  );
}

function DataPanel() {
  const { inventory, equipment, uploads, source, clearAll } = useLabData();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function clear() {
    setBusy(true);
    try {
      await clearAll();
      setMessage('All inventory, equipment and upload history has been cleared.');
    } catch (e) {
      setMessage(`Couldn't clear data: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="card p-6">
      <h3 className="display text-lg font-bold text-[var(--text-strong)]">Data &amp; Backup</h3>
      <p className="mt-1 text-sm muted">
        {source === 'supabase' ? 'Stored in the shared LabSync database.' : 'Stored in this browser only (database not connected).'}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Inventory items', inventory.length],
          ['Equipment', equipment.length],
          ['Uploads', uploads.length],
        ].map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <div className="display text-2xl font-extrabold tnum text-[var(--text-strong)]">{n}</div>
            <div className="text-xs muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/25 dark:bg-red-500/10">
        <div className="font-semibold text-red-700 dark:text-red-400">Clear all data</div>
        <p className="mt-1 text-sm text-[var(--text-body)]">
          Deletes every inventory item, equipment record and upload from LabSync so you can start again from zero. This can't be undone.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {!confirming ? (
            <BtnPrimary color="red" onClick={() => { setMessage(null); setConfirming(true); }}>
              <Trash2 size={15} /> Clear all data
            </BtnPrimary>
          ) : (
            <>
              <BtnPrimary color="red" disabled={busy} onClick={clear}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Yes, delete everything
              </BtnPrimary>
              <BtnGhost disabled={busy} onClick={() => setConfirming(false)}>Cancel</BtnGhost>
            </>
          )}
        </div>
        {message && <p className="mt-3 text-sm font-medium text-[var(--text-body)]">{message}</p>}
      </div>
    </div>
  );
}
