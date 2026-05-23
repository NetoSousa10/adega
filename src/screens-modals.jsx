import React from 'react';
// Modal / overlay screens: ProductForm, Checkout, SaleDetail, Settings, SuccessSheet.
const { T: T2, FONT: F2 } = window;

// ════════════════════════════════════════════════════════════════
// PRODUCT FORM (cadastro / edição)
// ════════════════════════════════════════════════════════════════
function ProductForm({ product, onSave, onClose, onDelete, onRestock, onAdjust, stockMovements }) {
  const empty = { name: '', cat: 'cerv', brand: '', volume: '', cost: 0, price: 0, stock: 0, sku: '', active: true };
  const [p, setP] = React.useState(product ? { ...product, active: product.active !== false } : empty);

  // Sync stock/cost/price when product is updated externally (e.g. restock).
  // We don't sync user-editable fields like name/brand to avoid clobbering unsaved edits.
  React.useEffect(() => {
    if (!product) return;
    setP(prev => ({ ...prev, stock: product.stock, cost: product.cost, price: product.price }));
  }, [product?.stock, product?.cost, product?.price]);

  const lucroUn = p.price - p.cost;
  const margem = p.price ? (lucroUn / p.price) * 100 : 0;

  const set = (k, v) => setP(prev => ({ ...prev, [k]: v }));

  // Validations — errors block submit, warnings allow but flag.
  const errors = [];
  if (!p.name.trim()) errors.push('Informe o nome do produto');
  if (!(p.price > 0)) errors.push('Preço de venda precisa ser maior que zero');
  if (p.cost < 0) errors.push('Custo não pode ser negativo');
  if (p.stock < 0) errors.push('Estoque não pode ser negativo');
  const warnings = [];
  if (p.price > 0 && p.cost >= p.price) warnings.push('O preço de venda não cobre o custo');

  const canSubmit = errors.length === 0;
  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ ...p, name: p.name.trim(), brand: p.brand.trim(), sku: p.sku.trim() });
  };

  return (
    <window.FullPage open>
      {/* Header */}
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, border: 0, background: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><window.IcX size={20} color={T2.ink}/></button>
        <div style={{ flex: 1, fontFamily: F2, fontSize: 16, fontWeight: 700, color: T2.ink, textAlign: 'center' }}>
          {product ? 'Editar produto' : 'Novo produto'}
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 130px' }}>

        {/* Active toggle */}
        <div style={{
          background: T2.surface, borderRadius: 14, padding: '12px 14px', border: `1px solid ${T2.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
        }}>
          <div>
            <div style={{ fontFamily: F2, fontSize: 14, fontWeight: 700, color: T2.ink }}>
              {p.active ? 'Produto ativo' : 'Produto inativo'}
            </div>
            <div style={{ fontFamily: F2, fontSize: 12, color: T2.ink3, marginTop: 2 }}>
              {p.active ? 'Aparece no PDV e relatórios' : 'Oculto das vendas'}
            </div>
          </div>
          <Toggle value={p.active} onChange={(v) => set('active', v)}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <window.Field label="Nome do produto">
            <window.TextInput value={p.name} onChange={(v) => set('name', v)} placeholder="Ex.: Heineken Long Neck"/>
          </window.Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <window.Field label="Marca">
              <window.TextInput value={p.brand} onChange={(v) => set('brand', v)} placeholder="Marca"/>
            </window.Field>
            <window.Field label="Volume">
              <window.TextInput value={p.volume} onChange={(v) => set('volume', v)} placeholder="350ml"/>
            </window.Field>
          </div>

          <div>
            <div style={{ fontFamily: F2, fontSize: 12, fontWeight: 700, color: T2.ink2,
              letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 6 }}>Categoria</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {window.CATEGORIES.filter(c => c.id !== 'all').map(c => {
                const active = c.id === p.cat;
                return (
                  <button key={c.id} onClick={() => set('cat', c.id)} style={{
                    padding: '9px 12px', borderRadius: 10,
                    border: `1px solid ${active ? T2.ink : T2.border}`,
                    background: active ? T2.ink : T2.surface,
                    color: active ? '#fff' : T2.ink,
                    fontFamily: F2, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>{c.label}</button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <window.Field label="Preço de compra" suffix="R$">
              <window.TextInput
                value={p.cost === 0 ? '' : String(p.cost).replace('.', ',')}
                onChange={(v) => set('cost', parseFloat(v.replace(',', '.')) || 0)}
                placeholder="0,00" inputMode="decimal"/>
            </window.Field>
            <window.Field label="Preço de venda" suffix="R$">
              <window.TextInput
                value={p.price === 0 ? '' : String(p.price).replace('.', ',')}
                onChange={(v) => set('price', parseFloat(v.replace(',', '.')) || 0)}
                placeholder="0,00" inputMode="decimal"/>
            </window.Field>
          </div>

          {/* Calculated margin card */}
          <div style={{
            background: lucroUn > 0 ? T2.primarySoft : '#F0EDE6',
            border: `1px solid ${lucroUn > 0 ? '#CDE6D7' : T2.border}`,
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700,
                color: lucroUn > 0 ? T2.primaryInk : T2.ink2,
                textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Lucro por unidade
              </div>
              <window.Num size={22} weight={800}
                color={lucroUn > 0 ? T2.primaryInk : T2.ink}
                style={{ marginTop: 4 }}>
                {window.brl(Math.max(0, lucroUn))}
              </window.Num>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700,
                color: lucroUn > 0 ? T2.primaryInk : T2.ink2,
                textTransform: 'uppercase', letterSpacing: '0.04em' }}>Margem</div>
              <window.Num size={22} weight={800}
                color={lucroUn > 0 ? T2.primaryInk : T2.ink}
                style={{ marginTop: 4 }}>
                {window.pct(Math.max(0, margem))}
              </window.Num>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <window.Field label="Estoque atual" suffix="un.">
              <window.TextInput
                value={String(p.stock)}
                onChange={(v) => set('stock', parseInt(v.replace(/\D/g, '')) || 0)}
                placeholder="0" inputMode="numeric"/>
            </window.Field>
            <window.Field label="Código / SKU" hint="opcional">
              <window.TextInput value={p.sku} onChange={(v) => set('sku', v)} placeholder="—"/>
            </window.Field>
          </div>

          {product && onRestock && (
            <StockSection product={product} stockMovements={stockMovements || []}
              onRestock={onRestock} onAdjust={onAdjust}/>
          )}

          {product && (
            <button onClick={onDelete} style={{
              marginTop: 8, padding: '14px', borderRadius: 14,
              border: `1px solid ${T2.dangerSoft}`, background: T2.dangerSoft,
              color: T2.danger, fontFamily: F2, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <window.IcTrash size={16} color={T2.danger}/> Excluir produto
            </button>
          )}
        </div>
      </div>

      {/* Sticky bottom button */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px 20px 28px',
        background: 'rgba(245,243,238,0.95)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${T2.border}`,
      }}>
        {(errors.length > 0 || warnings.length > 0) && (
          <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {errors.map((e, i) => (
              <div key={'e'+i} style={{ fontFamily: F2, fontSize: 12, fontWeight: 600, color: T2.danger }}>
                · {e}
              </div>
            ))}
            {warnings.map((w, i) => (
              <div key={'w'+i} style={{ fontFamily: F2, fontSize: 12, fontWeight: 600, color: '#7A4F08' }}>
                ⚠ {w}
              </div>
            ))}
          </div>
        )}
        <window.PrimaryBtn onClick={handleSubmit} disabled={!canSubmit}>
          {product ? 'Salvar alterações' : 'Cadastrar produto'}
        </window.PrimaryBtn>
      </div>
    </window.FullPage>
  );
}

function StockSection({ product, stockMovements, onRestock, onAdjust }) {
  const allMovements = stockMovements.filter(m => m.pid === product.id);
  const movements = allMovements.slice(0, 10);
  const movementLabels = {
    entrada: { label: 'Entrada', tone: 'primary', sign: '+' },
    saida:   { label: 'Venda', tone: 'neutral', sign: '−' },
    devolucao: { label: 'Devolução', tone: 'amber', sign: '+' },
    ajuste:  { label: 'Ajuste manual', tone: 'ghost', sign: '' },
  };

  const handleRestock = async () => {
    // 1. How many units arrived
    const qtyStr = await window.askNumber({
      title: 'Repor estoque',
      message: 'Quantas unidades chegaram?',
      placeholder: '0', suffix: 'un.',
    });
    if (qtyStr === null) return;
    const qty = parseInt(String(qtyStr).replace(/\D/g, ''));
    if (!Number.isFinite(qty) || qty <= 0) return window.notify('Quantidade inválida');

    // 2. New unit cost (replaces current — this is what you paid the supplier)
    const costStr = await window.askNumber({
      title: 'Novo custo unitário',
      message: `Quanto custou cada unidade desta entrada? Atual: ${window.brl(product.cost)}`,
      defaultValue: String(product.cost).replace('.', ','),
      placeholder: '0,00', suffix: 'R$', decimal: true,
    });
    if (costStr === null) return;
    const unitCost = parseFloat(String(costStr).replace(',', '.'));
    if (!Number.isFinite(unitCost) || unitCost < 0) return window.notify('Custo inválido');

    // 3. New sale price (replaces current — chance to readjust against new cost)
    const priceStr = await window.askNumber({
      title: 'Preço de venda',
      message: `Por quanto vai vender cada unidade? Atual: ${window.brl(product.price)}`,
      defaultValue: String(product.price).replace('.', ','),
      placeholder: '0,00', suffix: 'R$', decimal: true,
    });
    if (priceStr === null) return;
    const salePrice = parseFloat(String(priceStr).replace(',', '.'));
    if (!Number.isFinite(salePrice) || salePrice <= 0) return window.notify('Preço inválido');

    if (salePrice <= unitCost) {
      const ok = await window.askConfirm({
        title: 'Preço não cobre o custo',
        message: `Venda ${window.brl(salePrice)} ≤ custo ${window.brl(unitCost)}. Confirmar mesmo assim?`,
        confirmLabel: 'Confirmar',
      });
      if (!ok) return;
    }

    onRestock(product.id, qty, unitCost, salePrice);
  };

  const handleAdjust = async () => {
    const qtyStr = await window.askNumber({
      title: 'Ajustar estoque',
      message: 'Informe o novo valor de estoque (substitui o atual).',
      defaultValue: String(product.stock),
      suffix: 'un.',
    });
    if (qtyStr === null) return;
    const qty = parseInt(String(qtyStr).replace(/\D/g, ''));
    if (!Number.isFinite(qty) || qty < 0) return window.notify('Valor inválido');
    onAdjust(product.id, qty);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={handleRestock} style={{
          padding: '12px', borderRadius: 12, border: 0,
          background: T2.primary, color: '#fff',
          fontFamily: F2, fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
          boxShadow: `0 4px 12px ${T2.primary}40`,
        }}>+ Repor estoque</button>
        <button onClick={handleAdjust} style={{
          padding: '12px', borderRadius: 12,
          border: `1px solid ${T2.border}`, background: T2.surface, color: T2.ink,
          fontFamily: F2, fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
        }}>Ajuste manual</button>
      </div>

      {movements.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700, color: T2.ink2,
            letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 6 }}>
            Movimentações recentes
          </div>
          <div style={{ background: T2.surface, borderRadius: 12, border: `1px solid ${T2.border}`, overflow: 'hidden' }}>
            {movements.map((m, idx) => {
              const meta = movementLabels[m.kind] || { label: m.kind, sign: '' };
              const date = new Date(m.at);
              const dateStr = `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
              return (
                <div key={m.id} style={{
                  padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: idx < movements.length - 1 ? `1px solid ${T2.border}` : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F2, fontSize: 13, fontWeight: 700, color: T2.ink }}>
                      {meta.label}
                    </div>
                    <div style={{ fontFamily: F2, fontSize: 11, color: T2.ink3, marginTop: 1 }}>
                      {dateStr}{m.note ? ' · ' + m.note : ''}
                    </div>
                  </div>
                  <div style={{ fontFamily: F2, fontSize: 13.5, fontWeight: 800, color: T2.ink,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{meta.sign}{m.qty}</div>
                </div>
              );
            })}
          </div>
          {allMovements.length > movements.length && (
            <div style={{ fontFamily: F2, fontSize: 11, color: T2.ink3, marginTop: 6, padding: '0 4px' }}>
              Mostrando {movements.length} de {allMovements.length} · histórico limitado às últimas 30 por produto.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 48, height: 28, borderRadius: 999, border: 0,
      background: value ? T2.primary : '#D7D3C9',
      position: 'relative', cursor: 'pointer', padding: 0,
      transition: 'background 0.15s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 22 : 2,
        width: 24, height: 24, borderRadius: 999, background: '#fff',
        transition: 'left 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
// CHECKOUT (finalizar venda)
// ════════════════════════════════════════════════════════════════
function CheckoutScreen({ cart, products, onConfirm, onClose }) {
  const [payment, setPayment] = React.useState('pix');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cost = cart.reduce((s, i) => s + i.cost * i.qty, 0);
  const lucro = total - cost;
  const margem = total ? (lucro / total) * 100 : 0;

  const methods = [
    { id: 'pix',      label: 'Pix',        Icon: window.IcPix,  hint: 'Confirmação instantânea' },
    { id: 'dinheiro', label: 'Dinheiro',   Icon: window.IcCash, hint: 'Recebido no balcão' },
    { id: 'debito',   label: 'Cartão de débito', Icon: window.IcCard, hint: 'Maquininha' },
    { id: 'credito',  label: 'Cartão de crédito', Icon: window.IcCard, hint: 'Maquininha' },
  ];

  return (
    <window.FullPage open>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, border: 0, background: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><window.IcChevL size={20} color={T2.ink}/></button>
        <div style={{ flex: 1, fontFamily: F2, fontSize: 16, fontWeight: 700, color: T2.ink, textAlign: 'center' }}>
          Finalizar venda
        </div>
        <div style={{ width: 38 }}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 140px' }}>
        {/* Big total */}
        <div style={{
          background: T2.ink, color: '#fff', borderRadius: 22, padding: 20,
          textAlign: 'center', marginTop: 4,
        }}>
          <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total da venda
          </div>
          <window.Num size={48} weight={800} color="#fff" style={{ marginTop: 6 }}>{window.brl(total)}</window.Num>
          <div style={{
            display: 'inline-flex', gap: 16, marginTop: 14,
            padding: '8px 16px', borderRadius: 999,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div style={{ fontFamily: F2, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
              custo <span style={{ color: '#fff', fontWeight: 700 }}>{window.brl(cost)}</span>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.18)' }}/>
            <div style={{ fontFamily: F2, fontSize: 12, color: '#9DE3BF', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
              lucro {window.brl(lucro)} ({window.pct(margem)})
            </div>
          </div>
        </div>

        {/* Items summary */}
        <window.SectionHead title="Resumo" right={<span style={{
          fontFamily: F2, fontSize: 12, color: T2.ink3,
        }}>{cart.reduce((s,i) => s+i.qty, 0)} unidades</span>}/>
        <div style={{ padding: '0 0', display: 'flex', flexDirection: 'column', gap: 0,
          background: T2.surface, borderRadius: 16, border: `1px solid ${T2.border}`, overflow: 'hidden' }}>
          {cart.map((item, idx) => {
            const p = products.find(pp => pp.id === item.pid);
            return (
              <div key={item.pid} style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: idx < cart.length - 1 ? `1px solid ${T2.border}` : 'none',
              }}>
                <window.ProductAvatar product={p} size={36} radius={10}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F2, fontWeight: 700, fontSize: 13.5, color: T2.ink, letterSpacing: '-0.005em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontFamily: F2, fontSize: 11.5, color: T2.ink3, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {item.qty} × {window.brl(item.price)}
                  </div>
                </div>
                <window.Num size={14} weight={700}>{window.brl(item.qty * item.price)}</window.Num>
              </div>
            );
          })}
        </div>

        {/* Payment method */}
        <window.SectionHead title="Forma de pagamento"/>
        <div style={{ padding: '0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {methods.map(m => {
            const active = m.id === payment;
            return (
              <button key={m.id} onClick={() => setPayment(m.id)} style={{
                background: T2.surface,
                border: `1.5px solid ${active ? T2.primary : T2.border}`,
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                textAlign: 'left',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: active ? T2.primarySoft : '#F0EDE6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <m.Icon size={20} color={active ? T2.primary : T2.ink}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F2, fontWeight: 700, fontSize: 14, color: T2.ink }}>{m.label}</div>
                  <div style={{ fontFamily: F2, fontSize: 11.5, color: T2.ink3, marginTop: 1 }}>{m.hint}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 999,
                  border: `2px solid ${active ? T2.primary : T2.border}`,
                  background: active ? T2.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{active && <window.IcCheck size={12} color="#fff" sw={3}/>}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px 20px 28px',
        background: 'rgba(245,243,238,0.95)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${T2.border}`,
      }}>
        <window.PrimaryBtn onClick={() => onConfirm(payment)}>
          Confirmar venda · {window.brl(total)}
        </window.PrimaryBtn>
      </div>
    </window.FullPage>
  );
}

// ════════════════════════════════════════════════════════════════
// SALE DETAIL
// ════════════════════════════════════════════════════════════════
function SaleDetail({ sale, products, onClose, onCancel, onCancelLine }) {
  if (!sale) return null;
  const margem = sale.total ? (sale.profit / sale.total) * 100 : 0;
  const canceled = sale.status === 'cancelada';
  return (
    <window.FullPage open>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, border: 0, background: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><window.IcChevL size={20} color={T2.ink}/></button>
        <div style={{ flex: 1, fontFamily: F2, fontSize: 16, fontWeight: 700, color: T2.ink, textAlign: 'center' }}>
          Detalhes da venda
        </div>
        <window.IconBtn Icon={window.IcReceipt}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 34px' }}>
        {/* Header info */}
        <div style={{ padding: '8px 4px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canceled
              ? <window.Pill tone="danger"><window.IcX size={11} color="#7A2010" sw={2.4}/> cancelada</window.Pill>
              : <window.Pill tone="primary"><window.IcCheck size={11} color={T2.primaryInk} sw={2.4}/> confirmada</window.Pill>}
            <window.Pill tone="neutral">#{sale.id}</window.Pill>
          </div>
          <div style={{ marginTop: 12, fontFamily: F2, fontSize: 13, color: T2.ink2, fontWeight: 500 }}>
            {sale.dateLabel} · {sale.time}
          </div>
          <window.Num size={32} weight={800} style={{ marginTop: 4 }}>{window.brl(sale.total)}</window.Num>
        </div>

        {/* Numbers grid */}
        <div style={{
          background: T2.surface, borderRadius: 18, border: `1px solid ${T2.border}`,
          padding: 16, marginTop: 4,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14, columnGap: 12 }}>
            <DetailMetric label="Faturamento" value={window.brl(sale.total)}/>
            <DetailMetric label="Custo total" value={window.brl(sale.cost)}/>
            <DetailMetric label="Lucro bruto" value={window.brl(sale.profit)} color={T2.primary}/>
            <DetailMetric label="Margem" value={window.pct(margem)} color={T2.primary}/>
          </div>
          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T2.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: F2, fontSize: 12, fontWeight: 700, color: T2.ink2,
              textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pagamento</div>
            <window.Pill tone="dark">{window.PAYMENT_LABELS[sale.payment]}</window.Pill>
          </div>
        </div>

        {/* Items */}
        <window.SectionHead title={`Itens (${sale.lines.length})`}/>
        <div style={{ padding: '0 0', background: T2.surface, borderRadius: 16,
          border: `1px solid ${T2.border}`, overflow: 'hidden' }}>
          {sale.lines.map((l, idx) => {
            const p = products.find(pp => pp.id === l.pid);
            const lineRev = l.qty * l.price;
            const lineProfit = l.qty * (l.price - l.cost);
            const lineCanceled = l.canceled;
            return (
              <div key={idx} style={{
                padding: '14px 14px',
                borderBottom: idx < sale.lines.length - 1 ? `1px solid ${T2.border}` : 'none',
                opacity: lineCanceled ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <window.ProductAvatar product={p} size={40} radius={11}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: F2, fontWeight: 700, fontSize: 14, color: T2.ink, letterSpacing: '-0.005em',
                        textDecoration: lineCanceled ? 'line-through' : 'none' }}>{l.name}</div>
                      {lineCanceled && <window.Pill tone="danger" size="sm">cancelado</window.Pill>}
                    </div>
                    <div style={{ fontFamily: F2, fontSize: 11.5, color: T2.ink3, marginTop: 2 }}>
                      {l.qty} × {window.brl(l.price)} · custo {window.brl(l.cost)}/un.
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <window.Num size={14} weight={700} style={{ textDecoration: lineCanceled ? 'line-through' : 'none' }}>{window.brl(lineRev)}</window.Num>
                    {!lineCanceled && <div style={{ fontFamily: F2, fontSize: 11.5, fontWeight: 600, color: T2.primary, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      +{window.brl(lineProfit)}
                    </div>}
                  </div>
                </div>
                {!canceled && !lineCanceled && onCancelLine && (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => onCancelLine(idx)} style={{
                      background: 'transparent', border: 0, padding: '4px 8px', cursor: 'pointer',
                      fontFamily: F2, fontSize: 12, fontWeight: 600, color: T2.danger,
                    }}>Cancelar este item</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!canceled && onCancel && (
            <button onClick={onCancel} style={{
              background: 'transparent', border: 0, padding: 12, cursor: 'pointer',
              fontFamily: F2, fontSize: 13.5, fontWeight: 700, color: T2.danger,
            }}>Cancelar venda</button>
          )}
        </div>
      </div>
    </window.FullPage>
  );
}

function DetailMetric({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700, color: T2.ink2,
        textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <window.Num size={18} weight={700} color={color || T2.ink} style={{ marginTop: 4 }}>{value}</window.Num>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SUCCESS sheet (after sale confirmed)
// ════════════════════════════════════════════════════════════════
function SuccessSheet({ open, sale, onClose, onViewDetail }) {
  return (
    <window.Sheet open={open} onClose={onClose}>
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999, background: T2.primarySoft,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid #fff', boxShadow: `0 0 0 2px ${T2.primary}`,
        }}>
          <window.IcCheck size={32} color={T2.primary} sw={2.6}/>
        </div>
        <div style={{ fontFamily: F2, fontWeight: 800, fontSize: 22, color: T2.ink,
          letterSpacing: '-0.02em', marginTop: 14 }}>Venda confirmada!</div>
        <div style={{ fontFamily: F2, fontSize: 14, color: T2.ink2, marginTop: 4 }}>
          {sale && `${sale.lines.length} ${sale.lines.length === 1 ? 'item' : 'itens'} · ${window.PAYMENT_LABELS[sale.payment]}`}
        </div>
        {sale && (
          <div style={{
            marginTop: 18, padding: '14px 16px',
            background: T2.surface, border: `1px solid ${T2.border}`, borderRadius: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: F2, fontSize: 11, color: T2.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
              <window.Num size={22} weight={800} style={{ marginTop: 2 }}>{window.brl(sale.total)}</window.Num>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: F2, fontSize: 11, color: T2.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lucro</div>
              <window.Num size={22} weight={800} color={T2.primary} style={{ marginTop: 2 }}>{window.brl(sale.profit)}</window.Num>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <window.PrimaryBtn onClick={onClose}>Nova venda</window.PrimaryBtn>
        <window.PrimaryBtn tone="ghost" size="md" onClick={onViewDetail}>Ver detalhes</window.PrimaryBtn>
      </div>
    </window.Sheet>
  );
}

// ════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════
function SettingsScreen({ onClose, ctx }) {
  const { settings, setSettings, products, sales, shareBackupNow, restoreFromFile, wipeAllData, daysSinceBackup } = ctx;

  const editText = async (label, current, save) => {
    const v = await window.askText({ title: label, defaultValue: current ?? '' });
    if (v === null) return;
    save(String(v).trim());
  };
  const editNumber = async (label, current, save, min = 0) => {
    const v = await window.askNumber({ title: label, defaultValue: String(current ?? '') });
    if (v === null) return;
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n >= min) save(n);
  };

  const setSetting = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  const handleShare = async () => {
    const r = await shareBackupNow();
    if (r?.method === 'download' && r.ok) {
      window.notify('Backup baixado', 'Salve em local seguro (Google Drive, e-mail, etc).');
    }
  };
  const handleRestore = async () => {
    try {
      const ok = await restoreFromFile();
      if (ok) window.notify('Dados restaurados', 'Backup aplicado com sucesso.');
    } catch (e) {
      window.notify('Falha ao restaurar', e?.message || String(e));
    }
  };

  const lastBackupLabel = settings.lastBackupAt
    ? `${daysSinceBackup === 0 ? 'hoje' : daysSinceBackup === 1 ? 'ontem' : `há ${daysSinceBackup} dias`}`
    : 'nunca';

  const groups = [
    { title: 'Loja', rows: [
      { label: 'Nome da loja', value: settings.storeName,
        onClick: () => editText('Nome da loja', settings.storeName, (v) => setSetting('storeName', v || 'Adega Pinguim')) },
      { label: 'Seu nome', value: settings.ownerName || '—',
        onClick: () => editText('Seu nome (aparece no cumprimento)', settings.ownerName, (v) => setSetting('ownerName', v)) },
    ]},
    { title: 'Catálogo', rows: [
      { label: 'Gerenciar categorias', value: `${ctx.categories.length} ativas`,
        onClick: () => ctx.openPage('categories') },
    ]},
    { title: 'Preferências', rows: [
      { label: 'Alerta estoque baixo', value: `≤ ${settings.lowStockAlert ?? 6} un.`,
        onClick: () => editNumber('Alerta de estoque baixo (unidades)', settings.lowStockAlert ?? 6, (n) => setSetting('lowStockAlert', n), 1) },
      { label: 'Alerta margem baixa', value: `≤ ${settings.lowMarginAlert ?? 30}%`,
        onClick: () => editNumber('Alerta de margem baixa (%)', settings.lowMarginAlert ?? 30, (n) => setSetting('lowMarginAlert', n), 0) },
      { label: 'Lembrete de backup', value: `a cada ${settings.backupReminderDays ?? 3} dias`,
        onClick: () => editNumber('Lembrar de fazer backup a cada quantos dias?', settings.backupReminderDays ?? 3, (n) => setSetting('backupReminderDays', n), 1) },
    ]},
    { title: 'Backup e dados', rows: [
      { label: 'Exportar backup', value: `último: ${lastBackupLabel}`, onClick: handleShare, accent: true },
      { label: 'Restaurar de backup', value: '', onClick: handleRestore },
      { label: 'Apagar todos os dados', value: '', onClick: async () => {
          const ok = await wipeAllData();
          if (ok) { window.notify('Dados apagados'); onClose(); }
        }, danger: true },
    ]},
  ];

  return (
    <window.FullPage open>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, border: 0, background: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><window.IcChevL size={20} color={T2.ink}/></button>
        <div style={{ flex: 1, fontFamily: F2, fontSize: 16, fontWeight: 700, color: T2.ink, textAlign: 'center' }}>
          Configurações
        </div>
        <div style={{ width: 38 }}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 34px' }}>
        {/* Summary card */}
        <div style={{
          background: T2.ink, color: '#fff', borderRadius: 18, padding: 18,
          display: 'flex', alignItems: 'center', gap: 14, marginTop: 4,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F2, fontWeight: 800, fontSize: 18, color: '#fff',
          }}>{(settings.storeName || 'AP').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F2, fontWeight: 700, fontSize: 16, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.storeName}</div>
            <div style={{ fontFamily: F2, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              {products.length} produtos · {sales.length} vendas
            </div>
          </div>
        </div>

        {groups.map((g) => (
          <div key={g.title} style={{ marginTop: 22 }}>
            <div style={{ fontFamily: F2, fontSize: 11.5, fontWeight: 700, color: T2.ink2,
              textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 4px 8px' }}>{g.title}</div>
            <div style={{ background: T2.surface, borderRadius: 16, border: `1px solid ${T2.border}`, overflow: 'hidden' }}>
              {g.rows.map((r, ri) => (
                <button key={ri} onClick={r.onClick} style={{
                  width: '100%', border: 0, background: 'transparent',
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: ri < g.rows.length - 1 ? `1px solid ${T2.border}` : 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ flex: 1, fontFamily: F2, fontSize: 14, fontWeight: 600,
                    color: r.danger ? T2.danger : r.accent ? T2.primary : T2.ink, letterSpacing: '-0.005em' }}>{r.label}</div>
                  {r.value && <div style={{ fontFamily: F2, fontSize: 13, color: T2.ink3 }}>{r.value}</div>}
                  {!r.danger && <window.IcChevR size={14} color={T2.ink3}/>}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 28, textAlign: 'center', fontFamily: F2, fontSize: 12, color: T2.ink3 }}>
          Adega Pinguim v1.0
        </div>
      </div>
    </window.FullPage>
  );
}

// ════════════════════════════════════════════════════════════════
// CATEGORIES (gerenciar)
// ════════════════════════════════════════════════════════════════
const TONE_PALETTE = ['#9C7B1A','#A23D2C','#2B3D7A','#2E6E96','#5A3320','#3A6B3F','#7A3A6D','#444','#8A6E3F'];

function CategoriesScreen({ ctx, onClose }) {
  const { categories, saveCategory, removeCategory, products } = ctx;

  const handleEdit = async (existing) => {
    const isNew = !existing;
    const label = await window.askText({
      title: isNew ? 'Nova categoria' : 'Editar categoria',
      message: 'Nome no plural (ex.: "Cervejas")',
      defaultValue: existing?.label || '',
    });
    if (label === null) return;
    const labelTrim = String(label).trim();
    if (!labelTrim) return window.notify('Nome obrigatório');
    const labelSingular = await window.askText({
      title: 'Forma singular',
      message: 'Como aparece em cada produto (ex.: "Cerveja", "Refrigerante")',
      defaultValue: existing?.labelSingular || labelTrim,
    });
    if (labelSingular === null) return;
    let tone = existing?.tone;
    if (isNew) {
      const used = new Set(categories.map(c => c.tone));
      tone = TONE_PALETTE.find(t => !used.has(t)) || TONE_PALETTE[0];
    }
    const id = isNew
      ? labelTrim.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 8) || 'cat' + Date.now()
      : existing.id;
    if (isNew && categories.find(c => c.id === id)) {
      return window.notify('Já existe uma categoria com nome parecido.');
    }
    saveCategory({ id, label: labelTrim, labelSingular: String(labelSingular).trim(), tone });
  };

  const handleTone = async (cat) => {
    const tone = await window.askText({
      title: 'Cor da categoria',
      message: 'Formato hexadecimal (ex.: #9C7B1A)',
      defaultValue: cat.tone,
    });
    if (tone === null) return;
    if (!/^#[0-9A-Fa-f]{6}$/.test(tone)) return window.notify('Formato inválido', 'Use #RRGGBB');
    saveCategory({ ...cat, tone });
  };

  const handleRemove = async (cat) => {
    const productsInCat = products.filter(p => p.cat === cat.id).length;
    if (productsInCat > 0) {
      return window.notify('Não dá pra remover', `Existem ${productsInCat} produto(s) nesta categoria.`);
    }
    const ok = await window.askConfirm({
      title: `Remover "${cat.label}"?`,
      confirmLabel: 'Remover', danger: true,
    });
    if (ok) removeCategory(cat.id);
  };

  return (
    <window.FullPage open>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, border: 0, background: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><window.IcChevL size={20} color={T2.ink}/></button>
        <div style={{ flex: 1, fontFamily: F2, fontSize: 16, fontWeight: 700, color: T2.ink, textAlign: 'center' }}>
          Categorias
        </div>
        <button onClick={() => handleEdit(null)} style={{
          width: 38, height: 38, borderRadius: 12, border: 0, background: T2.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><window.IcPlus size={20} color="#fff" sw={2.2}/></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 34px' }}>
        <div style={{ fontFamily: F2, fontSize: 12.5, color: T2.ink2, marginTop: 4, marginBottom: 10, padding: '0 4px' }}>
          Toque numa categoria pra editar o nome ou trocar a cor.
        </div>
        <div style={{ background: T2.surface, borderRadius: 16, border: `1px solid ${T2.border}`, overflow: 'hidden' }}>
          {categories.map((cat, idx) => {
            const inUse = products.filter(p => p.cat === cat.id).length;
            return (
              <div key={cat.id} style={{
                padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: idx < categories.length - 1 ? `1px solid ${T2.border}` : 'none',
              }}>
                <button onClick={() => handleTone(cat)} style={{
                  width: 36, height: 36, borderRadius: 11, border: 0, cursor: 'pointer',
                  background: cat.tone, flexShrink: 0,
                }} title="Mudar cor"/>
                <button onClick={() => handleEdit(cat)} style={{
                  flex: 1, minWidth: 0, border: 0, background: 'transparent', cursor: 'pointer',
                  textAlign: 'left', padding: 0,
                }}>
                  <div style={{ fontFamily: F2, fontSize: 14.5, fontWeight: 700, color: T2.ink, letterSpacing: '-0.005em' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontFamily: F2, fontSize: 12, color: T2.ink3, marginTop: 2 }}>
                    Singular: {cat.labelSingular} · {inUse} produto{inUse === 1 ? '' : 's'}
                  </div>
                </button>
                <button onClick={() => handleRemove(cat)} style={{
                  border: 0, background: 'transparent', cursor: 'pointer', padding: 6,
                }}><window.IcTrash size={18} color={T2.ink3}/></button>
              </div>
            );
          })}
        </div>
      </div>
    </window.FullPage>
  );
}

// ════════════════════════════════════════════════════════════════
// CASH CLOSE (fechamento de caixa)
// ════════════════════════════════════════════════════════════════
function CashCloseScreen({ ctx, onClose }) {
  const { sales, closures, recordClosure } = ctx;
  const [dateISO, setDateISO] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
  });
  const [cashCounted, setCashCounted] = React.useState('');

  // Filter active (non-canceled) sales matching the chosen date.
  const daySales = React.useMemo(() => {
    const [y, m, d] = dateISO.split('-').map(Number);
    return sales.filter(s => {
      if (s.status === 'cancelada') return false;
      // sales record day as offset from today (0=hoje, 1=ontem, ...). Convert dateISO into that offset.
      const today = new Date();
      today.setHours(0,0,0,0);
      const sel = new Date(y, m-1, d);
      const dayDiff = Math.round((today - sel) / 86400000);
      return s.day === dayDiff;
    });
  }, [sales, dateISO]);

  const byMethod = { pix: 0, debito: 0, credito: 0, dinheiro: 0 };
  daySales.forEach(s => { byMethod[s.payment] = (byMethod[s.payment] || 0) + s.total; });
  const total = Object.values(byMethod).reduce((a, b) => a + b, 0);
  const expectedCash = byMethod.dinheiro;
  const cashCountedNum = parseFloat(cashCounted.replace(',', '.')) || 0;
  const diff = cashCounted === '' ? null : cashCountedNum - expectedCash;

  const handleConfirm = async () => {
    if (cashCounted === '') {
      const ok = await window.askConfirm({
        title: 'Salvar sem conferir o caixa?',
        message: 'Você não informou o valor contado em dinheiro.',
        confirmLabel: 'Salvar mesmo assim',
      });
      if (!ok) return;
    }
    recordClosure({
      date: dateISO,
      total,
      byMethod: { ...byMethod },
      expectedCash,
      cashCounted: cashCounted === '' ? null : cashCountedNum,
      diff,
      salesCount: daySales.length,
      at: new Date().toISOString(),
    });
    window.notify('Fechamento salvo');
    onClose();
  };

  return (
    <window.FullPage open>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, border: 0, background: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><window.IcChevL size={20} color={T2.ink}/></button>
        <div style={{ flex: 1, fontFamily: F2, fontSize: 16, fontWeight: 700, color: T2.ink, textAlign: 'center' }}>
          Fechamento de caixa
        </div>
        <div style={{ width: 38 }}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 130px' }}>
        {/* Date picker */}
        <window.Field label="Data do fechamento">
          <input type="date" value={dateISO} onChange={(e) => setCashCounted('') || setDateISO(e.target.value)}
            style={{ border: 0, outline: 'none', background: 'transparent', flex: 1,
              fontFamily: F2, fontSize: 15, fontWeight: 600, color: T2.ink }}/>
        </window.Field>

        {/* Totals by method */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700, color: T2.ink2,
            letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 6 }}>
            Vendas confirmadas no dia
          </div>
          <div style={{ background: T2.surface, borderRadius: 14, border: `1px solid ${T2.border}`, overflow: 'hidden' }}>
            {[
              ['pix', 'Pix'], ['debito', 'Débito'], ['credito', 'Crédito'], ['dinheiro', 'Dinheiro'],
            ].map(([k, label], idx, arr) => (
              <div key={k} style={{
                padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: idx < arr.length - 1 ? `1px solid ${T2.border}` : 'none',
                background: k === 'dinheiro' ? T2.primarySoft : 'transparent',
              }}>
                <div style={{ fontFamily: F2, fontSize: 14, fontWeight: 600, color: T2.ink }}>{label}</div>
                <window.Num size={15} weight={700}>{window.brl(byMethod[k])}</window.Num>
              </div>
            ))}
            <div style={{
              padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: T2.ink, color: '#fff',
            }}>
              <div style={{ fontFamily: F2, fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total · {daySales.length} vendas</div>
              <window.Num size={18} weight={800} color="#fff">{window.brl(total)}</window.Num>
            </div>
          </div>
        </div>

        {/* Cash count */}
        <div style={{ marginTop: 16 }}>
          <window.Field label="Valor contado no caixa em dinheiro" suffix="R$">
            <window.TextInput
              value={cashCounted}
              onChange={setCashCounted}
              placeholder="0,00" inputMode="decimal"/>
          </window.Field>
        </div>

        {/* Diff */}
        {diff !== null && (
          <div style={{
            marginTop: 12, padding: 14, borderRadius: 14,
            background: diff === 0 ? T2.primarySoft : (diff > 0 ? T2.amberSoft : T2.dangerSoft),
            border: `1px solid ${diff === 0 ? '#CDE6D7' : (diff > 0 ? '#EFDDA8' : '#EDC3B3')}`,
          }}>
            <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700,
              color: diff === 0 ? T2.primaryInk : (diff > 0 ? '#7A4F08' : '#7A2010'),
              textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {diff === 0 ? 'Caixa bate' : (diff > 0 ? 'Sobra' : 'Falta')}
            </div>
            <window.Num size={22} weight={800}
              color={diff === 0 ? T2.primaryInk : (diff > 0 ? '#7A4F08' : '#7A2010')}
              style={{ marginTop: 4 }}>
              {window.brl(Math.abs(diff))}
            </window.Num>
            <div style={{ fontFamily: F2, fontSize: 12, color: T2.ink2, marginTop: 4 }}>
              Esperado em dinheiro: {window.brl(expectedCash)} · contado: {window.brl(cashCountedNum)}
            </div>
          </div>
        )}

        {/* Recent closures */}
        {closures.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: F2, fontSize: 11, fontWeight: 700, color: T2.ink2,
              letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 6 }}>
              Fechamentos anteriores
            </div>
            <div style={{ background: T2.surface, borderRadius: 14, border: `1px solid ${T2.border}`, overflow: 'hidden' }}>
              {closures.slice(0, 6).map((c, idx, arr) => (
                <div key={c.id} style={{
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: idx < arr.length - 1 ? `1px solid ${T2.border}` : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F2, fontSize: 13, fontWeight: 700, color: T2.ink }}>
                      {c.date.split('-').reverse().join('/')}
                    </div>
                    <div style={{ fontFamily: F2, fontSize: 11.5, color: T2.ink3, marginTop: 1 }}>
                      {c.salesCount} vendas · total {window.brl(c.total)}
                    </div>
                  </div>
                  {c.diff !== null && c.diff !== undefined && (
                    <window.Pill tone={c.diff === 0 ? 'primary' : (c.diff > 0 ? 'amber' : 'danger')} size="sm">
                      {c.diff === 0 ? 'OK' : (c.diff > 0 ? '+' : '−') + window.brl(Math.abs(c.diff))}
                    </window.Pill>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px 20px 28px',
        background: 'rgba(245,243,238,0.95)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${T2.border}`,
      }}>
        <window.PrimaryBtn onClick={handleConfirm}>Salvar fechamento</window.PrimaryBtn>
      </div>
    </window.FullPage>
  );
}

Object.assign(window, {
  ProductForm, CheckoutScreen, SaleDetail, SuccessSheet, SettingsScreen, CashCloseScreen, CategoriesScreen,
});
