import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ROLE_LABEL } from '../lib/labStore';
import type { Role } from '../lib/labStore';
import { BtnGhost, BtnPrimary } from './ui';

/* Admin Panel → Users: add people, change roles, reset passwords, remove accounts.
   Everything goes through the `manage-users` Edge Function (supabase/functions),
   which holds the service-role key and re-checks the caller's role. */

interface UserRow {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  lastSignIn: string | null;
  isYou: boolean;
}

const ROLES = Object.keys(ROLE_LABEL) as Role[];

const FIELD =
  'min-w-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-strong)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60';

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase!.functions.invoke('manage-users', { body });
  if (error) {
    let message = error.message;
    try {
      const j = await (error as { context?: Response }).context?.json();
      if (j?.error) message = j.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }
  return data as T;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never';

export default function UsersPanel() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // 'add' or a user id
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [secret, setSecret] = useState<{ email: string; password: string; kind: 'new' | 'reset' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { users } = await call<{ users: UserRow[] }>({ action: 'list' });
      setUsers(users);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (supabase) load();
  }, [load]);

  if (!supabase) {
    return (
      <p className="px-5 py-16 text-center text-sm muted">
        Accounts need the shared database. Connect Supabase to manage users.
      </p>
    );
  }

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const add = () =>
    run('add', async () => {
      const res = await call<{ email: string; password: string }>({ action: 'create', email, role });
      setSecret({ ...res, kind: 'new' });
      setCopied(false);
      setEmail('');
      setRole('student');
      await load();
    });

  const changeRole = (u: UserRow, next: Role) =>
    run(u.id, async () => {
      await call({ action: 'setRole', userId: u.id, role: next });
      setUsers((list) => list?.map((x) => (x.id === u.id ? { ...x, role: next } : x)) ?? null);
    });

  const reset = (u: UserRow) =>
    run(u.id, async () => {
      const res = await call<{ email: string; password: string }>({ action: 'resetPassword', userId: u.id });
      setSecret({ ...res, kind: 'reset' });
      setCopied(false);
    });

  const remove = (u: UserRow) =>
    run(u.id, async () => {
      await call({ action: 'remove', userId: u.id });
      setConfirmRemove(null);
      setUsers((list) => list?.filter((x) => x.id !== u.id) ?? null);
    });

  const copy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret.password);
      setCopied(true);
    } catch {
      /* clipboard blocked — the password is still on screen */
    }
  };

  return (
    <div className="p-5 sm:p-6">
      {/* Add someone */}
      <h3 className="display text-base font-bold text-[var(--text-strong)]">Add a person</h3>
      <p className="mt-1 text-sm muted">
        LabPilot makes a password for them. Admin, Lab Assistant and Faculty have full access; Students can only view.
      </p>
      <form
        className="mt-4 flex flex-col gap-2.5 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          type="email"
          required
          placeholder="name@example.com"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${FIELD} sm:flex-1`}
        />
        <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={FIELD}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
        <BtnPrimary type="submit" disabled={busy === 'add'} className="justify-center">
          {busy === 'add' ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Add user
        </BtnPrimary>
      </form>

      {/* One-time password */}
      {secret && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {secret.kind === 'new' ? 'Account created' : 'Password reset'} for {secret.email}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-full bg-[var(--surface)] px-4 py-1.5 font-mono text-base tracking-wide text-[var(--text-strong)] select-all">
              {secret.password}
            </code>
            <BtnGhost onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </BtnGhost>
          </div>
          <p className="mt-2 text-xs text-[var(--text-body)]">
            Send this password to them privately. It won't be shown again — if it's lost, use Reset password.
          </p>
          <button onClick={() => setSecret(null)} className="mt-2 text-xs font-medium text-[var(--text-muted)] underline">
            Done, hide it
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Everyone */}
      <h3 className="display mt-8 text-base font-bold text-[var(--text-strong)]">
        People {users && <span className="muted">({users.length})</span>}
      </h3>
      {!users ? (
        <div className="flex items-center gap-2 py-8 text-sm muted">
          {!error && <><Loader2 size={16} className="animate-spin" /> Loading…</>}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                {u.email[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <div className="truncate text-sm font-semibold text-[var(--text-strong)]" title={u.email}>
                  {u.email} {u.isYou && <span className="font-normal muted">(you)</span>}
                </div>
                <div className="text-xs muted">Last sign-in: {when(u.lastSignIn)}</div>
              </div>

              <select
                aria-label={`Role for ${u.email}`}
                value={u.role}
                disabled={u.isYou || busy === u.id}
                title={u.isYou ? "You can't change your own role" : undefined}
                onChange={(e) => changeRole(u, e.target.value as Role)}
                className={FIELD}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                {busy === u.id && <Loader2 size={16} className="animate-spin text-[var(--text-faint)]" />}
                <BtnGhost disabled={busy === u.id} onClick={() => reset(u)} title="Make a new password">
                  <KeyRound size={14} /> Reset password
                </BtnGhost>
                {!u.isYou &&
                  (confirmRemove === u.id ? (
                    <>
                      <BtnPrimary color="red" disabled={busy === u.id} onClick={() => remove(u)}>
                        Remove
                      </BtnPrimary>
                      <BtnGhost onClick={() => setConfirmRemove(null)}>Cancel</BtnGhost>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(u.id)}
                      aria-label={`Remove ${u.email}`}
                      title="Remove account"
                      className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-faint)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
