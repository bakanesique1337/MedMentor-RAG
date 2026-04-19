function LoginModal({ onClose, onSuccess }) {
  const LD = window.LD_PALETTE;
  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [shake, setShake] = React.useState(false);
  const backdropRef = React.useRef(null);
  const cardRef = React.useRef(null);

  React.useEffect(() => {
    if (!window.gsap) return;
    // Animate backdrop + card simultaneously; start from inline opacity:0 below
    // so there is no flash before GSAP kicks in.
    gsap.to(backdropRef.current, { opacity: 1, duration: 0.22, ease: 'power2.out' });
    gsap.fromTo(cardRef.current,
      { y: 20, opacity: 0, scale: 0.985 },
      { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'power3.out' }
    );
  }, []);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!login || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess && onSuccess(); }, 700);
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10,31,31,0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        opacity: 0, // start hidden; GSAP tweens to 1
      }}>
      <div
        ref={cardRef}
        style={{
          width: '100%', maxWidth: 440,
          background: '#fff', borderRadius: 20,
          border: `0.5px solid ${LD.line}`,
          boxShadow: '0 40px 80px -20px rgba(10,31,31,0.4)',
          overflow: 'hidden', position: 'relative',
          opacity: 0, // start hidden; GSAP tweens to 1
          animation: shake ? 'mm-shake 0.4s' : 'none',
        }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: '50%',
          background: 'transparent', border: `0.5px solid ${LD.line2}`,
          color: LD.ink3, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>

        <div style={{ padding: '36px 36px 32px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: LD.tealFaint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              <path d="M9 27V13l6 10 6-10v14" stroke={LD.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="28" cy="16" r="3" fill={LD.teal}/>
              <path d="M28 19v6M25 22h6" stroke={LD.teal} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 30, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1,
            margin: '0 0 8px', color: LD.ink,
          }}>
            Вход в <em style={{ color: LD.teal, fontStyle: 'italic' }}>MedMentor</em>
          </h2>
          <p style={{ fontSize: 13.5, color: LD.ink3, margin: '0 0 24px' }}>
            Продолжите свою тренировку с того места, где остановились.
          </p>

          <form onSubmit={submit}>
            <Field label="Логин" mono>
              <input type="text" autoComplete="username" value={login} onChange={e => setLogin(e.target.value)}
                placeholder="a.kovaleva"
                style={fieldStyle()}/>
            </Field>
            <Field label="Пароль" mono
              action={<a href="#" style={{ fontSize: 11.5, color: LD.teal }}>Забыли?</a>}>
              <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                style={fieldStyle()}/>
            </Field>

            <button type="submit" disabled={loading} style={{
              width: '100%', height: 46, marginTop: 18,
              background: LD.teal, border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14.5, fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 6px 18px rgba(13,115,119,0.28)',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Вход…' : (
                <>
                  Войти
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes mm-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

function Field({ label, mono, action, children }) {
  const LD = window.LD_PALETTE;
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: mono ? '"Geist Mono", ui-monospace, monospace' : 'inherit',
          fontSize: 10.5, letterSpacing: 1.1, fontWeight: 600,
          color: LD.ink3, textTransform: 'uppercase',
        }}>{label}</span>
        {action}
      </div>
      {children}
    </label>
  );
}

function fieldStyle() {
  const LD = window.LD_PALETTE;
  return {
    width: '100%', height: 44, padding: '0 14px',
    background: LD.bg, border: `0.5px solid ${LD.line2}`,
    borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: LD.ink,
    outline: 'none',
    transition: 'border-color 150ms ease, background 150ms ease',
  };
}

Object.assign(window, { LoginModal });
