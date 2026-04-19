// Sidebar — dark teal panel with case details
const S_COLORS = {
  bg: '#0e2e2e',          // dark teal surface
  bgRaised: '#164040',    // slightly lighter for cards
  ink: '#eaf4f3',          // near-white on dark
  ink2: '#8fb3b2',         // muted teal-gray
  ink3: '#557575',
  line: 'rgba(234,244,243,0.08)',
  lineStrong: 'rgba(234,244,243,0.16)',
  teal: '#3fb9b3',         // bright teal accent
  tealDeep: '#0d7377',
  amber: '#e8b54a',
  alert: '#e8735a',
  card: '#164040',
};

function SidebarNavItem({ icon, label, count, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 6,
        background: active ? 'rgba(63,185,179,0.12)' : 'transparent',
        color: active ? S_COLORS.ink : S_COLORS.ink2,
        fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: 'pointer', userSelect: 'none',
        borderLeft: active ? `2px solid ${S_COLORS.teal}` : '2px solid transparent',
      }}
    >
      <div style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? S_COLORS.teal : S_COLORS.ink2 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>{label}</div>
      {count !== undefined && (
        <div style={{
          fontSize: 10.5, color: S_COLORS.ink3,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
        }}>{count}</div>
      )}
    </div>
  );
}

function ChecklistItem({ label, state }) {
  const color = state === 'done' ? S_COLORS.teal : state === 'active' ? S_COLORS.ink : S_COLORS.ink3;
  const dot = state === 'done'
    ? <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill={S_COLORS.teal}/><path d="M3.5 6l2 2 3-4" stroke={S_COLORS.bg} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : state === 'active'
      ? <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="none" stroke={S_COLORS.amber} strokeWidth="1.2"/><circle cx="6" cy="6" r="2.4" fill={S_COLORS.amber}/></svg>
      : <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="none" stroke={S_COLORS.ink3} strokeWidth="1" strokeDasharray="2 2"/></svg>;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '6px 0', fontSize: 12.5,
      color, fontWeight: state === 'active' ? 500 : 400,
      textDecoration: state === 'done' ? 'line-through' : 'none',
      textDecorationColor: 'rgba(63,185,179,0.4)',
    }}>
      {dot}
      <div>{label}</div>
    </div>
  );
}

function MetaRow({ k, v, mono = false, alert = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', fontSize: 12 }}>
      <span style={{ color: S_COLORS.ink2 }}>{k}</span>
      <span style={{
        color: alert ? S_COLORS.amber : S_COLORS.ink, fontWeight: 500,
        fontFamily: mono ? '"Geist Mono", "JetBrains Mono", ui-monospace, monospace' : 'inherit',
        fontSize: mono ? 11.5 : 12,
      }}>{v}</span>
    </div>
  );
}

function Sidebar({ activeNav, setActiveNav, collapsed, setCollapsed }) {
  const iconCase = <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="3" width="10" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>;
  const iconSim = <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 5v4l3-2z" fill="currentColor"/></svg>;
  const iconLib = <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="3" height="10" fill="none" stroke="currentColor" strokeWidth="1.2"/><rect x="6" y="2" width="3" height="10" fill="none" stroke="currentColor" strokeWidth="1.2"/><rect x="10" y="3" width="2.5" height="9" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(8 11 7)"/></svg>;
  const iconStats = <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 12V4M6 12V7M10 12V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  const iconBook = <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2h4a2 2 0 012 2v8a2 2 0 00-2-2H2V2zM12 2H8a2 2 0 00-2 2v8a2 2 0 012-2h4V2z" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>;

  return (
    <div style={{
      width: collapsed ? 64 : 320,
      background: S_COLORS.bg,
      borderRight: `0.5px solid ${S_COLORS.lineStrong}`,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Manrope, -apple-system, system-ui, sans-serif',
      color: S_COLORS.ink,
      transition: 'width 200ms cubic-bezier(0.22,1,0.36,1)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{
        padding: '16px 16px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `0.5px solid ${S_COLORS.line}`,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: `linear-gradient(135deg, ${S_COLORS.teal}, ${S_COLORS.tealDeep})`,
          color: '#0a1f1f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 17, fontStyle: 'italic', fontWeight: 600, flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(63,185,179,0.35), 0 4px 12px rgba(63,185,179,0.2)',
        }}>M</div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2 }}>MedMentor</div>
              <div style={{
                fontSize: 9.5, color: S_COLORS.teal, letterSpacing: 1.6,
                fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
              }}>RAG · CLINICAL SIM</div>
            </div>
            <button onClick={() => setCollapsed(true)} style={{
              width: 24, height: 24, border: 'none', background: 'transparent',
              color: S_COLORS.ink2, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        )}
      </div>

      {collapsed && (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setCollapsed(false)} style={{
            width: 36, height: 36, border: 'none', background: 'transparent',
            color: S_COLORS.ink, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6,
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: S_COLORS.teal, cursor: 'pointer', borderRadius: 6,
            background: 'rgba(63,185,179,0.12)',
          }}>{iconCase}</div>
        </div>
      )}

      {!collapsed && (
        <>
          <div style={{ padding: '12px 10px 4px' }}>
            <SidebarNavItem icon={iconCase} label="Кейсы" count={24} active={activeNav === 'cases'} onClick={() => setActiveNav('cases')} />
          </div>

          <div style={{ height: 0.5, background: S_COLORS.line, margin: '10px 16px' }} />

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
            <div style={{
              fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase',
              color: S_COLORS.ink3, marginBottom: 10, fontWeight: 500,
              fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
            }}>Текущий кейс</div>

            <div style={{
              fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace', fontSize: 10.5,
              color: S_COLORS.teal, letterSpacing: 1, marginBottom: 6,
            }}>КАРДИОЛОГИЯ</div>

            <div style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 22, letterSpacing: -0.3, lineHeight: 1.15,
              marginBottom: 8, fontWeight: 400,
            }}>
              Мужчина, 54 года — <em style={{ color: S_COLORS.teal, fontStyle: 'italic' }}>острая боль в груди</em>
            </div>
            <div style={{ fontSize: 12, color: S_COLORS.ink2, lineHeight: 1.5, marginBottom: 14 }}>
              Поступил в приёмное отделение 40 минут назад. Симулятор работает в реальном времени.
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <div style={{
                flex: 1, background: S_COLORS.card,
                border: `0.5px solid ${S_COLORS.line}`,
                borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: S_COLORS.ink2, marginBottom: 3, fontFamily: '"Geist Mono", monospace' }}>Сложность</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: S_COLORS.teal }} />
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: S_COLORS.teal }} />
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: S_COLORS.lineStrong }} />
                  <div style={{ fontSize: 11, color: S_COLORS.ink, fontWeight: 500, marginLeft: 4 }}>2/3</div>
                </div>
              </div>
              <div style={{
                flex: 1, background: S_COLORS.card,
                border: `0.5px solid ${S_COLORS.line}`,
                borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: S_COLORS.ink2, marginBottom: 3, fontFamily: '"Geist Mono", monospace' }}>Вопросы</div>
                <div style={{
                  fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
                  fontSize: 14, fontWeight: 500, color: S_COLORS.ink,
                  fontVariantNumeric: 'tabular-nums',
                  display: 'flex', alignItems: 'baseline', gap: 2,
                }}>
                  <span style={{ color: S_COLORS.teal }}>4</span>
                  <span style={{ color: S_COLORS.ink3, fontSize: 11 }}>/ 10</span>
                </div>
              </div>
            </div>

            <SectionLabel>Паспорт пациента</SectionLabel>
            <div style={{
              background: S_COLORS.card, borderRadius: 8,
              border: `0.5px solid ${S_COLORS.line}`,
              padding: '10px 12px', marginBottom: 18,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 8, borderBottom: `0.5px solid ${S_COLORS.line}`, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                  background: 'linear-gradient(135deg, #3fb9b3, #0d7377)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, color: '#0a1f1f',
                  fontFamily: 'Fraunces, serif',
                }}>ИП</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Иванов П. С.</div>
                  <div style={{ fontSize: 11, color: S_COLORS.ink2 }}>54 года · М · 178 см · 96 кг</div>
                </div>
              </div>
              <MetaRow k="ИМТ" v="30.3 (ожирение I)" alert />
              <MetaRow k="Аллергии" v="не выявлено" />
              <MetaRow k="Хрон. забол." v="АГ, СД 2 типа" alert />
              <MetaRow k="Курение" v="20 лет, 1 пачка/день" alert />
            </div>

            <div style={{
              fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase',
              color: S_COLORS.ink3, marginBottom: 6, fontWeight: 500,
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
            }}>
              <span>Витальные показатели</span>
              <span style={{ color: S_COLORS.teal, fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: S_COLORS.teal, animation: 'pulse 1.6s ease-in-out infinite', display: 'inline-block' }} />
                LIVE
              </span>
            </div>
            <div style={{
              background: S_COLORS.card, borderRadius: 8,
              border: `0.5px solid ${S_COLORS.line}`,
              padding: '10px 12px', marginBottom: 18,
            }}>
              <MetaRow k="ЧСС" v="104 уд/мин" mono alert />
              <MetaRow k="АД" v="158 / 96 mmHg" mono alert />
              <MetaRow k="SpO₂" v="94 %" mono alert />
              <MetaRow k="Темп." v="36.8 °C" mono />
              <MetaRow k="ЧДД" v="22 /мин" mono />
            </div>

          </div>

          <div style={{
            padding: '12px 16px',
            borderTop: `0.5px solid ${S_COLORS.line}`,
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 999, flexShrink: 0,
              background: S_COLORS.teal, color: '#0a1f1f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>АК</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Анна К.</div>
              <div style={{ fontSize: 10.5, color: S_COLORS.ink2 }}>Студент · 5 курс, леч. фак.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase',
      color: S_COLORS.ink3, marginBottom: 6, fontWeight: 500,
      fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
    }}>{children}</div>
  );
}

Object.assign(window, { Sidebar });
