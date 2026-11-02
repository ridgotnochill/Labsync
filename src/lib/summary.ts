import type { ExpiryStatus } from '../data';
import type { EquipmentRecord, InventoryRecord } from './labStore';

/* Counts and lists derived from the live inventory + equipment, shared by the
   Dashboard, Sidebar badge, Low Stock Alerts and Chemical Expiry pages. */

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from today until a YYYY-MM-DD date (negative once it has passed). */
export function daysUntil(date: string, now = new Date()): number {
  const [y, m, d] = date.split('-').map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / DAY);
}

export function expiryStatus(days: number): ExpiryStatus {
  if (days <= 14) return 'Critical';
  if (days <= 60) return 'Warning';
  return 'Safe';
}

export interface ExpiringItem extends InventoryRecord {
  expiry: string;
  days: number;
  expiryStatus: ExpiryStatus;
}

export function summarize(inventory: InventoryRecord[], equipment: EquipmentRecord[]) {
  const lowStock = inventory.filter((it) => it.status !== 'Available');
  const withExpiry: ExpiringItem[] = inventory
    .filter((it): it is InventoryRecord & { expiry: string } => !!it.expiry)
    .map((it) => {
      const days = daysUntil(it.expiry);
      return { ...it, days, expiryStatus: expiryStatus(days) };
    })
    .sort((a, b) => a.days - b.days);

  return {
    totalItems: inventory.length,
    totalEquipment: equipment.length,
    /** Low Stock + Out of Stock, most urgent first. */
    lowStock: lowStock.sort((a, b) => a.qty - b.qty),
    outOfStock: inventory.filter((it) => it.status === 'Out of Stock').length,
    /** Every item with an expiry date, soonest first. */
    withExpiry,
    /** Expiring within 90 days (including already expired). */
    expiringSoon: withExpiry.filter((it) => it.days <= 90).length,
    underMaintenance: equipment.filter((e) => e.status === 'Under Maintenance').length,
  };
}
