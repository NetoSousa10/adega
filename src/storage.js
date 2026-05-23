import { get, set, del } from 'idb-keyval';

const KEY = 'adega-pinguim:state:v1';
const SNAPSHOTS_KEY = 'adega-pinguim:snapshots:v1';
const MAX_SNAPSHOTS = 5;
const SCHEMA_VERSION = 1;

// Settings migrations — runs in order on every load. Each migration bumps the
// settingsVersion. Add a new entry when you change defaults that should reach
// existing installs without forcing them to reset.
const SETTINGS_MIGRATIONS = [
  // v1 → v2 — backup reminder default went from 3 → 7 days.
  {
    to: 2,
    apply: (settings) => {
      if (settings.backupReminderDays === 3) settings.backupReminderDays = 7;
      return settings;
    },
  },
  // v2 -> v3: default store name changed from "Adega Pinguim" to "Adega".
  {
    to: 3,
    apply: (settings) => {
      if (settings.storeName === 'Adega Pinguim') settings.storeName = 'Adega';
      return settings;
    },
  },
];
const CURRENT_SETTINGS_VERSION = SETTINGS_MIGRATIONS.length
  ? SETTINGS_MIGRATIONS[SETTINGS_MIGRATIONS.length - 1].to
  : 1;

function migrateSettings(saved) {
  let s = { ...saved };
  const from = s.settingsVersion ?? 1;
  for (const m of SETTINGS_MIGRATIONS) {
    if (from < m.to) s = m.apply(s);
  }
  s.settingsVersion = CURRENT_SETTINGS_VERSION;
  return s;
}

export const DEFAULT_SETTINGS = {
  storeName: 'Adega',
  ownerName: '',
  backupReminderDays: 7,
  lastBackupAt: null,
  lowStockAlert: 6,
  lowMarginAlert: 30,
  settingsVersion: CURRENT_SETTINGS_VERSION,
};

export const EMPTY_STATE = {
  schema: SCHEMA_VERSION,
  products: [],
  sales: [],
  cart: [],
  expenses: [],
  stockMovements: [],
  closures: [],
  categories: null, // null → use DEFAULT_CATEGORIES from data.jsx
  settings: { ...DEFAULT_SETTINGS },
};

export async function loadState() {
  try {
    const raw = await get(KEY);
    if (!raw) return null;
    if (raw.schema !== SCHEMA_VERSION) return null;
    return {
      schema: raw.schema,
      products: raw.products ?? [],
      sales: raw.sales ?? [],
      cart: raw.cart ?? [],
      expenses: raw.expenses ?? [],
      stockMovements: raw.stockMovements ?? [],
      closures: raw.closures ?? [],
      categories: raw.categories ?? null,
      settings: migrateSettings({ ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) }),
    };
  } catch (e) {
    console.error('loadState failed', e);
    return null;
  }
}

export async function saveState(state) {
  try {
    await set(KEY, {
      schema: SCHEMA_VERSION,
      products: state.products,
      sales: state.sales,
      cart: state.cart,
      expenses: state.expenses ?? [],
      stockMovements: state.stockMovements ?? [],
      closures: state.closures ?? [],
      categories: state.categories ?? null,
      settings: state.settings,
    });
  } catch (e) {
    console.error('saveState failed', e);
  }
}

export async function clearState() {
  await del(KEY);
  await del(SNAPSHOTS_KEY);
}

// Rolling buffer of the last N state snapshots (kept in IndexedDB).
// Use case: every confirmed sale calls pushSnapshot — if the live state ever gets
// corrupted, the user can roll back to a recent point.
export async function pushSnapshot(state, reason = 'sale') {
  try {
    const existing = (await get(SNAPSHOTS_KEY)) ?? [];
    const entry = {
      at: new Date().toISOString(),
      reason,
      productsCount: state.products.length,
      salesCount: state.sales.length,
      state: {
        schema: SCHEMA_VERSION,
        products: state.products,
        sales: state.sales,
        settings: state.settings,
      },
    };
    const next = [entry, ...existing].slice(0, MAX_SNAPSHOTS);
    await set(SNAPSHOTS_KEY, next);
  } catch (e) {
    console.error('pushSnapshot failed', e);
  }
}

export async function listSnapshots() {
  return (await get(SNAPSHOTS_KEY)) ?? [];
}

export async function restoreSnapshot(index) {
  const all = await listSnapshots();
  return all[index]?.state ?? null;
}

export function buildBackupBlob(state) {
  const payload = {
    app: 'adega-pinguim',
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    products: state.products,
    sales: state.sales,
    expenses: state.expenses ?? [],
    stockMovements: state.stockMovements ?? [],
    closures: state.closures ?? [],
    categories: state.categories ?? null,
    settings: state.settings,
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export function backupFileName() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `adega-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

// Triggers the OS share sheet with the backup as a JSON file attachment.
// Falls back to a regular download if Web Share API doesn't support files.
// Returns { method: 'share'|'download'|'canceled', ok: bool }.
export async function shareBackup(state) {
  const blob = buildBackupBlob(state);
  const filename = backupFileName();

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
    try {
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup Adega',
          text: 'Backup dos dados da loja',
        });
        return { method: 'share', ok: true };
      }
    } catch (e) {
      if (e?.name === 'AbortError') return { method: 'share', ok: false, canceled: true };
      console.warn('Web Share failed, falling back to download', e);
    }
  }

  // Fallback: trigger a regular download.
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { method: 'download', ok: true };
}

export async function pickAndParseBackup() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('Nenhum arquivo selecionado'));
      try {
        const text = await file.text();
        resolve(parseBackup(text));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (data.app !== 'adega-pinguim') throw new Error('Arquivo não é um backup do Adega');
  if (typeof data.schema !== 'number') throw new Error('Backup sem versão de schema');
  return {
    schema: SCHEMA_VERSION,
    products: Array.isArray(data.products) ? data.products : [],
    sales: Array.isArray(data.sales) ? data.sales : [],
    cart: [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    stockMovements: Array.isArray(data.stockMovements) ? data.stockMovements : [],
    closures: Array.isArray(data.closures) ? data.closures : [],
    categories: Array.isArray(data.categories) ? data.categories : null,
    settings: migrateSettings({ ...DEFAULT_SETTINGS, ...(data.settings ?? {}) }),
  };
}
