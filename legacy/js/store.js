// store.js — data access layer for LabPilot.
//
// Every method is async (returns a Promise) even though the current
// implementation is synchronous localStorage. This is deliberate: to move to a
// real shared backend later, reimplement ONLY this file (swap the bodies for
// fetch() calls to your API) and the rest of the app keeps working unchanged.
//
// Data shapes
//   User      { id, username, name, pin, department, createdAt }
//   Item      { id, name, department, category, location, owner,
//               unit, stock, minStock, condition, lastService, createdAt }
//   UsageLog  { id, itemId, userId, date (YYYY-MM-DD), used, note, createdAt }
//   Login     { userId, date (YYYY-MM-DD) }   // records a daily check-in

const KEYS = {
  users: 'labpilot.users',
  items: 'labpilot.items',
  usage: 'labpilot.usage',
  logins: 'labpilot.logins',
  session: 'labpilot.session',
};

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Small artificial delay so the UI is written as if talking to a network,
// making the eventual backend swap seamless. Set to 0 to disable.
const LATENCY = 0;
const settle = (value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));

export const store = {
  // ---- Users / auth -----------------------------------------------------
  async listUsers() {
    return settle(read(KEYS.users));
  },

  async signup({ username, name, pin, department }) {
    const users = read(KEYS.users);
    username = username.trim().toLowerCase();
    if (users.some((u) => u.username === username)) {
      throw new Error('That username is already taken.');
    }
    const user = {
      id: uid(),
      username,
      name: name.trim() || username,
      pin: String(pin),
      department: (department || '').trim(),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    write(KEYS.users, users);
    return settle(user);
  },

  async login({ username, pin }) {
    const users = read(KEYS.users);
    username = username.trim().toLowerCase();
    const user = users.find((u) => u.username === username);
    if (!user || user.pin !== String(pin)) {
      throw new Error('Wrong username or PIN.');
    }
    write(KEYS.session, user.id);
    // Record the daily check-in (one per user per day).
    const today = todayStr();
    const logins = read(KEYS.logins);
    if (!logins.some((l) => l.userId === user.id && l.date === today)) {
      logins.push({ userId: user.id, date: today });
      write(KEYS.logins, logins);
    }
    return settle(user);
  },

  async currentUser() {
    const id = localStorage.getItem(KEYS.session);
    if (!id) return settle(null);
    const user = read(KEYS.users).find((u) => u.id === id) || null;
    return settle(user);
  },

  async logout() {
    localStorage.removeItem(KEYS.session);
    return settle(true);
  },

  async loginDates(userId) {
    return settle(
      read(KEYS.logins)
        .filter((l) => l.userId === userId)
        .map((l) => l.date)
        .sort()
    );
  },

  // ---- Items ------------------------------------------------------------
  async listItems() {
    return settle(read(KEYS.items));
  },

  async getItem(id) {
    return settle(read(KEYS.items).find((i) => i.id === id) || null);
  },

  async createItem(data) {
    const items = read(KEYS.items);
    const item = {
      id: uid(),
      name: '',
      department: '',
      category: '',
      location: '',
      owner: '',
      unit: 'units',
      stock: 0,
      minStock: 0,
      condition: 'working',
      lastService: '',
      createdAt: new Date().toISOString(),
      ...data,
    };
    item.stock = Number(item.stock) || 0;
    item.minStock = Number(item.minStock) || 0;
    items.push(item);
    write(KEYS.items, items);
    return settle(item);
  },

  async updateItem(id, patch) {
    const items = read(KEYS.items);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Item not found.');
    items[idx] = { ...items[idx], ...patch };
    items[idx].stock = Number(items[idx].stock) || 0;
    items[idx].minStock = Number(items[idx].minStock) || 0;
    write(KEYS.items, items);
    return settle(items[idx]);
  },

  async deleteItem(id) {
    write(
      KEYS.items,
      read(KEYS.items).filter((i) => i.id !== id)
    );
    // Also drop that item's usage history.
    write(
      KEYS.usage,
      read(KEYS.usage).filter((u) => u.itemId !== id)
    );
    return settle(true);
  },

  // ---- Usage logging ----------------------------------------------------
  async listUsage(itemId = null) {
    let rows = read(KEYS.usage);
    if (itemId) rows = rows.filter((u) => u.itemId === itemId);
    return settle(rows);
  },

  // Log usage for an item on a given date. Decrements stock by `used`.
  // If a log already exists for that item+date, it is replaced (and stock
  // is corrected by the delta) so re-logging the same day is safe.
  async logUsage({ itemId, userId, date, used, note }) {
    date = date || todayStr();
    used = Number(used) || 0;
    const usage = read(KEYS.usage);
    const items = read(KEYS.items);
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found.');

    const existing = usage.find((u) => u.itemId === itemId && u.date === date);
    const prevUsed = existing ? existing.used : 0;

    // Adjust stock by the change vs. what was previously logged that day.
    item.stock = Math.max(0, Number(item.stock) - (used - prevUsed));

    if (existing) {
      existing.used = used;
      existing.note = note || '';
      existing.userId = userId;
    } else {
      usage.push({
        id: uid(),
        itemId,
        userId,
        date,
        used,
        note: note || '',
        createdAt: new Date().toISOString(),
      });
    }
    write(KEYS.usage, usage);
    write(KEYS.items, items);
    return settle(true);
  },

  // Add or subtract stock directly (restock / correction), no usage log.
  async adjustStock(itemId, delta) {
    const items = read(KEYS.items);
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found.');
    item.stock = Math.max(0, Number(item.stock) + Number(delta));
    write(KEYS.items, items);
    return settle(item);
  },

  // ---- Danger zone ------------------------------------------------------
  async resetAll() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    return settle(true);
  },
};

export function todayStr(d = new Date()) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

// Average daily usage for an item, computed over the days it was actually
// logged (not calendar days), so occasional logging still gives a fair number.
export function averageUsage(usageRows) {
  if (!usageRows.length) return 0;
  const total = usageRows.reduce((s, u) => s + Number(u.used || 0), 0);
  return total / usageRows.length;
}

// How many days of stock remain at the current average usage rate.
export function daysRemaining(stock, avgPerDay) {
  if (avgPerDay <= 0) return Infinity;
  return stock / avgPerDay;
}
