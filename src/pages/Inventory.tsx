import { useMemo, useState } from 'react';
import { Search, Upload, Download, Plus } from 'lucide-react';
import { inventory, inventoryStats } from '../data';
import type { InvStatus } from '../data';
import { Badge, BtnGhost, BtnPrimary, CATEGORY_TONE, PageHeader, Tabs } from '../components/ui';
import type { Tone } from '../components/ui';

const STATUS_TONE: Record<InvStatus, Tone> = {
  Available: 'green',
  'Low Stock': 'orange',
  'Out of Stock': 'red',
};

const FILTERS = ['All', 'Chemical', 'Glassware', 'Consumables', 'Equipment'];

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card flex items-center justify-between px-5 py-4">
      <span className="text-sm muted">{label}</span>
      <span className={`text-2xl font-bold tnum ${tone}`}>{value}</span>
    </div>
  );
}

export default function Inventory() {
  const [tab, setTab] = useState('All');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return inventory.filter((it) => {
      const matchTab = tab === 'All' || it.category === tab;
      const matchQ = it.name.toLowerCase().includes(q.toLowerCase());
      return matchTab && matchQ;
    });
  }, [tab, q]);

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        subtitle="Manage all lab supplies, chemicals, glassware, and consumables"
        actions={
          <>
            <BtnGhost><Upload size={16} /> Import Excel</BtnGhost>
            <BtnGhost><Download size={16} /> Export</BtnGhost>
            <BtnPrimary><Plus size={16} /> Add Item</BtnPrimary>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Total Items" value={inventoryStats.total} tone="text-primary-600" />
        <MiniStat label="Low Stock" value={inventoryStats.lowStock} tone="text-orange-500" />
        <MiniStat label="Out of Stock" value={inventoryStats.outOfStock} tone="text-red-500" />
        <MiniStat label="Expiring Soon" value={inventoryStats.expiringSoon} tone="text-amber-500" />
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search inventory items..."
            className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <Tabs tabs={FILTERS} active={tab} onChange={setTab} />
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3.5">Item Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Qty</th>
                <th className="px-5 py-3.5">Unit</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((it) => (
                <tr key={it.name} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-900">{it.name}</td>
                  <td className="px-5 py-4">
                    <span className={`font-medium ${CATEGORY_TONE[it.category]}`}>{it.category}</span>
                  </td>
                  <td className="px-5 py-4 tnum text-slate-700">{it.qty}</td>
                  <td className="px-5 py-4 muted">{it.unit}</td>
                  <td className="px-5 py-4 muted">{it.location}</td>
                  <td className="px-5 py-4 tnum muted">{it.expiry ?? '—'}</td>
                  <td className="px-5 py-4"><Badge tone={STATUS_TONE[it.status]}>{it.status}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center muted">No items match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
