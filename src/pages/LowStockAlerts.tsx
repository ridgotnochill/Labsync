import { FileText, ArrowRight, PackageCheck, MapPin } from 'lucide-react';
import { Badge, BtnPrimary, EmptyState, PageHeader } from '../components/ui';
import { UploadButton } from '../components/UploadModal';
import { useLabData } from '../lib/labStore';
import { summarize } from '../lib/summary';

export default function LowStockAlerts() {
  const { inventory, equipment } = useLabData();
  const { lowStock } = summarize(inventory, equipment);

  return (
    <div>
      <PageHeader
        title="Low Stock Alerts"
        subtitle="Items marked Low Stock or Out of Stock — restock these first"
        actions={<BtnPrimary color="orange"><FileText size={16} /> Generate Purchase Request</BtnPrimary>}
      />

      {lowStock.length === 0 ? (
        <EmptyState
          icon={<PackageCheck size={24} />}
          title={inventory.length === 0 ? 'No inventory yet' : 'Everything is stocked'}
          text={
            inventory.length === 0
              ? 'Upload your stock list and any item that is low or out of stock will appear here.'
              : 'No items are low or out of stock right now.'
          }
          action={inventory.length === 0 ? <UploadButton /> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {lowStock.map((it) => {
            const out = it.status === 'Out of Stock';
            const tone = out ? 'text-red-600 dark:text-red-400' : 'text-orange-500';
            return (
              <div key={it.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--text-strong)]">{it.name}</h3>
                    <p className="text-sm muted">{it.category}</p>
                  </div>
                  <Badge tone={out ? 'red' : 'orange'}>{it.status}</Badge>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                  <div>
                    <div className={`display text-3xl font-extrabold tnum ${tone}`}>{it.qty}</div>
                    <div className="text-xs muted">Remaining{it.unit && ` · ${it.unit}`}</div>
                  </div>
                  {it.location && (
                    <span className="flex items-center gap-1 text-xs muted">
                      <MapPin size={13} /> {it.location}
                    </span>
                  )}
                </div>

                <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--border-strong)] py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 transition-colors hover:bg-primary-50 dark:hover:bg-primary-500/10">
                  Request Purchase <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
