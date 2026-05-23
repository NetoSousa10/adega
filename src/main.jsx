import React from 'react';
import ReactDOM from 'react-dom/client';

import './data.jsx';
import './icons.jsx';
import './ui.jsx';
import './screens-tabs.jsx';
import './screens-modals.jsx';
import { DialogHost } from './dialog.jsx';

import {
  loadState, saveState, pushSnapshot, shareBackup, pickAndParseBackup,
  clearState, EMPTY_STATE,
} from './storage.js';

// Intercept the Android/browser back button so it closes the topmost modal
// instead of leaving the PWA. Each modal that uses this pushes its own history
// entry on open and pops it on close.
function useBackClose(isOpen, close) {
  const closeRef = React.useRef(close);
  closeRef.current = close;

  React.useEffect(() => {
    if (!isOpen) return;
    let viaBack = false;
    window.history.pushState({ __adegaModal: true }, '');
    const onPop = () => { viaBack = true; closeRef.current(); };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!viaBack && window.history.state?.__adegaModal) {
        try { window.history.back(); } catch (_) { /* noop */ }
      }
    };
  }, [isOpen]);
}

function App({ initialState }) {
  const TT = window.T;
  const [tab, setTab] = React.useState('inicio');
  const [products, setProducts] = React.useState(initialState.products);
  const [sales, setSales]       = React.useState(initialState.sales);
  const [cart, setCart]         = React.useState(initialState.cart);
  const [expenses, setExpenses] = React.useState(initialState.expenses ?? []);
  const [stockMovements, setStockMovements] = React.useState(initialState.stockMovements ?? []);
  const [closures, setClosures] = React.useState(initialState.closures ?? []);
  const [categories, setCategories] = React.useState(initialState.categories ?? window.DEFAULT_CATEGORIES);
  const [settings, setSettings] = React.useState(initialState.settings);

  const [cashCloseOpen, setCashCloseOpen] = React.useState(false);

  const [editingProduct, setEditingProduct] = React.useState(undefined);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [openPageId, setOpenPageId] = React.useState(null); // 'settings' | 'categories'
  const [detailSale, setDetailSale] = React.useState(null);
  const [successSale, setSuccessSale] = React.useState(null);

  // Hook back-button into modals/sheets so it closes instead of exiting PWA.
  // Settings/Categories share openPageId — nesting them with useBackClose causes
  // history thrashing on transition, so they rely on the ← header button instead.
  useBackClose(editingProduct !== undefined, () => setEditingProduct(undefined));
  useBackClose(checkoutOpen, () => setCheckoutOpen(false));
  useBackClose(!!detailSale, () => setDetailSale(null));
  useBackClose(!!successSale, () => setSuccessSale(null));
  useBackClose(cashCloseOpen, () => setCashCloseOpen(false));

  // Persist on changes (debounced).
  const saveTimer = React.useRef(null);
  React.useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState({ products, sales, cart, expenses, stockMovements, closures, categories, settings });
    }, 200);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [products, sales, cart, expenses, stockMovements, closures, categories, settings]);

  // Sync categories to the legacy window globals consumed across screens.
  React.useLayoutEffect(() => {
    window.CATEGORIES = [{ id: 'all', label: 'Todas' }, ...categories];
    window.CAT_TONE = Object.fromEntries(categories.map(c => [c.id, c.tone]));
    window.CAT_LABEL = Object.fromEntries(categories.map(c => [c.id, c.labelSingular || c.label]));
  }, [categories]);

  const shareBackupNow = async () => {
    const r = await shareBackup({ products, sales, settings });
    if (r.ok) setSettings(s => ({ ...s, lastBackupAt: new Date().toISOString() }));
    return r;
  };

  const restoreFromFile = async () => {
    const loaded = await pickAndParseBackup();
    const ok = await window.askConfirm({
      title: 'Substituir todos os dados?',
      message: 'O backup vai sobrescrever produtos, vendas e configurações atuais. Sem volta.',
      confirmLabel: 'Substituir', danger: true,
    });
    if (!ok) return false;
    setProducts(loaded.products);
    setSales(loaded.sales);
    setSettings(loaded.settings);
    setCart([]);
    return true;
  };

  // Cap stock movements per product to avoid unbounded growth.
  const MAX_MOVEMENTS_PER_PRODUCT = 30;
  const trimMovements = (list) => {
    const seen = new Map();
    const trimmed = [];
    for (const m of list) {
      const count = seen.get(m.pid) || 0;
      if (count < MAX_MOVEMENTS_PER_PRODUCT) {
        trimmed.push(m);
        seen.set(m.pid, count + 1);
      }
    }
    return trimmed;
  };

  // Logs a stock movement and updates the product's stock.
  // 'entrada' (reposição): increases stock; if unitCost supplied, replaces cost;
  //                        if salePrice supplied, replaces sale price.
  // 'saida' (venda): decreases stock.
  // 'devolucao' (cancelamento): increases stock back.
  // 'ajuste' (manual fix): replaces stock with the given qty.
  const recordStockMovement = (pid, kind, qty, opts = {}) => {
    const product = products.find(p => p.id === pid);
    if (!product) return;
    const movement = {
      id: 'm' + Date.now() + Math.random().toString(36).slice(2,6),
      pid, kind, qty,
      unitCost: opts.unitCost ?? null,
      salePrice: opts.salePrice ?? null,
      note: opts.note ?? null,
      at: new Date().toISOString(),
    };
    setStockMovements(prev => trimMovements([movement, ...prev]));
    setProducts(prev => prev.map(p => {
      if (p.id !== pid) return p;
      if (kind === 'entrada') {
        return {
          ...p,
          stock: p.stock + qty,
          cost:  opts.unitCost  != null ? opts.unitCost  : p.cost,
          price: opts.salePrice != null ? opts.salePrice : p.price,
        };
      }
      if (kind === 'saida')     return { ...p, stock: Math.max(0, p.stock - qty) };
      if (kind === 'devolucao') return { ...p, stock: p.stock + qty };
      if (kind === 'ajuste')    return { ...p, stock: qty };
      return p;
    }));
  };

  const saveCategory = (cat) => {
    setCategories(prev => {
      const exists = prev.find(c => c.id === cat.id);
      if (exists) return prev.map(c => c.id === cat.id ? cat : c);
      return [...prev, cat];
    });
  };
  const removeCategory = (catId) => {
    if (products.some(p => p.cat === catId)) {
      window.notify('Não dá pra remover', 'Existem produtos nesta categoria. Mude-os primeiro.');
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const recordClosure = (closure) => {
    setClosures(prev => [{ ...closure, id: 'c' + Date.now() }, ...prev]);
  };

  const addExpense = (label, amount, kind = 'mensal') => {
    setExpenses(prev => [{
      id: 'e' + Date.now(),
      label, amount, kind,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };
  const removeExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  // Recompute sale totals from its lines, treating canceled lines as zero.
  const recomputeSale = (sale) => {
    const active = sale.lines.filter(l => !l.canceled);
    const total  = active.reduce((s, l) => s + l.price * l.qty, 0);
    const cost   = active.reduce((s, l) => s + l.cost  * l.qty, 0);
    const allCanceled = sale.lines.length > 0 && active.length === 0;
    return {
      ...sale,
      total, cost, profit: total - cost,
      status: allCanceled ? 'cancelada' : (sale.status === 'cancelada' ? 'confirmada' : sale.status),
      canceledAt: allCanceled ? (sale.canceledAt || new Date().toISOString()) : null,
    };
  };

  const cancelSaleLine = async (saleId, lineIndex) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    const line = sale.lines[lineIndex];
    if (!line || line.canceled) return;
    const ok = await window.askConfirm({
      title: 'Cancelar este item?',
      message: `${line.qty}× ${line.name} — o estoque será devolvido.`,
      confirmLabel: 'Cancelar item', danger: true,
    });
    if (!ok) return;
    setSales(prev => prev.map(s => {
      if (s.id !== saleId) return s;
      const lines = s.lines.map((l, i) => i === lineIndex ? { ...l, canceled: true } : l);
      return recomputeSale({ ...s, lines });
    }));
    setProducts(prev => prev.map(p => p.id === line.pid ? { ...p, stock: p.stock + line.qty } : p));
    setStockMovements(prev => trimMovements([{
      id: 'm' + Date.now() + Math.random().toString(36).slice(2,6),
      pid: line.pid, kind: 'devolucao', qty: line.qty,
      unitCost: null, note: `Cancelamento linha da venda #${saleId}`,
      at: new Date().toISOString(),
    }, ...prev]));
  };

  const cancelSale = async (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.status === 'cancelada') return;
    const ok = await window.askConfirm({
      title: 'Cancelar esta venda?',
      message: 'O estoque será devolvido e ela não entrará nos relatórios.',
      confirmLabel: 'Cancelar venda', danger: true,
    });
    if (!ok) return;
    setSales(prev => prev.map(s => s.id === saleId
      ? { ...s, status: 'cancelada', canceledAt: new Date().toISOString() }
      : s));
    setProducts(prev => prev.map(p => {
      const line = sale.lines.find(l => l.pid === p.id);
      return line ? { ...p, stock: p.stock + line.qty } : p;
    }));
    const refundMovements = sale.lines.map(l => ({
      id: 'm' + Date.now() + Math.random().toString(36).slice(2,6),
      pid: l.pid, kind: 'devolucao', qty: l.qty,
      unitCost: null, note: `Cancelamento venda #${sale.id}`,
      at: new Date().toISOString(),
    }));
    setStockMovements(prev => trimMovements([...refundMovements, ...prev]));
  };

  const wipeAllData = async () => {
    const ok1 = await window.askConfirm({
      title: 'Apagar todos os dados?',
      message: 'Produtos, vendas, despesas e configurações. Sem volta.',
      confirmLabel: 'Apagar tudo', danger: true,
    });
    if (!ok1) return false;
    const ok2 = await window.askConfirm({
      title: 'Tem certeza absoluta?',
      message: 'Recomendamos exportar um backup antes.',
      confirmLabel: 'Sim, apagar', danger: true,
    });
    if (!ok2) return false;
    await clearState();
    setProducts([]); setSales([]); setCart([]); setExpenses([]); setStockMovements([]); setClosures([]);
    setCategories(window.DEFAULT_CATEGORIES);
    setSettings({ ...EMPTY_STATE.settings });
    return true;
  };

  const daysSinceBackup = settings.lastBackupAt
    ? Math.floor((Date.now() - new Date(settings.lastBackupAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const backupOverdue = sales.length > 0 && (
    daysSinceBackup === null || daysSinceBackup >= (settings.backupReminderDays ?? 3)
  );

  const ctx = {
    products, sales, cart, setCart, setTab, settings, setSettings,
    expenses, addExpense, removeExpense,
    stockMovements, recordStockMovement,
    closures, recordClosure,
    categories, saveCategory, removeCategory,
    openCashClose: () => setCashCloseOpen(true),
    shareBackupNow, restoreFromFile, wipeAllData, cancelSale, cancelSaleLine,
    daysSinceBackup, backupOverdue,
    openProduct: (p) => setEditingProduct(p),
    openCheckout: () => setCheckoutOpen(true),
    openSale: (s) => setDetailSale(s),
    openPage: (id) => setOpenPageId(id),
  };

  const saveProduct = (p) => {
    if (p.id) setProducts(prev => prev.map(x => x.id === p.id ? p : x));
    else setProducts(prev => [{ ...p, id: 'p' + Date.now() }, ...prev]);
    setEditingProduct(undefined);
  };
  const deleteProduct = () => {
    setProducts(prev => prev.filter(x => x.id !== editingProduct.id));
    setEditingProduct(undefined);
  };

  const confirmSale = (payment) => {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const cost  = cart.reduce((s, i) => s + i.cost  * i.qty, 0);
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const newSale = {
      id: 'v' + Date.now(), day: 0, time, dateLabel: 'Hoje',
      lines: cart.map(c => {
        const prod = products.find(p => p.id === c.pid);
        return { pid: c.pid, name: c.name, volume: prod?.volume, cat: prod?.cat, qty: c.qty, price: c.price, cost: c.cost };
      }),
      total, cost, profit: total - cost, payment, status: 'confirmada',
    };
    const nextSales = [newSale, ...sales];
    const nextProducts = products.map(p => {
      const line = cart.find(c => c.pid === p.id);
      return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
    });
    const saleMovements = cart.map(c => ({
      id: 'm' + Date.now() + Math.random().toString(36).slice(2,6),
      pid: c.pid, kind: 'saida', qty: c.qty,
      unitCost: null, note: `Venda #${newSale.id}`,
      at: new Date().toISOString(),
    }));
    setSales(nextSales);
    setProducts(nextProducts);
    setStockMovements(prev => trimMovements([...saleMovements, ...prev]));
    setCart([]); setCheckoutOpen(false); setSuccessSale(newSale);
    pushSnapshot({ products: nextProducts, sales: nextSales, settings }, 'sale');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: TT.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ height: '100%', width: '100%' }}>
          {tab === 'inicio'     && <window.DashboardScreen ctx={ctx}/>}
          {tab === 'produtos'   && <window.ProductsScreen ctx={ctx}/>}
          {tab === 'vender'     && <window.SellScreen ctx={ctx}/>}
          {tab === 'vendas'     && <window.SalesScreen ctx={ctx}/>}
          {tab === 'relatorios' && <window.ReportsScreen ctx={ctx}/>}
        </div>
      </div>

      <window.BottomNav tab={tab} onTab={setTab}/>

      {editingProduct !== undefined && (
        <window.ProductForm
          product={editingProduct ? products.find(p => p.id === editingProduct.id) ?? editingProduct : null}
          stockMovements={stockMovements}
          onRestock={(pid, qty, unitCost, salePrice) => recordStockMovement(pid, 'entrada', qty, { unitCost, salePrice })}
          onAdjust={(pid, qty) => recordStockMovement(pid, 'ajuste', qty, { note: 'ajuste manual' })}
          onSave={saveProduct}
          onDelete={deleteProduct}
          onClose={() => setEditingProduct(undefined)}/>
      )}
      {checkoutOpen && (
        <window.CheckoutScreen
          cart={cart} products={products}
          onConfirm={confirmSale}
          onClose={() => setCheckoutOpen(false)}/>
      )}
      {detailSale && (
        <window.SaleDetail
          sale={sales.find(s => s.id === detailSale.id) ?? detailSale}
          products={products}
          onCancel={() => cancelSale(detailSale.id)}
          onCancelLine={(idx) => cancelSaleLine(detailSale.id, idx)}
          onClose={() => setDetailSale(null)}/>
      )}
      {openPageId === 'settings' && (
        <window.SettingsScreen ctx={ctx} onClose={() => setOpenPageId(null)}/>
      )}
      {openPageId === 'categories' && (
        <window.CategoriesScreen ctx={ctx} onClose={() => setOpenPageId('settings')}/>
      )}
      {cashCloseOpen && (
        <window.CashCloseScreen ctx={ctx} onClose={() => setCashCloseOpen(false)}/>
      )}
      <window.SuccessSheet
        open={!!successSale}
        sale={successSale}
        onClose={() => setSuccessSale(null)}
        onViewDetail={() => { setDetailSale(successSale); setSuccessSale(null); setTab('vendas'); }}/>

      <DialogHost/>
    </div>
  );
}

function Splash({ label = 'Carregando…' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F3EE',
      fontFamily: "'Manrope', system-ui, sans-serif",
      color: '#1A1D1F', fontSize: 16, fontWeight: 700,
    }}>{label}</div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('App crash:', err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{
          position: 'absolute', inset: 0, padding: 24, overflow: 'auto',
          background: '#FAE2D9', color: '#7A2010',
          fontFamily: "'Manrope', system-ui, sans-serif",
        }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Erro ao renderizar o app</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 0 }}>
            {String(this.state.err && this.state.err.stack || this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [initial, setInitial] = React.useState(null);

  React.useLayoutEffect(() => {
    Object.assign(window.T, {
      primary: '#1F7A4D', primaryD: '#155F3B',
      primarySoft: '#E2F1E8', primaryInk: '#0E4C2F',
    });
    window.T._heroDark = true;
    window.T._raisedCenter = true;
  }, []);

  React.useEffect(() => {
    (async () => {
      const loaded = await loadState();
      setInitial(loaded ?? { ...EMPTY_STATE });
    })();
  }, []);

  if (!initial) return <Splash/>;
  return <ErrorBoundary><App initialState={initial}/></ErrorBoundary>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
