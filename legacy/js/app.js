// app.js — UI, routing, and view rendering for LabPilot.
import { store, todayStr, averageUsage, daysRemaining } from './store.js';
import { seedIfEmpty } from './seed.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let me = null; // current user

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async function boot() {
  await seedIfEmpty();
  wireAuth();
  const user = await store.currentUser();
  if (user) enterApp(user);
})();

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
function wireAuth() {
  $$('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      $$('.tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      const isLogin = t.dataset.tab === 'login';
      $('#login-form').classList.toggle('hidden', !isLogin);
      $('#signup-form').classList.toggle('hidden', isLogin);
    })
  );

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const user = await store.login({
        username: f.get('username'),
        pin: f.get('pin'),
      });
      enterApp(user);
    } catch (err) {
      $('#login-error').textContent = err.message;
    }
  });

  $('#signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await store.signup({
        username: f.get('username'),
        name: f.get('name'),
        pin: f.get('pin'),
        department: f.get('department'),
      });
      const user = await store.login({
        username: f.get('username'),
        pin: f.get('pin'),
      });
      enterApp(user);
    } catch (err) {
      $('#signup-error').textContent = err.message;
    }
  });

  $('#logout-btn').addEventListener('click', async () => {
    await store.logout();
    location.reload();
  });

  $$('.nav-btn').forEach((b) =>
    b.addEventListener('click', () => {
      $$('.nav-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      render(b.dataset.view);
    })
  );
}

async function enterApp(user) {
  me = user;
  $('#auth').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#user-name').textContent = `${user.name}${
    user.department ? ' · ' + user.department : ''
  }`;
  render('dashboard');
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
async function render(view) {
  const el = $('#view');
  if (view === 'dashboard') el.innerHTML = await renderDashboard();
  else if (view === 'inventory') el.innerHTML = await renderInventory();
  else if (view === 'log') el.innerHTML = await renderLog();
  wireView(view);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
async function renderDashboard() {
  const items = await store.listItems();
  const usage = await store.listUsage();
  const loginDates = await store.loginDates(me.id);

  const byItem = groupBy(usage, 'itemId');
  const enriched = items.map((it) => {
    const rows = byItem[it.id] || [];
    const avg = averageUsage(rows);
    const days = daysRemaining(it.stock, avg);
    return { ...it, avg, days, low: it.stock <= it.minStock };
  });

  const lowStock = enriched.filter((e) => e.low);
  const maintenance = items.filter((i) => i.condition !== 'working');
  const loggedToday = usage.filter((u) => u.date === todayStr());
  const streak = computeStreak(loginDates);

  return `
    <div class="page">
      <div class="page-head">
        <h2>Good to see you, ${escape(me.name.split(' ')[0])} 👋</h2>
        <span class="muted">Today · ${todayStr()} · check-in streak: <strong>${streak} day${streak === 1 ? '' : 's'}</strong></span>
      </div>

      <div class="stat-grid">
        ${statCard('Instruments', items.length, '🧫')}
        ${statCard('Low on stock', lowStock.length, '⚠️', lowStock.length ? 'warn' : '')}
        ${statCard('Need attention', maintenance.length, '🛠️', maintenance.length ? 'warn' : '')}
        ${statCard('Logged today', loggedToday.length, '✅')}
      </div>

      <div class="two-col">
        <section class="panel">
          <h3>⚠️ Low stock</h3>
          ${
            lowStock.length
              ? `<table class="mini">
                  <thead><tr><th>Item</th><th>Stock</th><th>Min</th><th>~Days left</th></tr></thead>
                  <tbody>${lowStock
                    .map(
                      (e) => `<tr>
                        <td>${escape(e.name)}</td>
                        <td class="danger">${e.stock} ${escape(e.unit)}</td>
                        <td>${e.minStock}</td>
                        <td>${fmtDays(e.days)}</td>
                      </tr>`
                    )
                    .join('')}</tbody>
                </table>`
              : `<p class="empty">Everything is well stocked. 🎉</p>`
          }
        </section>

        <section class="panel">
          <h3>🛠️ Needs attention</h3>
          ${
            maintenance.length
              ? `<ul class="plain">${maintenance
                  .map(
                    (i) =>
                      `<li><strong>${escape(i.name)}</strong> <span class="pill ${i.condition}">${labelCondition(
                        i.condition
                      )}</span> <span class="muted">${escape(i.location || '')}</span></li>`
                  )
                  .join('')}</ul>`
              : `<p class="empty">All instruments are working. ✅</p>`
          }
        </section>
      </div>

      <section class="panel">
        <h3>📊 Usage overview</h3>
        ${
          enriched.length
            ? `<table class="mini">
                <thead><tr><th>Item</th><th>Dept</th><th>Stock</th><th>Avg/day</th><th>~Days left</th></tr></thead>
                <tbody>${enriched
                  .sort((a, b) => a.days - b.days)
                  .map(
                    (e) => `<tr class="${e.low ? 'row-warn' : ''}">
                      <td>${escape(e.name)}</td>
                      <td class="muted">${escape(e.department || '—')}</td>
                      <td>${e.stock} ${escape(e.unit)}</td>
                      <td>${e.avg ? e.avg.toFixed(1) : '—'}</td>
                      <td>${fmtDays(e.days)}</td>
                    </tr>`
                  )
                  .join('')}</tbody>
              </table>`
            : `<p class="empty">No instruments yet — add some in the Inventory tab.</p>`
        }
      </section>
    </div>`;
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------
async function renderInventory() {
  const items = (await store.listItems()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return `
    <div class="page">
      <div class="page-head">
        <h2>Inventory <span class="muted">(${items.length})</span></h2>
        <div class="head-actions">
          <input id="search" class="search" placeholder="Search name, dept, location…" />
          <button class="btn primary" id="add-item">+ Add instrument</button>
        </div>
      </div>

      <div id="item-grid" class="card-grid">
        ${items.map(itemCard).join('') || `<p class="empty">No instruments yet.</p>`}
      </div>
    </div>`;
}

function itemCard(it) {
  const low = it.stock <= it.minStock;
  return `
    <div class="item-card ${low ? 'low' : ''}" data-id="${it.id}"
         data-search="${escape((it.name + ' ' + it.department + ' ' + it.location + ' ' + it.category).toLowerCase())}">
      <div class="item-top">
        <h4>${escape(it.name)}</h4>
        <span class="pill ${it.condition}">${labelCondition(it.condition)}</span>
      </div>
      <div class="item-meta">
        ${it.department ? `<span>🏛️ ${escape(it.department)}</span>` : ''}
        ${it.category ? `<span>🏷️ ${escape(it.category)}</span>` : ''}
        ${it.location ? `<span>📍 ${escape(it.location)}</span>` : ''}
        ${it.owner ? `<span>👤 ${escape(it.owner)}</span>` : ''}
      </div>
      <div class="stock-row ${low ? 'danger' : ''}">
        <span class="stock-num">${it.stock}</span>
        <span class="stock-unit">${escape(it.unit)}</span>
        ${low ? '<span class="pill warn">LOW</span>' : ''}
        <span class="muted">min ${it.minStock}</span>
      </div>
      <div class="item-actions">
        <button class="btn tiny" data-act="restock" data-id="${it.id}">Restock</button>
        <button class="btn tiny" data-act="edit" data-id="${it.id}">Edit</button>
        <button class="btn tiny danger-btn" data-act="delete" data-id="${it.id}">Delete</button>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Log usage
// ---------------------------------------------------------------------------
async function renderLog() {
  const items = (await store.listItems()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const today = todayStr();
  const usage = await store.listUsage();
  const todays = new Map(
    usage.filter((u) => u.date === today).map((u) => [u.itemId, u])
  );

  return `
    <div class="page">
      <div class="page-head">
        <h2>Log usage <span class="muted">· ${today}</span></h2>
        <span class="muted">Enter how much of each item was used today. Stock updates automatically.</span>
      </div>

      ${
        items.length
          ? `<table class="log-table">
              <thead><tr><th>Instrument</th><th>In stock</th><th>Used today</th><th>Note</th><th></th></tr></thead>
              <tbody>
                ${items
                  .map((it) => {
                    const cur = todays.get(it.id);
                    return `<tr data-id="${it.id}">
                      <td><strong>${escape(it.name)}</strong><br><span class="muted">${escape(it.department || '')}</span></td>
                      <td>${it.stock} ${escape(it.unit)}</td>
                      <td><input type="number" min="0" step="any" class="log-used" value="${cur ? cur.used : ''}" placeholder="0" /></td>
                      <td><input type="text" class="log-note" value="${cur ? escape(cur.note) : ''}" placeholder="optional" /></td>
                      <td><button class="btn tiny primary log-save">${cur ? 'Update' : 'Save'}</button></td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>`
          : `<p class="empty">Add instruments first in the Inventory tab.</p>`
      }
    </div>`;
}

// ---------------------------------------------------------------------------
// View wiring (event handlers per view)
// ---------------------------------------------------------------------------
function wireView(view) {
  if (view === 'inventory') {
    $('#add-item')?.addEventListener('click', () => openItemModal());
    $('#search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      $$('.item-card').forEach((c) => {
        c.style.display = c.dataset.search.includes(q) ? '' : 'none';
      });
    });
    $$('[data-act]').forEach((btn) =>
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        const act = btn.dataset.act;
        if (act === 'edit') openItemModal(await store.getItem(id));
        else if (act === 'delete') {
          const it = await store.getItem(id);
          if (confirm(`Delete "${it.name}" and its usage history?`)) {
            await store.deleteItem(id);
            render('inventory');
          }
        } else if (act === 'restock') openRestockModal(await store.getItem(id));
      })
    );
  }

  if (view === 'log') {
    $$('.log-save').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const row = btn.closest('tr');
        const id = row.dataset.id;
        const used = $('.log-used', row).value;
        const note = $('.log-note', row).value;
        await store.logUsage({
          itemId: id,
          userId: me.id,
          date: todayStr(),
          used,
          note,
        });
        render('log');
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------
function openItemModal(item = null) {
  const isEdit = !!item;
  const it = item || {};
  modal(
    `${isEdit ? 'Edit' : 'Add'} instrument`,
    `<form id="item-form" class="grid-form">
      <label>Name *<input name="name" value="${escape(it.name || '')}" required /></label>
      <label>Department<input name="department" value="${escape(it.department || '')}" placeholder="e.g. Chemistry" /></label>
      <label>Category<input name="category" value="${escape(it.category || '')}" placeholder="e.g. Glassware" /></label>
      <label>Location<input name="location" value="${escape(it.location || '')}" placeholder="Lab / room / shelf" /></label>
      <label>Responsible person<input name="owner" value="${escape(it.owner || '')}" /></label>
      <label>Unit<input name="unit" value="${escape(it.unit || 'units')}" /></label>
      <label>Current stock<input name="stock" type="number" min="0" step="any" value="${it.stock ?? 0}" /></label>
      <label>Low-stock threshold<input name="minStock" type="number" min="0" step="any" value="${it.minStock ?? 0}" /></label>
      <label>Condition
        <select name="condition">
          ${['working', 'under-repair', 'broken']
            .map(
              (c) =>
                `<option value="${c}" ${it.condition === c ? 'selected' : ''}>${labelCondition(c)}</option>`
            )
            .join('')}
        </select>
      </label>
      <label>Last service / calibration<input name="lastService" type="date" value="${escape(it.lastService || '')}" /></label>
      <div class="modal-actions full">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">${isEdit ? 'Save changes' : 'Add instrument'}</button>
      </div>
    </form>`
  );

  $('#item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (isEdit) await store.updateItem(it.id, data);
    else await store.createItem(data);
    closeModal();
    render('inventory');
  });
}

function openRestockModal(it) {
  modal(
    `Restock — ${escape(it.name)}`,
    `<form id="restock-form" class="grid-form">
      <p class="muted full">Current stock: <strong>${it.stock} ${escape(it.unit)}</strong></p>
      <label class="full">Add quantity<input name="delta" type="number" step="any" value="0" autofocus /></label>
      <p class="muted full">Use a negative number to correct an over-count.</p>
      <div class="modal-actions full">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">Update stock</button>
      </div>
    </form>`
  );
  $('#restock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const delta = new FormData(e.target).get('delta');
    await store.adjustStock(it.id, delta);
    closeModal();
    render('inventory');
  });
}

function modal(title, bodyHtml) {
  $('#modal-root').innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-head"><h3>${title}</h3><button class="x" data-close>×</button></div>
        <div class="modal-body">${bodyHtml}</div>
      </div>
    </div>`;
  $$('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
  $('.modal-backdrop').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
}
function closeModal() {
  $('#modal-root').innerHTML = '';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function statCard(label, value, icon, cls = '') {
  return `<div class="stat ${cls}">
    <span class="stat-icon">${icon}</span>
    <div><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>
  </div>`;
}

function groupBy(arr, key) {
  return arr.reduce((acc, x) => {
    (acc[x[key]] ||= []).push(x);
    return acc;
  }, {});
}

function computeStreak(dates) {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  let d = new Date();
  // Allow the streak to start from today or yesterday.
  if (!set.has(todayStr(d))) d.setDate(d.getDate() - 1);
  while (set.has(todayStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function fmtDays(days) {
  if (days === Infinity) return '—';
  if (days < 1) return '<1 day';
  return `${Math.round(days)} days`;
}

function labelCondition(c) {
  return { working: 'Working', 'under-repair': 'Under repair', broken: 'Broken' }[c] || c;
}

function escape(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}
