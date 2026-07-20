import { Download, Plus } from 'lucide-react';
import { schedule, scheduleDays, scheduleTimes } from '../data';
import type { Slot } from '../data';
import { BtnGhost, BtnPrimary, PageHeader } from '../components/ui';

const CELL: Record<Slot['kind'], string> = {
  occupied: 'bg-red-50 border-red-100',
  reserved: 'bg-blue-50 border-blue-100',
  available: 'bg-emerald-50 border-emerald-100',
};
const TITLE_COLOR: Record<Slot['kind'], string> = {
  occupied: 'text-red-700',
  reserved: 'text-blue-700',
  available: 'text-emerald-700',
};

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm muted">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

export default function LabSchedule() {
  return (
    <div>
      <PageHeader
        title="Laboratory Schedule"
        subtitle="Weekly timetable for all laboratory sessions — Academic Year 2024–25"
        actions={
          <>
            <BtnGhost><Download size={16} /> Export PDF</BtnGhost>
            <BtnPrimary><Plus size={16} /> Add Session</BtnPrimary>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Legend color="bg-red-500" label="Occupied" />
          <Legend color="bg-blue-500" label="Reserved" />
          <Legend color="bg-emerald-500" label="Available" />
        </div>
        <span className="rounded-lg border border-[var(--border-strong)] bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
          Week of 01 Jul 2024
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="border-b border-[var(--border)] px-4 py-3.5">Time Slot</th>
                {scheduleDays.map((d) => (
                  <th key={d} className="border-b border-l border-[var(--border)] px-4 py-3.5">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleTimes.map((time, r) => (
                <tr key={time} className="align-top">
                  <td className="border-b border-[var(--border)] px-4 py-3 text-sm font-medium text-slate-600">{time}</td>
                  {schedule[r].map((slot, c) => (
                    <td key={c} className="border-b border-l border-[var(--border)] p-2">
                      <div className={`min-h-[74px] rounded-lg border p-2.5 ${CELL[slot.kind]}`}>
                        {slot.kind === 'available' ? (
                          <div className="grid h-full min-h-[54px] place-items-center text-sm font-medium text-emerald-700">
                            Available
                          </div>
                        ) : (
                          <div className="leading-snug">
                            <div className={`text-sm font-semibold ${TITLE_COLOR[slot.kind]}`}>{slot.title}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{slot.faculty}</div>
                            <div className="text-xs text-slate-500">{slot.lab}</div>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
