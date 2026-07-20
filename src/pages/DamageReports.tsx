import { Search, Plus, Eye, Pencil, GraduationCap, ArrowRight } from 'lucide-react';
import { damageReports, damageStudent } from '../data';
import { Badge, BtnPrimary, PageHeader } from '../components/ui';

export default function DamageReports() {
  return (
    <div>
      <PageHeader
        title="Student Damage & Loss Tracking"
        subtitle="Search by SAP ID to view damage history and manage incident reports"
        actions={<BtnPrimary color="red"><Plus size={16} /> Report Damage</BtnPrimary>}
      />

      {/* Search */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            defaultValue={damageStudent.sapId}
            className="w-full rounded-lg border border-[var(--border)] bg-white py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <BtnPrimary>Search</BtnPrimary>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
          Try: Priya Nair <ArrowRight size={15} />
        </button>
      </div>

      {/* Student card */}
      <div className="card mt-5 flex flex-wrap items-center gap-4 p-5">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <GraduationCap size={22} />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">{damageStudent.name}</h3>
          <p className="text-sm muted">
            SAP ID: {damageStudent.sapId} · {damageStudent.course} · {damageStudent.semester}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {damageStudent.pendingCases && <Badge tone="orange">Has Pending Cases</Badge>}
          <Badge tone="gray">{damageStudent.reports} Reports</Badge>
        </div>
      </div>

      {/* Report cards */}
      <div className="mt-5 space-y-5">
        {damageReports.map((r) => (
          <div key={r.reportNo} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900">{r.item}</h4>
                <p className="text-sm muted">Reported on {r.reportedOn} · Report #{r.reportNo}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="red">Fine: {r.fine}</Badge>
                <Badge tone={r.resolved ? 'green' : 'amber'}>{r.resolved ? 'Resolved' : 'Pending'}</Badge>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</div>
              <p className="mt-1 text-sm text-slate-700">{r.description}</p>
            </div>

            <div className="mt-3 rounded-xl bg-blue-50/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">Faculty Remarks</div>
              <p className="mt-1 text-sm text-slate-700">{r.remarks}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                <Eye size={15} /> View Evidence
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                <Pencil size={15} /> Edit Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
