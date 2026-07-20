import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
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

const KEY = 'labsync.authed';

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(KEY) === '1');

  const login = () => {
    localStorage.setItem(KEY, '1');
    setAuthed(true);
  };
  const logout = () => {
    localStorage.removeItem(KEY);
    setAuthed(false);
  };

  if (!authed) return <Login onLogin={login} />;

  return (
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
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
