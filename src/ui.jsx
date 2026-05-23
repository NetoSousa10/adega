import React from 'react';
// Shared atoms used across all screens.

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bg:        '#F5F3EE',     // page background (warm)
  surface:   '#FFFFFF',
  surfaceAlt:'#FAF8F3',
  ink:       '#1A1D1F',
  ink2:      '#5C6066',
  ink3:      '#8A8E94',
  border:    '#EAE6DD',
  borderStrong:'#D9D3C6',
  primary:   '#1F7A4D',
  primaryD:  '#155F3B',
  primarySoft:'#E2F1E8',
  primaryInk:'#0E4C2F',
  amber:     '#B4760E',
  amberSoft: '#FBF0D5',
  danger:    '#B23A1F',
  dangerSoft:'#FAE2D9',
  indigo:    '#2F3F8A',
  indigoSoft:'#E5E8F4',
};

const FONT = "'Manrope', -apple-system, system-ui, sans-serif";

// ── Product avatar (no logos, just initials on category-tinted tile) ──
function ProductAvatar({ product, size = 44, radius = 12 }) {
  if (!product) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: '#F0EDE6', border: '1px solid #E6E2D7',
        flexShrink: 0,
      }}/>
    );
  }
  const tone = window.CAT_TONE[product.cat] || '#444';
  // mix tone into a soft tint via rgba
  const r = parseInt(tone.slice(1,3),16), g = parseInt(tone.slice(3,5),16), b = parseInt(tone.slice(5,7),16);
  const bg = `rgba(${r},${g},${b},0.13)`;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      position: 'relative',
      border: `1px solid rgba(${r},${g},${b},0.18)`,
    }}>
      <span style={{
        fontFamily: FONT, fontWeight: 700, fontSize: size * 0.36,
        letterSpacing: '-0.02em', color: tone,
      }}>{window.initialsFrom(product.brand || product.name)}</span>
    </div>
  );
}

// ── Pill / badge ──
function Pill({ children, tone = 'neutral', size = 'sm', style }) {
  const palette = {
    neutral:   { bg: '#F0EDE6', fg: T.ink2,    bd: '#E6E2D7' },
    primary:   { bg: T.primarySoft, fg: T.primaryInk, bd: '#CDE6D7' },
    amber:     { bg: T.amberSoft, fg: '#7A4F08', bd: '#EFDDA8' },
    danger:    { bg: T.dangerSoft, fg: '#7A2010', bd: '#EDC3B3' },
    indigo:    { bg: T.indigoSoft, fg: '#1F2A66', bd: '#CFD4EB' },
    ghost:     { bg: 'transparent', fg: T.ink2, bd: T.border },
    dark:      { bg: T.ink, fg: '#fff', bd: T.ink },
  }[tone];
  const sz = size === 'sm'
    ? { px: 8, py: 3, fs: 11, gap: 4 }
    : { px: 10, py: 5, fs: 12, gap: 5 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: sz.gap,
      padding: `${sz.py}px ${sz.px}px`, borderRadius: 999,
      background: palette.bg, color: palette.fg, border: `1px solid ${palette.bd}`,
      fontFamily: FONT, fontWeight: 600, fontSize: sz.fs,
      letterSpacing: '-0.005em',
      whiteSpace: 'nowrap', lineHeight: 1,
      ...style,
    }}>{children}</span>
  );
}

// ── Card ──
function Card({ children, style, onClick, padded = true }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface, borderRadius: 18,
      border: `1px solid ${T.border}`,
      padding: padded ? 16 : 0,
      ...style,
    }}>{children}</div>
  );
}

// ── Section header ──
function SectionHead({ title, action, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 20px', marginTop: 24, marginBottom: 10,
    }}>
      <h3 style={{ margin: 0, fontFamily: FONT, fontSize: 14, fontWeight: 700,
        color: T.ink, letterSpacing: '-0.005em', whiteSpace: 'nowrap',
        textTransform: 'uppercase' }}>{title}</h3>
      {right ?? (action && <button onClick={action.onClick} style={{
        background: 'none', border: 0, padding: 0, cursor: 'pointer',
        fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.primary,
      }}>{action.label}</button>)}
    </div>
  );
}

// ── Segmented control ──
function Segmented({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? '7px 10px' : '10px 14px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <div style={{
      display: 'inline-flex', background: '#EFEBE1', borderRadius: 999,
      padding: 3, gap: 2, border: `1px solid ${T.border}`,
    }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: 0, background: active ? T.surface : 'transparent',
            borderRadius: 999, padding: pad,
            fontFamily: FONT, fontWeight: 600, fontSize: fs,
            color: active ? T.ink : T.ink2,
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' : 'none',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ── KPI big number ──
function Num({ children, size = 28, weight = 700, color = T.ink, style }) {
  return <div style={{
    fontFamily: FONT, fontWeight: weight, fontSize: size,
    color, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.05,
    ...style,
  }}>{children}</div>;
}

// ── Sparkline ──
function Spark({ data, color = T.primary, height = 40, width = 120, fill = true }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 6) - 3]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={area} fill={color} fillOpacity="0.12" />}
      <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
    </svg>
  );
}

// ── Bottom navigation ──
function BottomNav({ tab, onTab }) {
  const raisedCenter = window.T._raisedCenter !== false;
  const tabs = [
    { id: 'inicio',    label: 'Início',    Icon: window.IcHome },
    { id: 'produtos',  label: 'Produtos',  Icon: window.IcBox },
    { id: 'vender',    label: 'Vender',    Icon: window.IcCart, accent: true },
    { id: 'vendas',    label: 'Vendas',    Icon: window.IcReceipt },
    { id: 'relatorios',label: 'Relatórios',Icon: window.IcChart },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 26, paddingTop: 10,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `1px solid ${T.border}`,
      zIndex: 30,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', padding: '0 4px' }}>
        {tabs.map(({ id, label, Icon, accent }) => {
          const active = id === tab;
          if (accent && raisedCenter) {
            return (
              <button key={id} onClick={() => onTab(id)} style={{
                background: 'transparent', border: 0, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '4px 0', gap: 4,
              }}>
                <div style={{
                  width: 50, height: 38, borderRadius: 14,
                  background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 6px 14px ${T.primary}55`,
                  marginTop: -8,
                }}>
                  <Icon size={22} color="#fff" sw={2}/>
                </div>
                <div style={{
                  fontFamily: FONT, fontSize: 10.5, fontWeight: 700,
                  color: active ? T.primary : T.ink2, letterSpacing: '-0.005em',
                }}>{label}</div>
              </button>
            );
          }
          return (
            <button key={id} onClick={() => onTab(id)} style={{
              background: 'transparent', border: 0, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 0',
            }}>
              <Icon size={22} color={active ? T.ink : T.ink3} sw={active ? 2 : 1.7}/>
              <div style={{
                fontFamily: FONT, fontSize: 10.5, fontWeight: active ? 700 : 500,
                color: active ? T.ink : T.ink3, letterSpacing: '-0.005em',
              }}>{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Top app bar (custom — not iOS NavBar) ──
function AppBar({ title, subtitle, left, right, scrolled = false, large = false }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: scrolled ? 'rgba(245,243,238,0.94)' : T.bg,
      backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
      borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
      padding: large ? '8px 20px 4px' : '10px 20px 12px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 36,
      }}>
        <div style={{ minWidth: 36, display: 'flex' }}>{left}</div>
        {!large && <div style={{
          fontFamily: FONT, fontSize: 16, fontWeight: 700, color: T.ink,
          letterSpacing: '-0.01em', textAlign: 'center', flex: 1,
        }}>{title}</div>}
        <div style={{ minWidth: 36, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
      </div>
      {large && <div style={{ marginTop: 6 }}>
        {subtitle && <div style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 500, color: T.ink2,
          letterSpacing: '-0.005em',
        }}>{subtitle}</div>}
        <div style={{
          fontFamily: FONT, fontSize: 30, fontWeight: 800, color: T.ink,
          letterSpacing: '-0.03em', marginTop: 2,
        }}>{title}</div>
      </div>}
    </div>
  );
}

// ── Icon button (top bar)
function IconBtn({ Icon, onClick, badge, color = T.ink }) {
  return (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 12, border: 0,
      background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', position: 'relative',
    }}>
      <Icon size={20} color={color}/>
      {badge != null && <span style={{
        position: 'absolute', top: 4, right: 4,
        minWidth: 16, height: 16, padding: '0 4px',
        background: T.danger, color: '#fff',
        borderRadius: 999, fontFamily: FONT, fontSize: 10, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{badge}</span>}
    </button>
  );
}

// ── Quantity stepper ──
function Stepper({ value, onChange, min = 1 }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 0,
      background: '#F0EDE5', borderRadius: 999, padding: 3,
      border: `1px solid ${T.border}`,
    }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{
        width: 30, height: 30, borderRadius: 999, border: 0, background: T.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}><window.IcMinus size={16} color={T.ink}/></button>
      <div style={{
        minWidth: 36, textAlign: 'center', fontFamily: FONT, fontWeight: 700,
        fontSize: 15, color: T.ink, fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <button onClick={() => onChange(value + 1)} style={{
        width: 30, height: 30, borderRadius: 999, border: 0, background: T.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}><window.IcPlus size={16} color={T.ink}/></button>
    </div>
  );
}

// ── Primary button (large, full-width usually) ──
function PrimaryBtn({ children, onClick, disabled, tone = 'primary', size = 'lg', style }) {
  const palette = {
    primary: { bg: T.primary, fg: '#fff', sh: `0 4px 14px ${T.primary}48` },
    dark:    { bg: T.ink,     fg: '#fff', sh: '0 4px 14px rgba(0,0,0,0.16)' },
    ghost:   { bg: 'rgba(0,0,0,0.05)', fg: T.ink, sh: 'none' },
  }[tone];
  const sz = size === 'lg' ? { h: 54, fs: 16, r: 16 } : { h: 44, fs: 14, r: 12 };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: sz.h, border: 0, borderRadius: sz.r,
      background: disabled ? '#D7D3C9' : palette.bg, color: disabled ? '#999' : palette.fg,
      fontFamily: FONT, fontWeight: 700, fontSize: sz.fs, letterSpacing: '-0.01em',
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: disabled ? 'none' : palette.sh,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }}>{children}</button>
  );
}

// ── Search bar ──
function SearchField({ value, onChange, placeholder = 'Buscar', onFocus, autoFocus }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#EDE9DE', borderRadius: 14, padding: '11px 14px',
      border: `1px solid ${T.border}`,
    }}>
      <window.IcSearch size={18} color={T.ink2}/>
      <input
        autoFocus={autoFocus}
        onFocus={onFocus}
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 0, background: 'transparent', outline: 'none', flex: 1,
          fontFamily: FONT, fontSize: 15, fontWeight: 500, color: T.ink,
          letterSpacing: '-0.01em', minWidth: 0,
        }}/>
      {value && <button onClick={() => onChange('')} style={{
        border: 0, background: 'transparent', padding: 0, cursor: 'pointer',
        color: T.ink3,
      }}><window.IcX size={16} color={T.ink3}/></button>}
    </div>
  );
}

// ── Sheet (bottom modal) ──
function Sheet({ open, onClose, children, height = 'auto' }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.35)',
        animation: 'fadeIn 0.18s ease',
      }}/>
      <div style={{
        position: 'relative',
        background: T.bg, borderRadius: '24px 24px 0 0',
        maxHeight: '92%', overflow: 'auto',
        animation: 'slideUp 0.24s cubic-bezier(0.2,0.7,0.2,1)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
        paddingBottom: 34,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: '#D9D3C6' }}/>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Full-screen page overlay (slide right→left) ──
function FullPage({ open, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90,
      background: T.bg,
      animation: 'slideInRight 0.25s cubic-bezier(0.2,0.7,0.2,1)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>{children}</div>
  );
}

// ── Form field (label-on-top, big tap targets) ──
function Field({ label, hint, children, suffix }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{
        fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.ink2,
        letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`,
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
        minHeight: 48,
      }}>
        {children}
        {suffix && <div style={{ color: T.ink3, fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>{suffix}</div>}
      </div>
      {hint && <div style={{ fontFamily: FONT, fontSize: 12, color: T.ink3, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', inputMode, style }) {
  return <input
    value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} type={type} inputMode={inputMode}
    style={{
      border: 0, outline: 'none', background: 'transparent', flex: 1,
      fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink,
      letterSpacing: '-0.01em', minWidth: 0, padding: 0,
      ...style,
    }}/>;
}

// ── Empty state ──
function EmptyState({ Icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '60px 24px', textAlign: 'center', gap: 10,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: '#EFEBE1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={26} color={T.ink2}/>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: T.ink }}>{title}</div>
      {subtitle && <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 13, color: T.ink2, maxWidth: 240 }}>{subtitle}</div>}
    </div>
  );
}

Object.assign(window, {
  T, FONT, ProductAvatar, Pill, Card, SectionHead, Segmented, Num, Spark,
  BottomNav, AppBar, IconBtn, Stepper, PrimaryBtn, SearchField,
  Sheet, FullPage, Field, TextInput, EmptyState,
});
