import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Package, Search, Wrench, X } from 'lucide-react';
import { Badge, EQUIP_STATUS_TONE, INV_STATUS_TONE } from './ui';
import { useLabData } from '../lib/labStore';

const MIN_CHARS = 2;
const MAX_RESULTS = 8;

/** Records whose name contains `q`, names starting with it first. */
function matchByName<T extends { name: string }>(records: T[], q: string): T[] {
  const startsWith = (r: T) => r.name.toLowerCase().startsWith(q);
  return records
    .filter((r) => r.name.toLowerCase().includes(q))
    .sort((a, b) => Number(startsWith(b)) - Number(startsWith(a)) || a.name.localeCompare(b.name));
}

/** Top-bar search: type a couple of letters to see how much of an item is in stock. */
export default function QuickSearch() {
  const { inventory, equipment } = useLabData();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  // Phones: the box is hidden behind a search icon and expands over the top bar.
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const expand = () => {
    // Render the box synchronously so focus (and the iOS keyboard) happens within the tap.
    flushSync(() => setExpanded(true));
    inputRef.current?.focus();
  };
  const collapse = () => {
    setExpanded(false);
    setOpen(false);
    setText('');
  };

  const q = text.trim().toLowerCase();
  const active = q.length >= MIN_CHARS;

  const { items, machines, total } = useMemo(() => {
    if (!active) return { items: [], machines: [], total: 0 };
    const allItems = matchByName(inventory, q);
    const allMachines = matchByName(equipment, q);
    return {
      items: allItems.slice(0, MAX_RESULTS),
      machines: allMachines.slice(0, Math.max(0, MAX_RESULTS - allItems.length)),
      total: allItems.length + allMachines.length,
    };
  }, [active, q, inventory, equipment]);

  const shown = items.length + machines.length;

  return (
    <>
    <button
      type="button"
      onClick={expand}
      aria-label="Search items"
      className="muted grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] transition-colors hover:bg-[var(--surface-3)] sm:hidden"
    >
      <Search size={18} />
    </button>
    <div
      className={`${
        expanded ? 'absolute inset-0 z-40 flex items-center gap-2 bg-[var(--surface)] px-3' : 'hidden'
      } sm:static sm:z-auto sm:flex sm:bg-transparent sm:p-0`}
    >
    <div className="relative flex-1 sm:flex-none">
      <Search size={16} className="faint absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        ref={inputRef}
        enterKeyHint="search"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            if (expanded) collapse();
          }
        }}
        aria-label="Search items by name"
        placeholder="Quick search..."
        className="w-full rounded-full border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-faint)] focus:border-primary-500 focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:w-64"
      />

      {open && active && (
        <div
          // Keep focus in the input so clicking the panel (or its scrollbar) doesn't close it.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto sm:left-auto sm:w-96 rounded-3xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-xl"
        >
          {shown === 0 ? (
            <p className="px-5 py-4 text-sm muted">No items match “{text.trim()}”.</p>
          ) : (
            <ul>
              {items.map((it) => (
                <li key={`item-${it.id}`} className="flex items-center gap-3 px-5 py-2.5">
                  <Package size={16} className="shrink-0 text-primary-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-strong)]" title={it.name}>{it.name}</p>
                    <p className="truncate text-xs faint">
                      <span className="tnum">{it.qty}</span> {it.unit}
                      {it.location && ` · ${it.location}`}
                    </p>
                  </div>
                  <Badge tone={INV_STATUS_TONE[it.status]}>{it.status}</Badge>
                </li>
              ))}
              {machines.map((e) => (
                <li key={`equipment-${e.id}`} className="flex items-center gap-3 px-5 py-2.5">
                  <Wrench size={16} className="shrink-0 text-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-strong)]" title={e.name}>{e.name}</p>
                    <p className="truncate text-xs faint">
                      Equipment{e.lab && ` · ${e.lab}`}
                      {e.serial && ` · ${e.serial}`}
                    </p>
                  </div>
                  <Badge tone={EQUIP_STATUS_TONE[e.status]}>{e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          {total > shown && (
            <p className="border-t border-[var(--border)] px-5 pb-1 pt-2.5 text-xs faint">
              Showing {shown} of {total} — type more to narrow it down.
            </p>
          )}
        </div>
      )}
    </div>
    <button
      type="button"
      onClick={collapse}
      aria-label="Close search"
      className="muted grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--surface-3)] sm:hidden"
    >
      <X size={18} />
    </button>
    </div>
    </>
  );
}
