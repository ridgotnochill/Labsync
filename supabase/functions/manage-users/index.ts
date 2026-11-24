// LabPilot account management, called from Admin Panel → Users.
// Runs on Supabase (Deno) because creating/deleting accounts needs the service-role
// key, which must never be shipped to the browser.
//
// Only signed-in users whose role is admin / assistant / faculty may call it
// (the same "full access" roles as public.can_edit()).
//
// Deploy: supabase functions deploy manage-users --no-verify-jwt --project-ref <ref>
// (--no-verify-jwt because the caller's token is checked below with auth.getUser.)
import { createClient } from 'npm:@supabase/supabase-js@2';

const ROLES = ['admin', 'assistant', 'faculty', 'student'] as const;
type Role = (typeof ROLES)[number];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const fail = (error: string, status = 400) => json({ error }, status);

/** 14 characters, no look-alikes (0/O, 1/l/I), so it's easy to read out or type. */
function newPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

const isRole = (r: unknown): r is Role => typeof r === 'string' && (ROLES as readonly string[]).includes(r);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Method not allowed', 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Who is calling?
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller.user) return fail('Please sign in again.', 401);
  const { data: me } = await admin.from('user_roles').select('role').eq('user_id', caller.user.id).maybeSingle();
  if (!me || me.role === 'student') return fail('Only Admin, Lab Assistant and Faculty accounts can manage users.', 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail('Bad request');
  }
  const self = caller.user.id;

  switch (body.action) {
    case 'list': {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) return fail(error.message, 500);
      const { data: roles } = await admin.from('user_roles').select('user_id, role');
      const roleOf = new Map((roles ?? []).map((r) => [r.user_id, r.role as Role]));
      const users = data.users
        .map((u) => ({
          id: u.id,
          email: u.email ?? '',
          role: roleOf.get(u.id) ?? 'student',
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at ?? null,
          isYou: u.id === self,
        }))
        .sort((a, b) => a.email.localeCompare(b.email));
      return json({ users });
    }

    case 'create': {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');
      if (!isRole(body.role)) return fail('Pick a role.');
      const password = newPassword();
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) {
        return fail(/already.*registered|exists/i.test(error.message) ? 'An account with this email already exists.' : error.message);
      }
      // The on_auth_user_created trigger has already added a 'student' row.
      const { error: roleError } = await admin
        .from('user_roles')
        .upsert({ user_id: data.user.id, email, role: body.role });
      if (roleError) return fail(`Account created, but setting the role failed: ${roleError.message}`, 500);
      return json({ email, password });
    }

    case 'setRole': {
      const id = String(body.userId ?? '');
      if (id === self) return fail("You can't change your own role.");
      if (!isRole(body.role)) return fail('Pick a role.');
      const { error } = await admin.from('user_roles').update({ role: body.role }).eq('user_id', id);
      if (error) return fail(error.message, 500);
      return json({ ok: true });
    }

    case 'resetPassword': {
      const id = String(body.userId ?? '');
      const password = newPassword();
      const { data, error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return fail(error.message, 500);
      return json({ email: data.user.email, password });
    }

    case 'remove': {
      const id = String(body.userId ?? '');
      if (id === self) return fail("You can't remove your own account.");
      const { error } = await admin.auth.admin.deleteUser(id); // user_roles row goes with it (on delete cascade)
      if (error) return fail(error.message, 500);
      return json({ ok: true });
    }

    default:
      return fail('Unknown action');
  }
});
