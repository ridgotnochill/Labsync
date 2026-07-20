// seed.js — one-time sample data so the app isn't empty on first open.
// Runs only when there are no items yet. Safe to delete for a clean start.
import { store, todayStr } from './store.js';

export async function seedIfEmpty() {
  const items = await store.listItems();
  const users = await store.listUsers();

  if (!users.length) {
    await store.signup({
      username: 'demo',
      name: 'Demo Technician',
      pin: '1234',
      department: 'Chemistry',
    });
  }

  if (items.length) return;

  const samples = [
    { name: 'Digital Analytical Balance', department: 'Chemistry', category: 'Measurement', location: 'Lab A · Bench 3', owner: 'Dr. Rao', unit: 'units', stock: 4, minStock: 2, condition: 'working' },
    { name: 'Nitrile Gloves (M)', department: 'Chemistry', category: 'Consumables', location: 'Store · Shelf 1', owner: 'Lab Store', unit: 'boxes', stock: 6, minStock: 8, condition: 'working' },
    { name: 'Bunsen Burner', department: 'Chemistry', category: 'Heating', location: 'Lab A', owner: 'Dr. Rao', unit: 'units', stock: 12, minStock: 6, condition: 'working' },
    { name: 'pH Meter', department: 'Biology', category: 'Measurement', location: 'Lab B · Bench 1', owner: 'Ms. Iyer', unit: 'units', stock: 2, minStock: 1, condition: 'under-repair' },
    { name: 'Ethanol 99% (500ml)', department: 'Biology', category: 'Reagents', location: 'Flammables cabinet', owner: 'Ms. Iyer', unit: 'bottles', stock: 3, minStock: 5, condition: 'working' },
    { name: 'Compound Microscope', department: 'Biology', category: 'Optics', location: 'Lab B · Cabinet 2', owner: 'Ms. Iyer', unit: 'units', stock: 8, minStock: 4, condition: 'working' },
    { name: 'Oscilloscope', department: 'Physics', category: 'Electronics', location: 'Lab C · Bench 5', owner: 'Mr. Khan', unit: 'units', stock: 3, minStock: 2, condition: 'broken' },
    { name: 'Petri Dishes', department: 'Biology', category: 'Consumables', location: 'Store · Shelf 4', owner: 'Lab Store', unit: 'packs', stock: 20, minStock: 10, condition: 'working' },
  ];

  for (const s of samples) await store.createItem(s);

  // A little usage history so averages/trends aren't blank.
  const all = await store.listItems();
  const demo = (await store.listUsers()).find((u) => u.username === 'demo');
  const days = [3, 2, 1].map((back) => {
    const d = new Date();
    d.setDate(d.getDate() - back);
    return todayStr(d);
  });
  const consumables = all.filter((i) =>
    ['Consumables', 'Reagents'].includes(i.category)
  );
  for (const it of consumables) {
    for (const date of days) {
      await store.logUsage({
        itemId: it.id,
        userId: demo.id,
        date,
        used: Math.ceil(Math.random() * 2),
        note: '',
      });
    }
  }
}
