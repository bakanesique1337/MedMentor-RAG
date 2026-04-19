// Case card + patient avatar placeholder + difficulty badge
const CARD_PALETTE = {
  ink: '#0a1f1f',
  ink2: '#4a6060',
  ink3: '#7a8f8f',
  line: 'rgba(10,31,31,0.08)',
  lineStrong: 'rgba(10,31,31,0.14)',
  teal: '#0d7377',
  tealSoft: '#e8f2f1',
  sand: '#f5ead0',
  sandText: '#8a6612',
  rose: '#f5dcd6',
  roseText: '#8a2e20',
  mint: '#d5e9e8',
};

// Avatar: compact square monogram block — deliberately secondary to the text
function PatientAvatar({ name, sex, category, size = 52 }) {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  // One dedicated duotone per specialty — semantically anchored:
  // кардио→красноватый (кровь), пульмо→голубой (дыхание/воздух), невро→фиолетовый (нерв. ткань),
  // эндокрино→янтарный (гормоны/железы), гастро→тёплый охристый (ЖКТ), нефро→морской-аква (жидкости).
  const palettes = {
    'Кардиология':       ['#f0b5a8', '#c4584a'],
    'Пульмонология':     ['#cfe2ea', '#5a8ba3'],
    'Неврология':        ['#d6ccea', '#6e5d9e'],
    'Эндокринология':    ['#ecd5a0', '#b07f2a'],
    'Гастроэнтерология': ['#e8c39a', '#a8713b'],
    'Нефрология':        ['#bfd9d7', '#3d7f83'],
  };
  const pair = palettes[category] || palettes['Кардиология'];
  // subtle per-patient variation — shift lightness slightly so avatars in the same category read as distinct
  const shift = (hash % 5) - 2; // -2..+2
  const adjust = (hex, d) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + d * 4));
    const g = Math.max(0, Math.min(255, ((n >> 8)  & 0xff) + d * 4));
    const b = Math.max(0, Math.min(255, ( n        & 0xff) + d * 4));
    return `rgb(${r}, ${g}, ${b})`;
  };
  const from = adjust(pair[0], shift);
  const to   = adjust(pair[1], shift);
  const initials = name.split(' ').slice(0, 2).map(p => p[0]).join('');

  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      borderRadius: 8,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 52 52" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
        <circle cx="8" cy="46" r="28" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4"/>
        <circle cx="46" cy="6"  r="22" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.4"/>
      </svg>
      <div style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 20, lineHeight: 1, fontWeight: 500,
        color: 'rgba(255,255,255,0.95)',
        letterSpacing: -0.5,
        textShadow: '0 1px 1px rgba(0,0,0,0.08)',
      }}>{initials}</div>
    </div>
  );
}

function DifficultyBadge({ level }) {
  const map = {
    easy:   { label: 'Лёгкий',  bg: CARD_PALETTE.tealSoft, fg: CARD_PALETTE.teal, pips: 1 },
    medium: { label: 'Средний', bg: CARD_PALETTE.sand,     fg: CARD_PALETTE.sandText, pips: 2 },
    hard:   { label: 'Сложный', bg: CARD_PALETTE.rose,     fg: CARD_PALETTE.roseText, pips: 3 },
  };
  const m = map[level] || map.easy;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 4,
      background: m.bg, color: m.fg,
      fontSize: 10.5, letterSpacing: 0.8, fontWeight: 600,
      fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
      textTransform: 'uppercase',
    }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            width: 4, height: 4, borderRadius: 1,
            background: i <= m.pips ? m.fg : 'currentColor', opacity: i <= m.pips ? 1 : 0.25,
          }} />
        ))}
      </div>
      {m.label}
    </div>
  );
}

function CaseCard({ c, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: '#fff',
        border: `0.5px solid ${CARD_PALETTE.line}`,
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        transition: 'transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms, border-color 200ms',
        display: 'flex', flexDirection: 'column',
        height: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 14px 34px rgba(8,72,75,0.08)';
        e.currentTarget.style.borderColor = 'rgba(13,115,119,0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = CARD_PALETTE.line;
      }}
    >
      {/* Header row: small avatar + category / patient meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <PatientAvatar name={c.patientName} sex={c.patientSex} category={c.category} size={44} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
            fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
            color: CARD_PALETTE.teal, textTransform: 'uppercase',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{c.category}</div>
          <div style={{ fontSize: 11.5, color: CARD_PALETTE.ink3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: CARD_PALETTE.ink2, fontWeight: 500 }}>{c.patientName}</span>
            <span style={{ margin: '0 6px', color: CARD_PALETTE.ink3 }}>·</span>
            <span>{c.patientAge} л.</span>
            <span style={{ margin: '0 6px', color: CARD_PALETTE.ink3 }}>·</span>
            <span>{c.patientSex === 'female' ? 'жен.' : 'муж.'}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 19, lineHeight: 1.22, letterSpacing: -0.2,
        color: CARD_PALETTE.ink, fontWeight: 500,
        marginBottom: 8,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{c.title}</div>

      {/* Brief — now 3 lines */}
      <div style={{
        fontSize: 12.5, color: CARD_PALETTE.ink2, lineHeight: 1.5,
        marginBottom: 12, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{c.patientBrief}</div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        paddingTop: 10, borderTop: `0.5px solid ${CARD_PALETTE.line}`,
      }}>
        <DifficultyBadge level={c.difficulty} />
        <div style={{
          fontSize: 12, color: CARD_PALETTE.teal, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          Начать кейс
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  );
}

window.CaseCard = CaseCard;
window.DifficultyBadge = DifficultyBadge;
window.PatientAvatar = PatientAvatar;
