// Sidebar for Case List page — navigation only, no active-case state
const SL_COLORS = {
  bg: '#0e2e2e',
  bgRaised: '#164040',
  ink: '#eaf4f3',
  ink2: '#8fb3b2',
  ink3: '#557575',
  line: 'rgba(234,244,243,0.08)',
  lineStrong: 'rgba(234,244,243,0.16)',
  teal: '#3fb9b3',
  tealDeep: '#0d7377',
  amber: '#e8b54a',
};

function SLNavItem({ icon, label, count, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 6,
        background: active ? 'rgba(63,185,179,0.12)' : 'transparent',
        color: active ? SL_COLORS.ink : SL_COLORS.ink2,
        fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: 'pointer', userSelect: 'none',
        borderLeft: active ? `2px solid ${SL_COLORS.teal}` : '2px solid transparent',
      }}
    >
      <div style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? SL_COLORS.teal : SL_COLORS.ink2 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>{label}</div>
      {count !== undefined && (
        <div style={{
          fontSize: 10.5, color: SL_COLORS.ink3,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
        }}>{count}</div>
      )}
    </div>
  );
}

function SLSectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
      color: SL_COLORS.ink3, fontWeight: 600,
      fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
      padding: '0 10px', marginBottom: 8, marginTop: 18,
    }}>{children}</div>
  );
}

function CaseListSidebar({ collapsed, onToggle, activeNav, onNavChange, hideProfileSection }) {
  return (
    <div style={{
      width: collapsed ? 64 : 248,
      minWidth: collapsed ? 64 : 248,
      background: SL_COLORS.bg,
      color: SL_COLORS.ink,
      display: 'flex', flexDirection: 'column',
      height: '100vh',
      transition: 'width 240ms cubic-bezier(0.22,1,0.36,1), min-width 240ms cubic-bezier(0.22,1,0.36,1)',
      borderRight: `0.5px solid ${SL_COLORS.line}`,
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        padding: collapsed ? '16px 0 14px' : '16px 16px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: `0.5px solid ${SL_COLORS.line}`,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: `linear-gradient(135deg, ${SL_COLORS.teal}, ${SL_COLORS.tealDeep})`,
          color: '#0a1f1f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 17, fontStyle: 'italic', fontWeight: 600, flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(63,185,179,0.35), 0 4px 12px rgba(63,185,179,0.2)',
        }}>M</div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2, color: SL_COLORS.ink }}>MedMentor</div>
              <div style={{
                fontSize: 9.5, color: SL_COLORS.teal, letterSpacing: 1.6,
                fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
              }}>RAG · CLINICAL SIM</div>
            </div>
            <button onClick={onToggle} style={{
              width: 24, height: 24, border: 'none', background: 'transparent',
              color: SL_COLORS.ink2, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        )}
      </div>

      {collapsed ? (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div onClick={onToggle} style={{ cursor: 'pointer', color: SL_COLORS.ink2, padding: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L13 7L9 11M1 3L5 7L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 10px 4px', flex: 1, overflowY: 'auto' }}>
            <SLNavItem
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M4 5.5h6M4 8h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>}
              label="Все кейсы" count={48} active={activeNav === 'cases'} onClick={() => onNavChange('cases')}
            />
            <SLNavItem
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4.5 3.5L10 7L4.5 10.5V3.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/></svg>}
              label="Активная симуляция" active={activeNav === 'active'} onClick={() => onNavChange('active')}
            />


          </div>

          {/* User */}
          <div style={{
            padding: '12px 16px',
            borderTop: `0.5px solid ${SL_COLORS.line}`,
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 999, flexShrink: 0,
              background: SL_COLORS.teal, color: '#0a1f1f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>АК</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: SL_COLORS.ink }}>Анна К.</div>
              <div style={{ fontSize: 10.5, color: SL_COLORS.ink2 }}>Студент · 5 курс, леч. фак.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

window.CaseListSidebar = CaseListSidebar;
