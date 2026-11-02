import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { equipment as seedEquipment, inventory as seedInventory, profile } from '../data';
import type { Equipment, InventoryItem } from '../data';
import { supabase } from './supabase';

/* Inventory + equipment records, shared by every page. Backed by Supabase when
   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, otherwise by localStorage. */

export type InventoryRecord = InventoryItem & { id: number };
export type EquipmentRecord = Equipment & { id: number };

/** A confirmed upload: rows with an `id` update that record, rows without are new. */
export interface UploadPlan {
  inventory: (InventoryItem & { id?: number })[];
  equipment: (Equipment & { id?: number })[];
}

export interface UploadResult {
  added: number;
  updated: number;
}

/** One confirmed upload, newest first in `uploads`. */
export interface UploadLog {
  fileName: string;
  uploadedBy: string;
  added: number;
  updated: number;
  at: string;
}

interface LabData {
  inventory: InventoryRecord[];
  equipment: EquipmentRecord[];
  loading: boolean;
  error: string | null;
  source: 'supabase' | 'local';
  /** Lower-cased names of rows changed by the most recent upload (for highlighting). */
  recent: Set<string>;
  uploads: UploadLog[];
  applyUpload: (plan: UploadPlan, fileName: string) => Promise<UploadResult>;
  /** Delete every inventory item, equipment record and upload log entry. */
  clearAll: () => Promise<void>;
}

const LabDataContext = createContext<LabData | null>(null);

/* ---------------------------------------------------------------- local --- */

// v2: the store now starts empty; v1 held the old sample data, which is ignored.
const LOCAL_KEY = 'labpilot.data.v2';

interface LocalData {
  inventory: InventoryRecord[];
  equipment: EquipmentRecord[];
  uploads: UploadLog[];
}

const EMPTY: LocalData = { inventory: [], equipment: [], uploads: [] };

function loadLocal(): LocalData {
  try {
    localStorage.removeItem('labsync.data');
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<LocalData>) };
  } catch {
    /* fall through to seed data */
  }
  return {
    inventory: seedInventory.map((it, i) => ({ ...it, id: i + 1 })),
    equipment: seedEquipment.map((e, i) => ({ ...e, id: i + 1 })),
    uploads: [],
  };
}

function saveLocal(data: LocalData) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked — changes still show for this session */
  }
}

function mergeLocal<T extends { id: number }>(rows: T[], changes: (Omit<T, 'id'> & { id?: number })[]): T[] {
  const next = [...rows];
  let nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  for (const c of changes) {
    const i = c.id === undefined ? -1 : next.findIndex((r) => r.id === c.id);
    if (i >= 0) next[i] = { ...next[i], ...c, id: next[i].id };
    else next.push({ ...c, id: nextId++ } as T);
  }
  return next;
}

/* ------------------------------------------------------------- supabase --- */

interface InventoryRow {
  id: number;
  name: string;
  category: InventoryItem['category'];
  qty: number;
  unit: string;
  location: string;
  expiry: string | null;
  status: InventoryItem['status'];
}

interface EquipmentRow {
  id: number;
  name: string;
  serial: string;
  lab: string;
  status: Equipment['status'];
  calibration_due: string;
  last_serviced: string;
  next_service: string;
}

const toEquipment = (r: EquipmentRow): EquipmentRecord => ({
  id: r.id,
  name: r.name,
  serial: r.serial,
  lab: r.lab,
  status: r.status,
  calibrationDue: r.calibration_due,
  lastServiced: r.last_serviced,
  nextService: r.next_service,
});

const fromEquipment = (e: Equipment & { id?: number }) => ({
  ...(e.id !== undefined && { id: e.id }),
  name: e.name,
  serial: e.serial,
  lab: e.lab,
  status: e.status,
  calibration_due: e.calibrationDue,
  last_serviced: e.lastServiced,
  next_service: e.nextService,
  updated_at: new Date().toISOString(),
});

const fromInventory = (it: InventoryItem & { id?: number }) => ({
  ...(it.id !== undefined && { id: it.id }),
  name: it.name,
  category: it.category,
  qty: it.qty,
  unit: it.unit,
  location: it.location,
  expiry: it.expiry,
  status: it.status,
  updated_at: new Date().toISOString(),
});

interface UploadRow {
  file_name: string;
  uploaded_by: string;
  items_added: number;
  items_updated: number;
  created_at: string;
}

async function fetchRemote(): Promise<LocalData> {
  const db = supabase!;
  const [inv, eq, up] = await Promise.all([
    db.from('inventory_items').select('id,name,category,qty,unit,location,expiry,status').order('id'),
    db.from('equipment').select('id,name,serial,lab,status,calibration_due,last_serviced,next_service').order('id'),
    db.from('uploads').select('file_name,uploaded_by,items_added,items_updated,created_at').order('created_at', { ascending: false }).limit(20),
  ]);
  if (inv.error) throw inv.error;
  if (eq.error) throw eq.error;
  if (up.error) throw up.error;
  return {
    inventory: (inv.data as InventoryRow[]).map((r) => ({ ...r })),
    equipment: (eq.data as EquipmentRow[]).map(toEquipment),
    uploads: (up.data as UploadRow[]).map((u) => ({
      fileName: u.file_name,
      uploadedBy: u.uploaded_by,
      added: u.items_added,
      updated: u.items_updated,
      at: u.created_at,
    })),
  };
}

async function clearRemote() {
  const db = supabase!;
  // PostgREST refuses unfiltered deletes; `id >= 0` matches every row.
  for (const table of ['inventory_items', 'equipment', 'uploads']) {
    const { error } = await db.from(table).delete().gte('id', 0);
    if (error) throw error;
  }
}

async function writeRemote(plan: UploadPlan, fileName: string, result: UploadResult) {
  const db = supabase!;
  const split = <T extends { id?: number }>(rows: T[]) => [
    rows.filter((r) => r.id !== undefined),
    rows.filter((r) => r.id === undefined),
  ];
  const [invUpd, invNew] = split(plan.inventory);
  const [eqUpd, eqNew] = split(plan.equipment);

  const ops = [
    invUpd.length && db.from('inventory_items').upsert(invUpd.map(fromInventory), { onConflict: 'id' }),
    invNew.length && db.from('inventory_items').insert(invNew.map(fromInventory)),
    eqUpd.length && db.from('equipment').upsert(eqUpd.map(fromEquipment), { onConflict: 'id' }),
    eqNew.length && db.from('equipment').insert(eqNew.map(fromEquipment)),
  ].filter(Boolean) as PromiseLike<{ error: unknown }>[];
  for (const { error } of await Promise.all(ops)) if (error) throw error;

  await db.from('uploads').insert({
    file_name: fileName,
    uploaded_by: profile.fullName,
    items_added: result.added,
    items_updated: result.updated,
  });
}

/* ------------------------------------------------------------- provider --- */

export function LabDataProvider({ children }: { children: ReactNode }) {
  const source = supabase ? 'supabase' : 'local';
  const [data, setData] = useState<LocalData>(() =>
    supabase ? EMPTY : loadLocal()
  );
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase) return;
    fetchRemote()
      .then(setData)
      .catch((e) => setError(`Couldn't load data from Supabase: ${e.message ?? e}`))
      .finally(() => setLoading(false));
  }, []);

  const applyUpload = useCallback(
    async (plan: UploadPlan, fileName: string): Promise<UploadResult> => {
      const all = [...plan.inventory, ...plan.equipment];
      const result = {
        added: all.filter((r) => r.id === undefined).length,
        updated: all.filter((r) => r.id !== undefined).length,
      };

      if (supabase) {
        await writeRemote(plan, fileName, result);
        setData(await fetchRemote());
      } else {
        const log: UploadLog = { fileName, uploadedBy: profile.fullName, ...result, at: new Date().toISOString() };
        setData((d) => {
          const next = {
            inventory: mergeLocal(d.inventory, plan.inventory),
            equipment: mergeLocal(d.equipment, plan.equipment),
            uploads: [log, ...d.uploads].slice(0, 20),
          };
          saveLocal(next);
          return next;
        });
      }
      setRecent(new Set(all.map((r) => r.name.trim().toLowerCase())));
      return result;
    },
    []
  );

  const clearAll = useCallback(async () => {
    if (supabase) await clearRemote();
    saveLocal(EMPTY);
    setData(EMPTY);
    setRecent(new Set());
  }, []);

  return (
    <LabDataContext.Provider value={{ ...data, loading, error, source, recent, applyUpload, clearAll }}>
      {children}
    </LabDataContext.Provider>
  );
}

export function useLabData(): LabData {
  const ctx = useContext(LabDataContext);
  if (!ctx) throw new Error('useLabData must be used inside <LabDataProvider>');
  return ctx;
}
