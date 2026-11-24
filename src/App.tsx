import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { LabDataProvider, useLabData } from './lib/labStore';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Equipment from './pages/Equipment';
import LabSchedule from './pages/LabSchedule';
import LowStockAlerts from './pages/LowStockAlerts';
import ChemicalExpiry from './pages/ChemicalExpiry';
import DamageReports from './pages/DamageReports';
import Notifications from './pages/Notifications';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';

// Only used without Supabase (local demo mode); with Supabase the session comes from Supabase Auth.
const KEY = 'labpilot.authed';

/** Students are sent to the dashboard (the database also refuses their writes). */
function EditorsOnly({ children }: { children: JSX.Element }) {
  const { canEdit, roleLoading } = useLabData();
  if (roleLoading) return null;
  return canEdit ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  // null = still checking for a saved Supabase session.
  const [authed, setAuthed] = useState<boolean | null>(() =>
    supabase ? null : localStorage.getItem(KEY) === '1'
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuthed(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  const login = () => {
    if (supabase) return; // onAuthStateChange flips `authed`
    localStorage.setItem(KEY, '1');
    setAuthed(true);
  };
  const logout = () => {
    if (supabase) {
      supabase.auth.signOut();
      return;
    }
    localStorage.removeItem(KEY);
    setAuthed(false);
  };

  if (authed === null) return <div className="min-h-dvh bg-[var(--rail)]" />;
  if (!authed) return <Login onLogin={login} />;

  return (
    <LabDataProvider>
      <AppLayout onLogout={logout}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/schedule" element={<LabSchedule />} />
          <Route path="/low-stock" element={<LowStockAlerts />} />
          <Route path="/chemical-expiry" element={<ChemicalExpiry />} />
          <Route path="/damage-reports" element={<DamageReports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin" element={<EditorsOnly><AdminPanel /></EditorsOnly>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </LabDataProvider>
  );
}
