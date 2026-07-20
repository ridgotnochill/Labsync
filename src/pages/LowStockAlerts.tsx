import { FileText, ArrowRight } from 'lucide-react';
import { lowStock } from '../data';
import { Badge, BtnPrimary, PageHeader } from '../components/ui';

function StatBox({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 px-3 py-3 text-center">
      <div className={`text-2xl font-bold tnum ${tone}`}>{value}</div>
      <div className="mt-0.5 text-xs muted">{label}</div>
    </div>
  );
}

export default function LowStockAlerts() {
  return (
    <div>
      <PageHeader
        title="Low Stock Alerts"
        subtitle="Items below minimum threshold — immediate restocking required"
        actions={<BtnPrimary color="orange"><FileText size={16} /> Generate Purchase Request</BtnPrimary>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {lowStock.map((it) => {
          const pct = Math.round((it.remaining / it.minimum) * 100);
          const critical = it.level === 'Critical';
          const remainingTone = critical ? 'text-red-600' : 'text-orange-500';
          return (
            <div key={it.name} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{it.name}</h3>
                  <p className="text-sm muted">Unit: {it.unit}</p>
                </div>
                <Badge tone={critical ? 'red' : 'orange'}>{it.level}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <StatBox value={it.remaining} label="Remaining" tone={remainingTone} />
                <StatBox value={it.minimum} label="Minimum" tone="text-slate-700" />
                <StatBox value={it.recommended} label="Recommended" tone="text-primary-600" />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="muted">Current stock level</span>
                  <span className={`font-semibold ${remainingTone}`}>{pct}% of minimum</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${critical ? 'bg-red-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50">
                Request Purchase <ArrowRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
