import { Download, Plus } from 'lucide-react';
import { schedule, scheduleDays, scheduleTimes } from '../data';
import type { Slot } from '../data';
import { BtnGhost, BtnPrimary, PageHeader } from '../components/ui';

const CELL: Record<Slot['kind'], string> = {
  occupied: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/25',
  reserved: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/25',
  available: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/25',
};
const TITLE_COLOR: Record<Slot['kind'], string> = {
  occupied: 'text-red-700 dark:text-red-400',
  reserved: 'text-blue-700 dark:text-blue-400',
  available: 'text-emerald-700 dark:text-emerald-400',
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
        <span className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-body)]">
          Week of 01 Jul 2024
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <th className="border-b border-[var(--border)] px-4 py-3.5">Time Slot</th>
                {scheduleDays.map((d) => (
                  <th key={d} className="border-b border-l border-[var(--border)] px-4 py-3.5">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleTimes.map((time, r) => (
                <tr key={time} className="align-top">
                  <td className="border-b border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-body)]">{time}</td>
                  {schedule[r].map((slot, c) => (
                    <td key={c} className="border-b border-l border-[var(--border)] p-2">
                      <div className={`min-h-[74px] rounded-xl border p-2.5 ${CELL[slot.kind]}`}>
                        {slot.kind === 'available' ? (
                          <div className="grid h-full min-h-[54px] place-items-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            Available
                          </div>
                        ) : (
                          <div className="leading-snug">
                            <div className={`text-sm font-semibold ${TITLE_COLOR[slot.kind]}`}>{slot.title}</div>
                            <div className="mt-0.5 text-xs text-[var(--text-muted)]">{slot.faculty}</div>
                            <div className="text-xs text-[var(--text-muted)]">{slot.lab}</div>
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
