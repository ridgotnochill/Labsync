import { useState } from 'react';
import { Upload, Plus, Eye, Pencil } from 'lucide-react';
import { adminTabs, labs } from '../data';
import { Badge, BtnGhost, BtnPrimary, PageHeader, Tabs } from '../components/ui';

export default function AdminPanel() {
  const [tab, setTab] = useState('Labs');

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage departments, labs, users, and access permissions"
        actions={
          <>
            <BtnGhost><Upload size={16} /> Import</BtnGhost>
            <BtnPrimary><Plus size={16} /> Create New</BtnPrimary>
          </>
        }
      />

      <Tabs tabs={adminTabs} active={tab} onChange={setTab} />

      <div className="card mt-5 overflow-hidden">
        {tab === 'Labs' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">Lab Name</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Capacity</th>
                  <th className="px-5 py-3.5">Lab Assistant</th>
                  <th className="px-5 py-3.5">Equipment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {labs.map((l) => (
                  <tr key={l.name} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900">{l.name}</td>
                    <td className="px-5 py-4 text-slate-700">{l.department}</td>
                    <td className="px-5 py-4 muted">{l.capacity}</td>
                    <td className="px-5 py-4 text-slate-700">{l.assistant}</td>
                    <td className="px-5 py-4 muted">{l.equipment}</td>
                    <td className="px-5 py-4"><Badge tone="green">Active</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="View">
                          <Eye size={16} />
                        </button>
                        <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid place-items-center px-5 py-16 text-center">
            <p className="text-sm muted">
              <span className="font-medium text-slate-700">{tab}</span> management coming up next.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
