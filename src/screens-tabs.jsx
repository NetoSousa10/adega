import React from 'react';
// Tab screens: Dashboard, Produtos, Vender, Vendas, Relatórios.
const { T, FONT } = window;

// Format today as "Quarta, 19 mai" (PT-BR, no year, short day name).
function formatToday() {
  const d = new Date();
  const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

// Shared empty-state component with CTA to switch tabs.
function OnboardEmpty({ Icon, title, subtitle, ctaLabel, onCta }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '80px 28px 60px', textAlign: 'center', gap: 14,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 22, background: T.primarySoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #CDE6D7',
      }}>
        <Icon size={32} color={T.primaryInk}/>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 19, color: T.ink, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 14, color: T.ink2, maxWidth: 280, lineHeight: 1.4 }}>{subtitle}</div>
      {ctaLabel && onCta && (
        <button onClick={onCta} style={{
          marginTop: 6, padding: '12px 22px', borderRadius: 14, border: 0,
          background: T.primary, color: '#fff', cursor: 'pointer',
          fontFamily: FONT, fontWeight: 700, fontSize: 14.5,
          boxShadow: `0 4px 14px ${T.primary}48`,
        }}>{ctaLabel}</button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. DASHBOARD (Início)
// ════════════════════════════════════════════════════════════════
function DashboardScreen({ ctx }) {
  const { sales, products } = ctx;
  const [period, setPeriod] = React.useState('hoje');

  if (products.length === 0) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
        <window.AppBar large title="Bem-vindo" subtitle={`${ctx.settings.storeName} · controle de lucro`}
          right={<window.IconBtn Icon={window.IcGear} onClick={() => ctx.openPage('settings')}/>}/>
        <OnboardEmpty
          Icon={window.IcBox}
          title="Comece cadastrando seu primeiro produto"
          subtitle="Depois você poderá registrar vendas e acompanhar seu lucro em tempo real."
          ctaLabel="Cadastrar produto"
          onCta={() => { ctx.setTab('produtos'); ctx.openProduct(null); }}/>
      </div>
    );
  }
  if (sales.length === 0) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
        <window.AppBar large title="Pronto pra começar" subtitle={`${products.length} produtos cadastrados`}
          right={<window.IconBtn Icon={window.IcGear} onClick={() => ctx.openPage('settings')}/>}/>
        <OnboardEmpty
          Icon={window.IcCart}
          title="Registre sua primeira venda"
          subtitle="As métricas de faturamento, lucro e margem aparecem aqui assim que você fechar a primeira venda."
          ctaLabel="Nova venda"
          onCta={() => ctx.setTab('vender')}/>
      </div>
    );
  }

  const filteredSales = sales.filter(s =>
    s.status !== 'cancelada' && (
      period === 'hoje' ? s.day === 0 :
      period === 'semana' ? s.day < 7 :
      s.day < 30
    )
  );
  const faturamento = filteredSales.reduce((s, v) => s + v.total, 0);
  const lucro = filteredSales.reduce((s, v) => s + v.profit, 0);
  const custo = filteredSales.reduce((s, v) => s + v.cost, 0);
  const qty = filteredSales.length;
  const margemMedia = faturamento ? (lucro / faturamento) * 100 : 0;

  // Aggregate by product
  const productAgg = {};
  filteredSales.forEach(s => s.lines.forEach(l => {
    if (!productAgg[l.pid]) productAgg[l.pid] = { pid: l.pid, name: l.name, qty: 0, rev: 0, profit: 0 };
    productAgg[l.pid].qty += l.qty;
    productAgg[l.pid].rev += l.price * l.qty;
    productAgg[l.pid].profit += (l.price - l.cost) * l.qty;
  }));
  const aggArr = Object.values(productAgg);
  const topVendido = [...aggArr].sort((a,b) => b.qty - a.qty)[0];
  const topLucrativo = [...aggArr].sort((a,b) => b.profit - a.profit)[0];

  // Hourly bars (today only)
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8h–21h
  const hourlyRev = hours.map(h => {
    let v = 0;
    filteredSales.forEach(s => {
      if (parseInt(s.time.split(':')[0]) === h) v += s.total;
    });
    return v;
  });

  const [scrolled, setScrolled] = React.useState(false);

  return (
    <div onScroll={(e) => setScrolled(e.target.scrollTop > 4)} style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden', background: T.bg,
    }}>
      <window.AppBar
        large
        title={ctx.settings.ownerName ? `Olá, ${ctx.settings.ownerName.split(' ')[0]}` : ctx.settings.storeName}
        subtitle={`${ctx.settings.ownerName ? ctx.settings.storeName + ' · ' : ''}${formatToday()}`}
        scrolled={scrolled}
        right={<window.IconBtn Icon={window.IcGear} onClick={() => ctx.openPage('settings')}/>}
      />

      {/* Backup reminder */}
      {ctx.backupOverdue && (
        <div style={{ padding: '8px 20px 0' }}>
          <button onClick={async () => {
            const r = await ctx.shareBackupNow();
            if (r?.ok && r.method === 'download') window.notify('Backup baixado', 'Salve em local seguro (Google Drive, e-mail, etc).');
          }} style={{
            width: '100%', background: T.dangerSoft, border: `1px solid #EDC3B3`,
            color: '#7A2010', borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            fontFamily: FONT, textAlign: 'left',
          }}>
            <window.IcWarn size={20} color="#7A2010"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5 }}>
                {ctx.daysSinceBackup === null
                  ? 'Você ainda não fez backup'
                  : `Faz ${ctx.daysSinceBackup} dia${ctx.daysSinceBackup === 1 ? '' : 's'} sem backup`}
              </div>
              <div style={{ fontSize: 12, marginTop: 2, fontWeight: 500 }}>
                Toque para exportar agora.
              </div>
            </div>
            <window.IcChevR size={16} color="#7A2010"/>
          </button>
        </div>
      )}

      {/* Period selector */}
      <div style={{ padding: '8px 20px 4px' }}>
        <window.Segmented
          value={period} onChange={setPeriod}
          options={[
            { value: 'hoje', label: 'Hoje' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mês' },
          ]}/>
      </div>

      {/* Hero KPI card */}
      <div style={{ padding: '14px 20px 0' }}>
        {(() => {
          const dark = T._heroDark !== false;
          const heroBg = dark ? T.ink : T.surface;
          const heroFg = dark ? '#fff' : T.ink;
          const heroMuted = dark ? 'rgba(255,255,255,0.62)' : T.ink2;
          const heroMuted2 = dark ? 'rgba(255,255,255,0.55)' : T.ink3;
          const heroPillBg = dark ? 'rgba(255,255,255,0.12)' : T.primarySoft;
          const heroPillFg = dark ? '#9DE3BF' : T.primaryInk;
          const sparkCol = dark ? '#9DE3BF' : T.primary;
          return (
            <div style={{
              background: heroBg, color: heroFg, borderRadius: 22, padding: 20,
              position: 'relative', overflow: 'hidden',
              border: dark ? 'none' : `1px solid ${T.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700,
                  color: heroMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Lucro bruto · {period === 'hoje' ? 'hoje' : period === 'semana' ? '7 dias' : '30 dias'}
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 999,
                  background: heroPillBg, color: heroPillFg,
                  fontFamily: FONT, fontWeight: 700, fontSize: 11,
                }}>
                  <window.IcArrowUp size={11} color={heroPillFg} sw={2.2}/>
                  {period === 'hoje' ? '+12,4%' : period === 'semana' ? '+8,1%' : '+5,3%'}
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <window.Num size={42} weight={800} color={heroFg}>{window.brl(lucro)}</window.Num>
              </div>
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'end' }}>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: heroMuted2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faturamento</div>
                  <window.Num size={18} weight={700} color={heroFg} style={{ marginTop: 4 }}>{window.brl(faturamento)}</window.Num>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <window.Spark
                    data={hourlyRev.length && hourlyRev.some(v => v) ? hourlyRev : [3, 7, 5, 8, 12, 10, 16, 13, 18, 22]}
                    color={sparkCol} height={42} width={130}/>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 2×2 mini KPIs */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <window.Card style={{ padding: 14 }}>
            <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vendas</div>
            <window.Num size={24} style={{ marginTop: 6 }}>{qty}</window.Num>
            <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>
              ticket méd. {window.brl(qty ? faturamento/qty : 0)}
            </div>
          </window.Card>
          <window.Card style={{ padding: 14 }}>
            <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Margem média</div>
            <window.Num size={24} color={T.primary} style={{ marginTop: 6 }}>{window.pct(margemMedia)}</window.Num>
            <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>
              custo {window.brl(custo)}
            </div>
          </window.Card>
        </div>
      </div>

      {/* Hourly bars */}
      <window.SectionHead title="Vendas por hora"/>
      <div style={{ padding: '0 20px' }}>
        <window.Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
            {hourlyRev.map((v, i) => {
              const maxV = Math.max(...hourlyRev, 1);
              const h = Math.max(4, (v / maxV) * 80);
              const isPeak = v === maxV && v > 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', height: h, borderRadius: '4px 4px 2px 2px',
                    background: isPeak ? T.primary : (v ? 'rgba(31,122,77,0.35)' : '#EAE6DD'),
                  }}/>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {hours.map((h, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: FONT,
                fontSize: 9.5, fontWeight: 600, color: T.ink3,
                fontVariantNumeric: 'tabular-nums',
              }}>{h % 3 === 0 ? `${h}h` : ''}</div>
            ))}
          </div>
        </window.Card>
      </div>

      {/* Top products */}
      <window.SectionHead title="Destaques do período"/>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topVendido && <HighlightRow
          icon={<window.IcTrend size={18} color={T.primary}/>}
          tone="primary"
          label="Mais vendido"
          product={products.find(p => p.id === topVendido.pid)}
          valueLabel={`${topVendido.qty} un.`}
          subLabel={window.brl(topVendido.rev)}
        />}
        {topLucrativo && <HighlightRow
          icon={<window.IcChart size={18} color="#7A4F08"/>}
          tone="amber"
          label="Mais lucrativo"
          product={products.find(p => p.id === topLucrativo.pid)}
          valueLabel={window.brl(topLucrativo.profit)}
          subLabel={`${topLucrativo.qty} un. vendidas`}
        />}
      </div>

      {/* Recent sales preview */}
      <window.SectionHead title="Vendas recentes" action={{ label: 'Ver tudo', onClick: () => ctx.setTab('vendas') }}/>
      <div style={{ padding: '0 20px 130px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sales.slice(0, 3).map(s => (
          <window.Card key={s.id} padded={false} onClick={() => ctx.openSale(s)} style={{ padding: '12px 14px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, background: T.primarySoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <window.IcReceipt size={18} color={T.primary}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: T.ink, letterSpacing: '-0.01em' }}>
                  {s.lines.length} {s.lines.length === 1 ? 'item' : 'itens'} · {window.PAYMENT_LABELS[s.payment]}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: T.ink3, marginTop: 2 }}>
                  {s.dateLabel} · {s.time}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <window.Num size={15} weight={700}>{window.brl(s.total)}</window.Num>
                <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: T.primary, marginTop: 2 }}>
                  +{window.brl(s.profit)}
                </div>
              </div>
            </div>
          </window.Card>
        ))}
      </div>
    </div>
  );
}

function HighlightRow({ icon, tone, label, product, valueLabel, subLabel }) {
  if (!product) return null;
  const bg = tone === 'primary' ? T.primarySoft : T.amberSoft;
  const bd = tone === 'primary' ? '#CDE6D7' : '#EFDDA8';
  return (
    <div style={{
      background: bg, border: `1px solid ${bd}`, borderRadius: 16, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: tone === 'primary' ? T.primaryInk : '#7A4F08',
          textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: T.ink, marginTop: 2, letterSpacing: '-0.01em' }}>{product.name}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <window.Num size={15} weight={700} color={tone === 'primary' ? T.primaryInk : '#7A4F08'}>{valueLabel}</window.Num>
        <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink3, marginTop: 2 }}>{subLabel}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. PRODUTOS
// ════════════════════════════════════════════════════════════════
function ProductsScreen({ ctx }) {
  const { products } = ctx;
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [scrolled, setScrolled] = React.useState(false);

  const filtered = products.filter(p =>
    (cat === 'all' || p.cat === cat) &&
    (q === '' ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.brand.toLowerCase().includes(q.toLowerCase()) ||
      window.CAT_LABEL[p.cat].toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div onScroll={(e) => setScrolled(e.target.scrollTop > 4)} style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden', background: T.bg, position: 'relative',
    }}>
      <window.AppBar
        large
        title="Produtos"
        subtitle={`${products.length} cadastrados · estoque total ${products.reduce((s,p) => s + p.stock, 0)} un.`}
        scrolled={scrolled}
        right={<window.IconBtn Icon={window.IcFilter}/>}
      />

      {/* Search */}
      <div style={{ padding: '4px 20px 6px' }}>
        <window.SearchField value={q} onChange={setQ} placeholder="Buscar por nome, marca…"/>
      </div>

      {/* Category chips */}
      <div style={{ padding: '6px 0 4px' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 20px', scrollbarWidth: 'none' }}>
          {window.CATEGORIES.map(c => {
            const active = c.id === cat;
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${active ? T.ink : T.border}`,
                background: active ? T.ink : T.surface,
                color: active ? '#fff' : T.ink,
                fontFamily: FONT, fontWeight: 600, fontSize: 13, letterSpacing: '-0.005em',
                cursor: 'pointer',
              }}>{c.label}</button>
            );
          })}
        </div>
      </div>

      {/* Products list */}
      <div style={{ padding: '8px 20px 130px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0
          ? (products.length === 0
              ? <OnboardEmpty
                  Icon={window.IcBox}
                  title="Sem produtos cadastrados"
                  subtitle="Toque no botão + para cadastrar seu primeiro produto."
                  ctaLabel="Cadastrar produto"
                  onCta={() => ctx.openProduct(null)}/>
              : <window.EmptyState Icon={window.IcBox} title="Nenhum produto encontrado" subtitle="Tente ajustar a busca ou os filtros."/>)
          : filtered.map(p => <ProductRow key={p.id} p={p} onClick={() => ctx.openProduct(p)}/>)}
      </div>

      {/* FAB */}
      <button onClick={() => ctx.openProduct(null)} style={{
        position: 'absolute', right: 20, bottom: 110, zIndex: 5,
        width: 56, height: 56, borderRadius: 18, border: 0,
        background: T.ink, color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)',
      }}>
        <window.IcPlus size={26} color="#fff" sw={2.2}/>
      </button>
    </div>
  );
}

function ProductRow({ p, onClick }) {
  const m = window.margin(p);
  const lowMargin = m < 30;
  const lowStock = p.stock <= 6;

  return (
    <div onClick={onClick} style={{
      background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
      padding: 14, display: 'flex', gap: 12, cursor: 'pointer',
    }}>
      <window.ProductAvatar product={p} size={52} radius={13}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: T.ink, letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.name}
          </div>
          <window.Num size={15.5} weight={700}>{window.brl(p.price)}</window.Num>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, color: T.ink3, fontWeight: 500 }}>
            {window.CAT_LABEL[p.cat]} · {p.volume}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.ink3 }}>
            custo {window.brl(p.cost)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
          <window.Pill tone={lowMargin ? 'amber' : 'primary'}>
            {lowMargin && <window.IcWarn size={11} color="#7A4F08"/>}
            margem {window.pct(m)}
          </window.Pill>
          <window.Pill tone="neutral">
            lucro {window.brl(window.profit(p))}/un.
          </window.Pill>
          <window.Pill tone={lowStock ? 'danger' : 'neutral'}>
            {lowStock && <window.IcWarn size={11} color="#7A2010"/>}
            estoque {p.stock}
          </window.Pill>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. VENDER (PDV)
// ════════════════════════════════════════════════════════════════
function SellScreen({ ctx }) {
  const { products, cart, setCart } = ctx;
  const [q, setQ] = React.useState('');

  if (products.length === 0) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
        <window.AppBar title="Nova venda"/>
        <OnboardEmpty
          Icon={window.IcBox}
          title="Cadastre produtos primeiro"
          subtitle="Você precisa ter pelo menos um produto cadastrado para registrar uma venda."
          ctaLabel="Ir para produtos"
          onCta={() => { ctx.setTab('produtos'); ctx.openProduct(null); }}/>
      </div>
    );
  }

  const filtered = products.filter(p =>
    q === '' ||
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.brand.toLowerCase().includes(q.toLowerCase())
  );

  const addToCart = (p) => {
    setCart(prev => {
      const exists = prev.find(i => i.pid === p.id);
      if (exists) return prev.map(i => i.pid === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { pid: p.id, name: p.name, qty: 1, price: p.price, cost: p.cost, volume: p.volume, cat: p.cat }];
    });
  };
  const updateQty = (pid, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.pid !== pid));
    else setCart(prev => prev.map(i => i.pid === pid ? { ...i, qty } : i));
  };
  const updatePrice = (pid, price) => {
    setCart(prev => prev.map(i => i.pid === pid ? { ...i, price } : i));
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cost = cart.reduce((s, i) => s + i.cost * i.qty, 0);
  const lucro = total - cost;
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'hidden' }}>
      <window.AppBar
        title="Nova venda"
        left={cart.length > 0 && <button onClick={() => setCart([])} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.danger,
        }}>Limpar</button>}
        right={<window.IconBtn Icon={window.IcGear}/>}
      />

      {/* Search */}
      <div style={{ padding: '0 20px 8px' }}>
        <window.SearchField value={q} onChange={setQ} placeholder="Adicionar produto…"/>
      </div>

      {/* Cart items (compact) */}
      {cart.length > 0 && (
        <div style={{
          background: T.surface, margin: '0 20px', borderRadius: 16,
          border: `1px solid ${T.border}`, padding: 4, maxHeight: 240, overflowY: 'auto',
          flexShrink: 0,
        }}>
          {cart.map((item, idx) => {
            const p = products.find(pp => pp.id === item.pid);
            return (
              <div key={item.pid} style={{
                padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: idx < cart.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <window.ProductAvatar product={p} size={36} radius={10}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: T.ink,
                    letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.ink3, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {window.brl(item.price)} × {item.qty} = <span style={{ color: T.ink, fontWeight: 700 }}>{window.brl(item.price * item.qty)}</span>
                  </div>
                </div>
                <window.Stepper value={item.qty} onChange={(v) => updateQty(item.pid, v)} min={0}/>
              </div>
            );
          })}
        </div>
      )}

      {/* Product picker */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 0' }}>
        <div style={{
          fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.ink2,
          textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, padding: '0 4px',
        }}>{cart.length === 0 ? 'Toque para adicionar' : 'Adicionar mais'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingBottom: 200 }}>
          {filtered.map(p => {
            const inCart = cart.find(i => i.pid === p.id);
            return (
              <button key={p.id} onClick={() => addToCart(p)} style={{
                background: T.surface, border: `1px solid ${inCart ? T.primary : T.border}`,
                borderRadius: 14, padding: 12, cursor: 'pointer',
                textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <window.ProductAvatar product={p} size={36} radius={10}/>
                  {inCart && <div style={{
                    minWidth: 22, height: 22, padding: '0 6px', borderRadius: 999, background: T.primary,
                    fontFamily: FONT, fontWeight: 800, fontSize: 11, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{inCart.qty}</div>}
                </div>
                <div>
                  <div style={{
                    fontFamily: FONT, fontWeight: 700, fontSize: 13, color: T.ink,
                    letterSpacing: '-0.01em', lineHeight: 1.2,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 32,
                  }}>{p.name}</div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink3, marginTop: 2 }}>{p.volume}</div>
                </div>
                <window.Num size={14} weight={700} style={{ marginTop: 'auto' }}>{window.brl(p.price)}</window.Num>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky checkout bar */}
      {cart.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 88,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: `1px solid ${T.border}`,
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total · {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </div>
              <window.Num size={24} weight={800} style={{ marginTop: 2 }}>{window.brl(total)}</window.Num>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lucro est.</div>
              <window.Num size={20} weight={700} color={T.primary} style={{ marginTop: 2 }}>{window.brl(lucro)}</window.Num>
            </div>
          </div>
          <window.PrimaryBtn onClick={() => ctx.openCheckout()}>
            Finalizar venda <window.IcChevR size={18} color="#fff" sw={2.2}/>
          </window.PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. VENDAS (history)
// ════════════════════════════════════════════════════════════════
function SalesScreen({ ctx }) {
  const { sales } = ctx;
  const [period, setPeriod] = React.useState('semana');
  const [scrolled, setScrolled] = React.useState(false);
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');

  if (sales.length === 0) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
        <window.AppBar large title="Vendas" subtitle="Histórico de transações"/>
        <OnboardEmpty
          Icon={window.IcReceipt}
          title="Ainda não há vendas"
          subtitle="O histórico aparece aqui assim que você fechar a primeira venda."
          ctaLabel={ctx.products.length > 0 ? 'Nova venda' : null}
          onCta={ctx.products.length > 0 ? () => ctx.setTab('vender') : null}/>
      </div>
    );
  }

  // Convert a YYYY-MM-DD into "days ago" relative to today (0 = today).
  const dateToOffset = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const today = new Date(); today.setHours(0,0,0,0);
    const sel = new Date(y, m-1, d);
    return Math.round((today - sel) / 86400000);
  };
  const fromOffset = dateToOffset(customTo);   // newer date = smaller offset
  const toOffset   = dateToOffset(customFrom); // older date = bigger offset
  const customActive = period === 'personalizado' && customFrom && customTo;

  const filtered = sales.filter(s => {
    if (customActive) return s.day >= fromOffset && s.day <= toOffset;
    if (period === 'hoje')   return s.day === 0;
    if (period === 'semana') return s.day < 7;
    if (period === 'mes')    return s.day < 30;
    return true;
  });

  // Group by day
  const groups = {};
  filtered.forEach(s => {
    if (!groups[s.dateLabel]) groups[s.dateLabel] = [];
    groups[s.dateLabel].push(s);
  });

  const totalRev = filtered.reduce((s, v) => s + v.total, 0);
  const totalProfit = filtered.reduce((s, v) => s + v.profit, 0);

  return (
    <div onScroll={(e) => setScrolled(e.target.scrollTop > 4)} style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden', background: T.bg,
    }}>
      <window.AppBar
        large
        title="Vendas"
        subtitle={`${filtered.length} vendas · ${window.brl(totalRev)} faturado`}
        scrolled={scrolled}
        right={<button onClick={() => ctx.openCashClose()} style={{
          padding: '8px 14px', borderRadius: 10, border: 0,
          background: T.ink, color: '#fff', cursor: 'pointer',
          fontFamily: FONT, fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.005em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <window.IcCalendar size={14} color="#fff"/> Fechar caixa
        </button>}
      />

      <div style={{ padding: '4px 20px 4px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
        <window.Segmented
          value={period} onChange={setPeriod}
          options={[
            { value: 'hoje', label: 'Hoje' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mês' },
            { value: 'personalizado', label: 'Período' },
          ]}/>
      </div>
      {period === 'personalizado' && (
        <div style={{ padding: '6px 20px 0', display: 'flex', gap: 8 }}>
          <window.Field label="De">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              style={{ border: 0, outline: 'none', background: 'transparent', flex: 1,
                fontFamily: FONT, fontSize: 14, fontWeight: 600, color: T.ink, minWidth: 0 }}/>
          </window.Field>
          <window.Field label="Até">
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              style={{ border: 0, outline: 'none', background: 'transparent', flex: 1,
                fontFamily: FONT, fontSize: 14, fontWeight: 600, color: T.ink, minWidth: 0 }}/>
          </window.Field>
        </div>
      )}

      {/* Summary stripe */}
      <div style={{ padding: '12px 20px 4px' }}>
        <div style={{
          background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
          padding: 14, display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Faturamento</div>
            <window.Num size={20} weight={800} style={{ marginTop: 4 }}>{window.brl(totalRev)}</window.Num>
          </div>
          <div style={{ width: 1, background: T.border }}/>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: T.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lucro</div>
            <window.Num size={20} weight={800} color={T.primary} style={{ marginTop: 4 }}>{window.brl(totalProfit)}</window.Num>
          </div>
          <div style={{ width: 1, background: T.border }}/>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Margem</div>
            <window.Num size={20} weight={800} style={{ marginTop: 4 }}>{window.pct(totalRev ? totalProfit/totalRev*100 : 0)}</window.Num>
          </div>
        </div>
      </div>

      {/* Grouped list */}
      <div style={{ padding: '8px 20px 130px' }}>
        {Object.entries(groups).map(([day, items]) => (
          <div key={day} style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px 6px' }}>
              <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: T.ink2,
                textTransform: 'uppercase', letterSpacing: '0.04em' }}>{day}</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: T.ink3, fontVariantNumeric: 'tabular-nums' }}>
                {items.length} vendas · {window.brl(items.reduce((s,v) => s+v.total, 0))}
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {items.map((s, idx) => (
                <SaleRow key={s.id} s={s} onClick={() => ctx.openSale(s)} isLast={idx === items.length - 1}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaleRow({ s, onClick, isLast }) {
  const PayIc = { pix: window.IcPix, debito: window.IcCard, credito: window.IcCard, dinheiro: window.IcCash }[s.payment];
  const canceled = s.status === 'cancelada';
  return (
    <div onClick={onClick} style={{
      padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      cursor: 'pointer', opacity: canceled ? 0.55 : 1,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: '#F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <PayIc size={18} color={T.ink}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: T.ink, letterSpacing: '-0.005em',
            textDecoration: canceled ? 'line-through' : 'none' }}>
            {s.time} · {window.PAYMENT_LABELS[s.payment]}
          </div>
          {canceled && <window.Pill tone="danger" size="sm">cancelada</window.Pill>}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: T.ink3, marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.lines.map(l => `${l.qty}× ${l.name}`).join(' · ')}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <window.Num size={14.5} weight={700} style={{ textDecoration: canceled ? 'line-through' : 'none' }}>{window.brl(s.total)}</window.Num>
        {!canceled && <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: T.primary, marginTop: 1 }}>
          +{window.brl(s.profit)}
        </div>}
      </div>
      <window.IcChevR size={14} color={T.ink3}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. RELATÓRIOS
// ════════════════════════════════════════════════════════════════
function ReportsScreen({ ctx }) {
  const { sales, products } = ctx;
  const [period, setPeriod] = React.useState('semana');
  const [scrolled, setScrolled] = React.useState(false);

  if (sales.length === 0) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
        <window.AppBar large title="Relatórios" subtitle="Performance da loja"/>
        <OnboardEmpty
          Icon={window.IcChart}
          title="Sem dados ainda"
          subtitle="Os relatórios aparecem aqui após você registrar suas primeiras vendas."
          ctaLabel={products.length > 0 ? 'Nova venda' : 'Cadastrar produto'}
          onCta={() => { if (products.length > 0) ctx.setTab('vender'); else { ctx.setTab('produtos'); ctx.openProduct(null); } }}/>
      </div>
    );
  }

  const filtered = sales.filter(s =>
    s.status !== 'cancelada' && (
      period === 'hoje' ? s.day === 0 :
      period === 'semana' ? s.day < 7 :
      s.day < 30
    )
  );

  // Per-day series
  const daysCount = period === 'hoje' ? 1 : period === 'semana' ? 7 : 30;
  const daySeries = Array.from({ length: daysCount }, (_, i) => {
    const d = daysCount - 1 - i;
    const sub = filtered.filter(s => s.day === d);
    return { d, rev: sub.reduce((s,v) => s+v.total, 0), profit: sub.reduce((s,v) => s+v.profit, 0) };
  });

  // Aggregate products
  const agg = {};
  filtered.forEach(s => s.lines.forEach(l => {
    if (!agg[l.pid]) agg[l.pid] = { pid: l.pid, name: l.name, qty: 0, rev: 0, profit: 0 };
    agg[l.pid].qty += l.qty;
    agg[l.pid].rev += l.price * l.qty;
    agg[l.pid].profit += (l.price - l.cost) * l.qty;
  }));
  const aggArr = Object.values(agg);
  const topVendidos = [...aggArr].sort((a,b) => b.qty - a.qty).slice(0, 4);
  const topLucrativos = [...aggArr].sort((a,b) => b.profit - a.profit).slice(0, 4);

  const lowMargin = [...products].sort((a,b) => window.margin(a) - window.margin(b)).slice(0, 3);

  return (
    <div onScroll={(e) => setScrolled(e.target.scrollTop > 4)} style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden', background: T.bg,
    }}>
      <window.AppBar large title="Relatórios" subtitle="Performance da loja" scrolled={scrolled}/>

      <div style={{ padding: '4px 20px 12px' }}>
        <window.Segmented value={period} onChange={setPeriod}
          options={[
            { value: 'hoje', label: 'Hoje' },
            { value: 'semana', label: '7 dias' },
            { value: 'mes', label: '30 dias' },
          ]}/>
      </div>

      {/* Trend chart */}
      <div style={{ padding: '0 20px' }}>
        <window.Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Faturamento</div>
              <window.Num size={26} weight={800} style={{ marginTop: 4 }}>
                {window.brl(filtered.reduce((s,v) => s+v.total, 0))}
              </window.Num>
            </div>
            <window.Pill tone="primary">
              <window.IcArrowUp size={11} color={T.primaryInk} sw={2.2}/>
              +14,2%
            </window.Pill>
          </div>
          <div style={{ marginTop: 14, position: 'relative', height: 110 }}>
            <BarChart data={daySeries.map(d => d.rev)} accentData={daySeries.map(d => d.profit)} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <Legend color={T.ink} label="Faturamento"/>
            <Legend color={T.primary} label="Lucro"/>
          </div>
        </window.Card>
      </div>

      {/* Top sellers */}
      <window.SectionHead title="Mais vendidos"/>
      <div style={{ padding: '0 20px' }}>
        <window.Card padded={false}>
          {topVendidos.map((agg, idx) => {
            const p = products.find(pp => pp.id === agg.pid);
            const maxQty = topVendidos[0].qty;
            return (
              <div key={agg.pid} style={{
                padding: '14px 14px',
                borderBottom: idx < topVendidos.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7, background: idx === 0 ? T.ink : '#F0EDE6',
                    color: idx === 0 ? '#fff' : T.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT, fontWeight: 800, fontSize: 11, flexShrink: 0,
                  }}>{idx + 1}</div>
                  <window.ProductAvatar product={p} size={36} radius={10}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: T.ink,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.005em' }}>{p.name}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{window.brl(agg.rev)}</div>
                  </div>
                  <window.Num size={14} weight={700}>{agg.qty} un.</window.Num>
                </div>
                <div style={{ marginTop: 8, height: 5, background: '#EFEBE1', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${(agg.qty / maxQty) * 100}%`, height: '100%', background: T.ink, borderRadius: 99 }}/>
                </div>
              </div>
            );
          })}
        </window.Card>
      </div>

      {/* Most profitable */}
      <window.SectionHead title="Mais lucrativos"/>
      <div style={{ padding: '0 20px' }}>
        <window.Card padded={false}>
          {topLucrativos.map((agg, idx) => {
            const p = products.find(pp => pp.id === agg.pid);
            const maxP = topLucrativos[0].profit;
            return (
              <div key={agg.pid} style={{
                padding: '14px 14px',
                borderBottom: idx < topLucrativos.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7, background: idx === 0 ? T.primary : T.primarySoft,
                    color: idx === 0 ? '#fff' : T.primaryInk, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT, fontWeight: 800, fontSize: 11, flexShrink: 0,
                  }}>{idx + 1}</div>
                  <window.ProductAvatar product={p} size={36} radius={10}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: T.ink,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.005em' }}>{p.name}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>margem {window.pct(window.margin(p))}</div>
                  </div>
                  <window.Num size={14} weight={700} color={T.primary}>{window.brl(agg.profit)}</window.Num>
                </div>
                <div style={{ marginTop: 8, height: 5, background: '#EFEBE1', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${(agg.profit / maxP) * 100}%`, height: '100%', background: T.primary, borderRadius: 99 }}/>
                </div>
              </div>
            );
          })}
        </window.Card>
      </div>

      {/* Despesas + Lucro líquido */}
      <ExpensesSection ctx={ctx} period={period} grossProfit={filtered.reduce((s,v) => s+v.profit, 0)}/>

      {/* Low margin alert */}
      <window.SectionHead title="Atenção: margem baixa"/>
      <div style={{ padding: '0 20px 130px' }}>
        <window.Card padded={false} style={{ background: T.amberSoft, border: '1px solid #EFDDA8' }}>
          {lowMargin.map((p, idx) => (
            <div key={p.id} style={{
              padding: '12px 14px',
              borderBottom: idx < lowMargin.length - 1 ? '1px solid rgba(122,79,8,0.12)' : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <window.ProductAvatar product={p} size={36} radius={10}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: T.ink,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 11.5, color: '#7A4F08', marginTop: 2, fontWeight: 600 }}>
                  custo {window.brl(p.cost)} · venda {window.brl(p.price)}
                </div>
              </div>
              <window.Pill tone="amber">{window.pct(window.margin(p))}</window.Pill>
            </div>
          ))}
        </window.Card>
      </div>
    </div>
  );
}

function ExpensesSection({ ctx, period, grossProfit }) {
  const { expenses, addExpense, removeExpense } = ctx;
  // Convert each expense to an amount for the current period.
  // 'mensal' = full amount if period is 'mes', proportional for 'semana'/'hoje'.
  // 'avulsa' = only counts if it happened within the period window (rough heuristic by createdAt vs now).
  const days = period === 'hoje' ? 1 : period === 'semana' ? 7 : 30;
  const now = Date.now();
  const periodExpenseTotal = expenses.reduce((acc, e) => {
    if (e.kind === 'mensal') return acc + e.amount * (days / 30);
    // avulsa: include if createdAt within `days` days
    if (e.createdAt && (now - new Date(e.createdAt).getTime()) <= days * 86400000) return acc + e.amount;
    return acc;
  }, 0);
  const netProfit = grossProfit - periodExpenseTotal;

  const handleAdd = async () => {
    const label = await window.askText({
      title: 'Nova despesa',
      message: 'Nome (ex.: Aluguel, Energia, Internet)',
      placeholder: 'Ex.: Aluguel',
    });
    if (label === null) return;
    const labelTrim = String(label).trim();
    if (!labelTrim) return window.notify('Nome obrigatório');
    const amountStr = await window.askNumber({
      title: 'Valor',
      message: 'Quanto custa por mês ou nesta despesa avulsa?',
      placeholder: '0,00', suffix: 'R$', decimal: true,
    });
    if (amountStr === null) return;
    const amount = parseFloat(String(amountStr).replace(',', '.')) || 0;
    if (amount <= 0) return window.notify('Valor inválido');
    const isAvulsa = await window.askConfirm({
      title: 'Tipo de despesa',
      message: '"Mensal" repete todo mês. "Avulsa" conta só agora.',
      confirmLabel: 'Mensal', cancelLabel: 'Avulsa',
    });
    addExpense(labelTrim, amount, isAvulsa ? 'mensal' : 'avulsa');
  };

  return (
    <>
      <window.SectionHead
        title="Despesas e lucro líquido"
        action={{ label: '+ Adicionar', onClick: handleAdd }}/>
      <div style={{ padding: '0 20px' }}>
        <window.Card style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Despesas no período</div>
              <window.Num size={18} weight={700} color={T.danger} style={{ marginTop: 4 }}>{window.brl(periodExpenseTotal)}</window.Num>
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lucro líquido</div>
              <window.Num size={18} weight={800} color={netProfit >= 0 ? T.primary : T.danger} style={{ marginTop: 4 }}>{window.brl(netProfit)}</window.Num>
            </div>
          </div>
          {expenses.length > 0 ? (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              {expenses.map((e, idx) => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  paddingTop: idx === 0 ? 0 : 10, paddingBottom: 10,
                  borderBottom: idx < expenses.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: T.ink,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.label}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>
                      {e.kind === 'mensal' ? 'Mensal recorrente' : 'Avulsa'}
                    </div>
                  </div>
                  <window.Num size={14} weight={700}>{window.brl(e.amount)}</window.Num>
                  <button onClick={async () => {
                    const ok = await window.askConfirm({
                      title: 'Remover despesa?', message: e.label,
                      confirmLabel: 'Remover', danger: true,
                    });
                    if (ok) removeExpense(e.id);
                  }} style={{
                    border: 0, background: 'transparent', cursor: 'pointer', padding: 4,
                  }}><window.IcTrash size={16} color={T.ink3}/></button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 12, fontFamily: FONT, fontSize: 12, color: T.ink3, textAlign: 'center', padding: '8px 0' }}>
              Nenhuma despesa cadastrada. Toque em "+ Adicionar" para incluir aluguel, energia, etc.
            </div>
          )}
        </window.Card>
      </div>
    </>
  );
}

function BarChart({ data, accentData }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: data.length > 14 ? 2 : 6, height: 100, paddingTop: 6 }}>
      {data.map((v, i) => {
        const h = (v / max) * 90;
        const ph = accentData ? (accentData[i] / max) * 90 : 0;
        return (
          <div key={i} style={{
            flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end',
            position: 'relative', minWidth: 0,
          }}>
            <div style={{
              width: '100%', height: Math.max(3, h), borderRadius: '4px 4px 2px 2px',
              background: '#E6E2D7', position: 'relative',
            }}>
              {ph > 0 && <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: Math.max(3, ph), background: T.primary,
                borderRadius: '4px 4px 2px 2px',
              }}/>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }}/>
      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.ink2 }}>{label}</div>
    </div>
  );
}

Object.assign(window, {
  DashboardScreen, ProductsScreen, SellScreen, SalesScreen, ReportsScreen,
});
