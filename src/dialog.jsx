import React from 'react';
// In-app dialog system — replaces window.prompt / window.confirm with a
// styled bottom-sheet that matches the rest of the design.
//
// Exposes window.askText, window.askNumber, window.askConfirm — each returns
// a Promise. Callers can use them anywhere without React context plumbing.

let dialogResolverHook = null; // set by DialogHost on mount

export function DialogHost() {
  const [d, setD] = React.useState(null);
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    dialogResolverHook = (config) =>
      new Promise(resolve => {
        setValue(config.defaultValue ?? '');
        setD({ ...config, resolve });
      });
    return () => { dialogResolverHook = null; };
  }, []);

  // Back button closes the dialog (treats as cancel).
  React.useEffect(() => {
    if (!d) return;
    let viaBack = false;
    window.history.pushState({ __adegaDialog: true }, '');
    const onPop = () => {
      viaBack = true;
      d.resolve(d.type === 'confirm' ? false : null);
      setD(null); setValue('');
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!viaBack && window.history.state?.__adegaDialog) {
        try { window.history.back(); } catch (_) { /* noop */ }
      }
    };
  }, [d]);

  if (!d) return null;
  const T = window.T;
  const FONT = "'Manrope', system-ui, sans-serif";

  const close = (result) => { d.resolve(result); setD(null); setValue(''); };
  const submit = () => {
    if (d.type === 'text' || d.type === 'number') close(value);
    else close(true);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={() => close(d.type === 'confirm' ? false : null)} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.18s ease',
      }}/>
      <div style={{
        position: 'relative',
        background: T.bg, borderRadius: '24px 24px 0 0',
        padding: '14px 22px 30px',
        animation: 'slideUp 0.22s cubic-bezier(0.2,0.7,0.2,1)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: '#D9D3C6' }}/>
        </div>

        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: T.ink, letterSpacing: '-0.01em' }}>
          {d.title}
        </div>
        {d.message && (
          <div style={{ fontFamily: FONT, fontSize: 14, color: T.ink2, marginTop: 6, lineHeight: 1.4 }}>
            {d.message}
          </div>
        )}

        {(d.type === 'text' || d.type === 'number') && (
          <div style={{ marginTop: 14 }}>
            <div style={{
              background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
              minHeight: 48,
            }}>
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder={d.placeholder || ''}
                inputMode={d.type === 'number' ? (d.decimal ? 'decimal' : 'numeric') : 'text'}
                style={{
                  border: 0, outline: 'none', background: 'transparent', flex: 1,
                  fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink,
                  letterSpacing: '-0.01em', minWidth: 0, padding: 0,
                }}/>
              {d.suffix && (
                <div style={{ color: T.ink3, fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>{d.suffix}</div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {d.cancelLabel !== null && (
            <button onClick={() => close(d.type === 'confirm' ? false : null)} style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: `1px solid ${T.border}`, background: T.surface, color: T.ink,
              fontFamily: FONT, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            }}>{d.cancelLabel || 'Cancelar'}</button>
          )}
          <button onClick={submit} style={{
            flex: d.cancelLabel === null ? 1 : 1.4, padding: '14px', borderRadius: 12, border: 0,
            background: d.danger ? T.danger : T.primary, color: '#fff',
            fontFamily: FONT, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            boxShadow: d.danger ? '0 4px 12px rgba(178,58,31,0.35)' : `0 4px 12px ${T.primary}40`,
          }}>{d.confirmLabel || 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}

// Imperative API exposed on window for use in any module.
function ensure() {
  if (!dialogResolverHook) return Promise.resolve(null);
  return null;
}

window.askText = (opts) => ensure() ?? dialogResolverHook({ type: 'text', ...opts });
window.askNumber = (opts) => ensure() ?? dialogResolverHook({ type: 'number', ...opts });
window.askConfirm = (opts) => ensure() ?? dialogResolverHook({ type: 'confirm', ...opts });
window.notify = (title, message) => ensure() ?? dialogResolverHook({
  type: 'confirm', title, message, cancelLabel: null, confirmLabel: 'OK',
});
