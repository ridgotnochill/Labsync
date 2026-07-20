import { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { equipment } from '../data';
import type { EquipStatus } from '../data';
import { Badge, BtnGhost, BtnPrimary, PageHeader, Tabs } from '../components/ui';
import type { Tone } from '../components/ui';

const STATUS_TONE: Record<EquipStatus, Tone> = {
  Working: 'green',
  'Under Maintenance': 'red',
  'Calibration Due': 'amber',
};

const SUMMARY: { status: EquipStatus; dot: string; ring: string }[] = [
  { status: 'Working', dot: 'bg-emerald-500', ring: 'border-emerald-200 bg-emerald-50/50' },
  { status: 'Under Maintenance', dot: 'bg-red-500', ring: 'border-red-200 bg-red-50/50' },
  { status: 'Calibration Due', dot: 'bg-amber-500', ring: 'border-amber-200 bg-amber-50/50' },
];

const FILTERS = ['All', 'Working', 'Under Maintenance', 'Calibration Due'];

export default function Equipment() {
  const [tab, setTab] = useState('All');
  const rows = useMemo(
    () => (tab === 'All' ? equipment : equipment.filter((e) => e.status === tab)),
    [tab]
  );
  const count = (s: EquipStatus) => equipment.filter((e) => e.status === s).length;

  return (
    <div>
      <PageHeader
        title="Equipment Management"
        subtitle="Track lab instruments, calibration schedules, and service history"
        actions={
          <>
            <BtnGhost><Download size={16} /> Export</BtnGhost>
            <BtnPrimary><Plus size={16} /> Add Equipment</BtnPrimary>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SUMMARY.map((s) => (
          <div key={s.status} className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${s.ring}`}>
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.status}
            </span>
            <span className="text-2xl font-bold tnum text-slate-900">{count(s.status)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Tabs tabs={FILTERS} active={tab} onChange={setTab} />
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3.5">Equipment Name</th>
                <th className="px-5 py-3.5">Serial No.</th>
                <th className="px-5 py-3.5">Assigned Lab</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Calibration Due</th>
                <th className="px-5 py-3.5">Last Serviced</th>
                <th className="px-5 py-3.5">Next Service</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((e) => (
                <tr key={e.serial} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-900">{e.name}</td>
                  <td className="px-5 py-4 tnum muted">{e.serial}</td>
                  <td className="px-5 py-4 text-slate-700">{e.lab}</td>
                  <td className="px-5 py-4"><Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge></td>
                  <td className="px-5 py-4 tnum muted">{e.calibrationDue}</td>
                  <td className="px-5 py-4 muted">{e.lastServiced}</td>
                  <td className="px-5 py-4 muted">{e.nextService}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
