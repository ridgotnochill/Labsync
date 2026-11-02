import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  X, UploadCloud, FileSpreadsheet, FileText, Download, Loader2, CheckCircle2,
  AlertTriangle, ArrowLeft, Database, HardDrive, Upload, ScanText, Image as ImageIcon,
} from 'lucide-react';
import type { EquipStatus, InvCategory } from '../data';
import { useLabData } from '../lib/labStore';
import type { UploadResult } from '../lib/labStore';
import {
  ACCEPT, TEMPLATE_CSV, describeChange, parseUpload, toPlan,
} from '../lib/parseUpload';
import type { Proposed, ProposedEquipment, ProposedInventory } from '../lib/parseUpload';
import { Badge, BtnGhost, BtnPrimary } from './ui';

type Step =
  | { name: 'pick' }
  | { name: 'reading'; file: File; progress?: string }
  | { name: 'review'; file: File; skipped: number; ocrConfidence?: number }
  | { name: 'saving'; file: File }
  | { name: 'done'; result: UploadResult }
  | { name: 'error'; message: string };

/** Below this mean OCR confidence, warn that the scan is probably misread. */
const OCR_POOR = 75;

const CATEGORIES: InvCategory[] = ['Chemical', 'Glassware', 'Consumables', 'Equipment'];
const EQUIP_STATUSES: EquipStatus[] = ['Working', 'Under Maintenance', 'Calibration Due'];

const FIELD =
  'w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text-strong)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

/* Button that opens the upload dialog — drop it into any page header. */
export function UploadButton({ variant = 'primary', label = 'Upload Update' }: { variant?: 'primary' | 'ghost'; label?: string }) {
  const [open, setOpen] = useState(false);
  const Btn = variant === 'primary' ? BtnPrimary : BtnGhost;
  return (
    <>
      <Btn onClick={() => setOpen(true)}>
        <Upload size={16} /> {label}
      </Btn>
      {open && <UploadModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const { inventory, equipment, applyUpload, source } = useLabData();
  const [step, setStep] = useState<Step>({ name: 'pick' });
  const [rows, setRows] = useState<Proposed[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = step.name === 'reading' || step.name === 'saving';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function handleFile(file: File) {
    setStep({ name: 'reading', file });
    try {
      const { rows, skipped, ocrConfidence } = await parseUpload(file, inventory, equipment, (progress) =>
        setStep({ name: 'reading', file, progress })
      );
      if (rows.length === 0) throw new Error('No item rows were found under the header row.');
      setRows(rows);
      setStep({ name: 'review', file, skipped, ocrConfidence });
    } catch (e) {
      setStep({ name: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function confirm(file: File) {
    setStep({ name: 'saving', file });
    try {
      const result = await applyUpload(toPlan(rows), file.name);
      setStep({ name: 'done', result });
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      setStep({ name: 'error', message: `Saving failed: ${msg}` });
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(['\ufeff' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'labsync-upload-template.csv' });
    a.click();
    URL.revokeObjectURL(url);
  }

  const patch = (key: string, change: Partial<ProposedInventory['item']> | Partial<ProposedEquipment['item']> | { include: boolean }) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        if ('include' in change) return { ...r, include: change.include };
        return { ...r, item: { ...r.item, ...change } } as Proposed;
      })
    );

  const inv = rows.filter((r): r is ProposedInventory => r.kind === 'inventory');
  const eq = rows.filter((r): r is ProposedEquipment => r.kind === 'equipment');
  const included = rows.filter((r) => r.include);
  const newCount = included.filter((r) => !r.existing).length;
  const updCount = included.length - newCount;
  const attention = included.filter((r) => r.notes.length > 0).length;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0a22]/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        className="card fade-rise flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 id="upload-title" className="text-xl font-extrabold text-[var(--text-strong)]">Upload stock update</h2>
            <p className="mt-1 text-sm muted">
              Upload an Excel, CSV, PDF or a photo/scan of your stock list — review it, then add it to LabSync.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="muted grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] transition-colors hover:bg-[var(--surface-3)] disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step.name === 'pick' && (
            <>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                    : 'border-[var(--border-strong)] bg-[var(--surface-2)] hover:border-primary-400'
                }`}
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-lg shadow-primary-600/30">
                  <UploadCloud size={28} />
                </span>
                <span className="display mt-5 text-lg font-bold text-[var(--text-strong)]">Drop your file here</span>
                <span className="mt-1 text-sm muted">
                  or <span className="font-semibold text-primary-600 underline underline-offset-2 dark:text-primary-400">browse</span> to choose one
                </span>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <FormatChip icon={<FileSpreadsheet size={14} />} label="Excel .xlsx / .xls" />
                  <FormatChip icon={<FileSpreadsheet size={14} />} label="CSV" />
                  <FormatChip icon={<FileText size={14} />} label="PDF (incl. scanned)" />
                  <FormatChip icon={<ImageIcon size={14} />} label="Photo · JPG / PNG / HEIC" />
                </div>
                <input
                  type="file"
                  accept={ACCEPT}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                  }}
                />
              </label>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm muted">
                  The file needs a header row — e.g. <b>Name, Category, Quantity, Unit, Location, Expiry Date</b>. Add{' '}
                  <b>Serial No.</b> for instruments so they go to Equipment. Existing items are matched by name (or serial) and updated.
                </p>
                <BtnGhost onClick={downloadTemplate}>
                  <Download size={16} /> Template
                </BtnGhost>
              </div>
              <SourceNote source={source} />
            </>
          )}

          {(step.name === 'reading' || step.name === 'saving') && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 size={36} className="animate-spin text-primary-500" />
              <p className="display mt-4 font-bold text-[var(--text-strong)]">
                {step.name === 'reading' ? 'Scanning file…' : 'Saving to LabSync…'}
              </p>
              <p className="mt-1 text-sm muted">{step.file.name}</p>
              {step.name === 'reading' && step.progress && (
                <p className="mt-3 text-sm font-medium text-primary-600 dark:text-primary-400">{step.progress}</p>
              )}
              {step.name === 'reading' && /\.(png|jpe?g|webp|bmp|gif|heic|heif)$/i.test(step.file.name) && (
                <p className="mt-1 max-w-sm text-xs faint">Photos are read on this device — the first scan downloads the text-recognition engine (a few MB).</p>
              )}
            </div>
          )}

          {step.name === 'review' && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-body)]">
                  {step.ocrConfidence !== undefined ? <ImageIcon size={16} /> : step.file.name.toLowerCase().endsWith('.pdf') ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
                  {step.file.name}
                </span>
                <Badge tone="green">{newCount} new</Badge>
                <Badge tone="blue">{updCount} update{updCount === 1 ? '' : 's'}</Badge>
                {attention > 0 && <Badge tone="amber">{attention} need{attention === 1 ? 's' : ''} a check</Badge>}
                {step.skipped > 0 && <Badge tone="gray">{step.skipped} row{step.skipped === 1 ? '' : 's'} skipped</Badge>}
              </div>
              {step.ocrConfidence !== undefined && (step.ocrConfidence >= OCR_POOR ? (
                <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                  <ScanText size={18} className="mt-0.5 shrink-0" />
                  <span>
                    Read from a photo/scan with text recognition. It can misread letters and numbers — please check every name and quantity
                    against the original before confirming.
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span>
                    <b>This image was hard to read</b> (text-recognition confidence {step.ocrConfidence}%), so many rows below are probably
                    wrong. For best results use the original Excel/PDF file, or a sharp, straight-on photo of a printed sheet in good light —
                    photos of a computer screen read poorly.
                  </span>
                </div>
              ))}
              <p className="mt-2 text-sm muted">
                Check the rows below — fix anything that was read wrong, untick rows you don't want, then confirm.
              </p>

              {inv.length > 0 && (
                <ReviewTable title={`Inventory (${inv.length})`} headers={['Item', 'Category', 'Qty', 'Unit', 'Location', 'Expiry']}>
                  {inv.map((r) => (
                    <ReviewRow key={r.key} row={r} onToggle={(v) => patch(r.key, { include: v })}>
                      <td className="p-2 min-w-56"><input className={FIELD} value={r.item.name} onChange={(e) => patch(r.key, { name: e.target.value })} /></td>
                      <td className="p-2 min-w-36">
                        <select className={FIELD} value={r.item.category} onChange={(e) => patch(r.key, { category: e.target.value as InvCategory })}>
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-2 w-24">
                        <input className={FIELD} type="number" min={0} value={r.item.qty} onChange={(e) => patch(r.key, { qty: Math.max(0, +e.target.value || 0) })} />
                      </td>
                      <td className="p-2 min-w-36"><input className={FIELD} value={r.item.unit} onChange={(e) => patch(r.key, { unit: e.target.value })} /></td>
                      <td className="p-2 min-w-40"><input className={FIELD} value={r.item.location} onChange={(e) => patch(r.key, { location: e.target.value })} /></td>
                      <td className="p-2 w-40">
                        <input className={FIELD} type="date" value={r.item.expiry ?? ''} onChange={(e) => patch(r.key, { expiry: e.target.value || null })} />
                      </td>
                    </ReviewRow>
                  ))}
                </ReviewTable>
              )}

              {eq.length > 0 && (
                <ReviewTable title={`Equipment (${eq.length})`} headers={['Equipment', 'Serial No.', 'Lab', 'Status', 'Calibration Due']}>
                  {eq.map((r) => (
                    <ReviewRow key={r.key} row={r} onToggle={(v) => patch(r.key, { include: v })}>
                      <td className="p-2 min-w-56"><input className={FIELD} value={r.item.name} onChange={(e) => patch(r.key, { name: e.target.value })} /></td>
                      <td className="p-2 min-w-36"><input className={FIELD} value={r.item.serial} onChange={(e) => patch(r.key, { serial: e.target.value })} /></td>
                      <td className="p-2"><input className={FIELD} value={r.item.lab} onChange={(e) => patch(r.key, { lab: e.target.value })} /></td>
                      <td className="p-2 min-w-44">
                        <select className={FIELD} value={r.item.status} onChange={(e) => patch(r.key, { status: e.target.value as EquipStatus })}>
                          {EQUIP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-2"><input className={FIELD} value={r.item.calibrationDue} onChange={(e) => patch(r.key, { calibrationDue: e.target.value })} /></td>
                    </ReviewRow>
                  ))}
                </ReviewTable>
              )}
            </>
          )}

          {step.name === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-zest text-[#15133d]">
                <CheckCircle2 size={30} />
              </span>
              <p className="display mt-5 text-xl font-extrabold text-[var(--text-strong)]">LabSync updated</p>
              <p className="mt-1 text-sm muted">
                {step.result.added} item{step.result.added === 1 ? '' : 's'} added · {step.result.updated} updated
                {source === 'local' && ' · saved in this browser'}
              </p>
            </div>
          )}

          {step.name === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertTriangle size={28} />
              </span>
              <p className="display mt-5 text-lg font-bold text-[var(--text-strong)]">Couldn't use that file</p>
              <p className="mt-2 max-w-lg text-sm muted">{step.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step.name === 'review' || step.name === 'done' || step.name === 'error') && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
            <BtnGhost onClick={() => { setRows([]); setStep({ name: 'pick' }); }}>
              <ArrowLeft size={16} /> {step.name === 'done' ? 'Upload another' : 'Choose another file'}
            </BtnGhost>
            {step.name === 'review' ? (
              <BtnPrimary color="zest" disabled={included.length === 0} onClick={() => confirm(step.file)}>
                <CheckCircle2 size={16} /> Add {included.length} to LabSync
              </BtnPrimary>
            ) : (
              <BtnPrimary onClick={onClose}>Done</BtnPrimary>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function FormatChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-body)]">
      {icon} {label}
    </span>
  );
}

function SourceNote({ source }: { source: 'supabase' | 'local' }) {
  return (
    <p className="mt-4 flex items-center gap-2 text-xs faint">
      {source === 'supabase' ? <Database size={14} /> : <HardDrive size={14} />}
      {source === 'supabase'
        ? 'Changes are saved to the shared LabSync database.'
        : 'Database not connected — changes are saved in this browser only.'}
    </p>
  );
}

function ReviewTable({ title, headers, children }: { title: string; headers: string[]; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="display mb-2 text-xs font-bold tracking-widest muted">{title}</h3>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <th className="w-10 p-2" />
              <th className="w-24 p-2">Change</th>
              {headers.map((h) => <th key={h} className="p-2">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewRow({ row, onToggle, children }: { row: Proposed; onToggle: (v: boolean) => void; children: ReactNode }) {
  const changes = describeChange(row);
  const detail = [...row.notes.map((n) => ({ n, warn: true })), ...changes.map((n) => ({ n, warn: false }))];
  return (
    <>
      <tr className={`align-top ${row.include ? '' : 'opacity-45'}`}>
        <td className="p-2 pt-3.5 text-center">
          <input
            type="checkbox"
            checked={row.include}
            onChange={(e) => onToggle(e.target.checked)}
            aria-label={`Include ${row.item.name}`}
            className="h-4 w-4 accent-primary-600"
          />
        </td>
        <td className="p-2 pt-3">{row.existing ? <Badge tone="blue">Update</Badge> : <Badge tone="green">New</Badge>}</td>
        {children}
      </tr>
      {detail.length > 0 && (
        <tr className={row.include ? '' : 'opacity-45'}>
          <td />
          <td colSpan={7} className="px-2 pb-3 pt-0">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {detail.map(({ n, warn }) => (
                <span key={n} className={warn ? 'font-medium text-amber-700 dark:text-amber-400' : 'muted'}>
                  {warn ? '⚠ ' : ''}{n}
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
