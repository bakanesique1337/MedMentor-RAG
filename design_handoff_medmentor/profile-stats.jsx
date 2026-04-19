// Profile stats panels — same visual system as Case List cards.
const PR_PALETTE = {
  ink: '#0a1f1f',
  ink2: '#4a6060',
  ink3: '#7a8f8f',
  ink4: '#a8bcbc',
  line: 'rgba(10,31,31,0.08)',
  lineStrong: 'rgba(10,31,31,0.14)',
  teal: '#0d7377',
  tealSoft: '#e8f2f1',
  tealFaint: '#f1f7f6',
  sand: '#f5ead0',
  sandText: '#8a6612',
  rose: '#f5dcd6',
  roseText: '#8a2e20',
  mint: '#d5e9e8',
  amber: '#e8b54a',
};

// BIG stat block — structured card with mono label, chip, serif number, and visual footer
function StatBig({ label, value, sub, chip, chipTone = 'neutral', footer }) {
  const chipStyles = {
    neutral: { bg: 'rgba(10,31,31,0.05)', fg: PR_PALETTE.ink2 },
    teal:    { bg: PR_PALETTE.tealSoft,    fg: PR_PALETTE.teal  },
    amber:   { bg: '#f9ecc8',              fg: '#8a6612'         },
    rose:    { bg: PR_PALETTE.rose,        fg: PR_PALETTE.roseText },
  };
  const cs = chipStyles[chipTone] || chipStyles.neutral;
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '16px 16px 14px',
      display: 'flex', flexDirection: 'column',
      minWidth: 0, minHeight: 128,
    }}>
      {/* Top row: mono label + optional chip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 10,
      }}>
        <div style={{
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
          color: PR_PALETTE.ink3, textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{label}</div>
        {chip && (
          <div style={{
            padding: '2px 6px', borderRadius: 4,
            background: cs.bg, color: cs.fg,
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 10, letterSpacing: 0.6, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>{chip}</div>
        )}
      </div>

      {/* Number */}
      <div style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 40, lineHeight: 1, letterSpacing: -1,
        fontWeight: 500, color: PR_PALETTE.ink,
        display: 'flex', alignItems: 'baseline', gap: 6,
        flex: 1,
      }}>
        {value}
        {sub && <span style={{
          fontSize: 14, color: PR_PALETTE.ink3, fontWeight: 400,
          fontFamily: 'Manrope, sans-serif', letterSpacing: 0,
        }}>{sub}</span>}
      </div>

      {/* Footer visual: progress bar or sparkline; always present for visual rhythm */}
      {footer && <div style={{ marginTop: 14 }}>{footer}</div>}
    </div>
  );
}

// Tiny progress bar for StatBig footer
function StatProgress({ value, max = 100, color = PR_PALETTE.teal }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{
      height: 4, borderRadius: 2,
      background: 'rgba(10,31,31,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color, borderRadius: 2,
      }} />
    </div>
  );
}

// Tiny sparkline for StatBig footer
function StatSparkline({ data, color = PR_PALETTE.teal, height = 18 }) {
  const max = Math.max(...data, 1);
  const w = 100; // viewBox width; scales to container
  const step = w / Math.max(data.length - 1, 1);
  const pts = data.map((d, i) => `${i * step},${height - (d / max) * (height - 2) - 1}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

window.StatProgress = StatProgress;
window.StatSparkline = StatSparkline;

// 30-day activity — bar chart of minutes practiced
function ActivityChart({ data }) {
  const max = Math.max(...data.map(d => d.m), 1);
  const today = new Date();
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '18px 20px 16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 16, marginBottom: 18,
      }}>
        <div>
          <div style={{
            fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
            fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
            color: PR_PALETTE.ink3, textTransform: 'uppercase',
            marginBottom: 6,
          }}>АКТИВНОСТЬ · 30 ДНЕЙ</div>
          <div style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 28, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1,
            color: PR_PALETTE.ink,
          }}>
            {data.reduce((a, d) => a + d.m, 0)}
            <span style={{ fontSize: 14, color: PR_PALETTE.ink3, fontWeight: 400, marginLeft: 6, fontFamily: 'Manrope' }}>мин.</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
        {data.map((d, i) => {
          const date = new Date(today); date.setDate(today.getDate() - (data.length - 1 - i));
          const isToday = i === data.length - 1;
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              height: '100%', justifyContent: 'flex-end', position: 'relative',
              cursor: 'default',
            }} title={`${date.toLocaleDateString('ru')}: ${d.m} мин.`}>
              <div style={{
                height: `${Math.max(d.m > 0 ? 3 : 0, (d.m / max) * 100)}%`,
                background: isToday ? PR_PALETTE.ink : PR_PALETTE.teal,
                borderRadius: '2px 2px 0 0',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8,
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 10, color: PR_PALETTE.ink4,
      }}>
        <span>30 дн. назад</span>
        <span>15 дн.</span>
        <span>сегодня</span>
      </div>
    </div>
  );
}

// Per-specialty breakdown (horizontal bars)
function SpecialtyBars({ items }) {
  const max = Math.max(...items.map(i => i.done), 1);
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '18px 20px',
    }}>
      <div style={{
        fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
        fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
        color: PR_PALETTE.ink3, textTransform: 'uppercase',
        marginBottom: 18,
      }}>ПО СПЕЦИАЛИЗАЦИЯМ</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(it => {
          const pct = (it.done / it.total) * 100;
          const [from, to] = it.pair;
          return (
            <div key={it.name}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 3,
                    background: `linear-gradient(135deg, ${from}, ${to})`,
                  }} />
                  <div style={{ fontSize: 13, color: PR_PALETTE.ink, fontWeight: 500 }}>{it.name}</div>
                </div>
                <div style={{
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  fontSize: 11.5, color: PR_PALETTE.ink3,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <span style={{ color: PR_PALETTE.ink, fontWeight: 500 }}>{it.done}</span>
                  <span style={{ margin: '0 4px' }}>/</span>
                  <span>{it.total}</span>
                  <span style={{ marginLeft: 8, color: PR_PALETTE.teal }}>{it.score}</span>
                </div>
              </div>
              <div style={{
                height: 6, borderRadius: 3,
                background: 'rgba(10,31,31,0.05)',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: '0 auto 0 0',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${from}, ${to})`,
                  borderRadius: 3,
                  transition: 'width 400ms cubic-bezier(0.22,1,0.36,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Diagnostic accuracy — donut
function AccuracyDonut({ correct, partial, wrong }) {
  const total = correct + partial + wrong;
  const R = 62, C = 2 * Math.PI * R;
  const sCorrect = (correct / total) * C;
  const sPartial = (partial / total) * C;
  const sWrong   = (wrong   / total) * C;
  const pct = (v) => Math.round((v / total) * 100);
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
          color: PR_PALETTE.ink3, textTransform: 'uppercase',
        }}>ТОЧНОСТЬ ДИАГНОСТИКИ</div>
        <div style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 10.5, color: PR_PALETTE.ink3,
          letterSpacing: 0.4,
        }}>ВСЕГО <span style={{ color: PR_PALETTE.ink, fontWeight: 500 }}>{total}</span> КЕЙСОВ</div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
        flex: 1,
      }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
          <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(10,31,31,0.06)" strokeWidth="14"/>
          <circle cx="80" cy="80" r={R} fill="none" stroke={PR_PALETTE.teal} strokeWidth="14"
            strokeDasharray={`${sCorrect} ${C}`} strokeDashoffset="0"
            transform="rotate(-90 80 80)" strokeLinecap="butt"/>
          <circle cx="80" cy="80" r={R} fill="none" stroke={PR_PALETTE.amber} strokeWidth="14"
            strokeDasharray={`${sPartial} ${C}`} strokeDashoffset={-sCorrect}
            transform="rotate(-90 80 80)" strokeLinecap="butt"/>
          <circle cx="80" cy="80" r={R} fill="none" stroke="#c77566" strokeWidth="14"
            strokeDasharray={`${sWrong} ${C}`} strokeDashoffset={-(sCorrect + sPartial)}
            transform="rotate(-90 80 80)" strokeLinecap="butt"/>
          <text x="80" y="78" textAnchor="middle"
            fontFamily="Fraunces, Georgia, serif" fontSize="40" fontWeight="500"
            letterSpacing="-1"
            fill={PR_PALETTE.ink}>
            {pct(correct)}
          </text>
          <text x="80" y="98" textAnchor="middle"
            fontFamily="Geist Mono, ui-monospace, monospace" fontSize="9.5"
            letterSpacing="1.3" fill={PR_PALETTE.ink3}>
            ВЕРНЫХ · %
          </text>
        </svg>

        <div style={{ flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LegendBar color={PR_PALETTE.teal}   label="Верный диагноз"    count={correct} pct={pct(correct)} />
          <LegendBar color={PR_PALETTE.amber}  label="Частично верный"   count={partial} pct={pct(partial)} />
          <LegendBar color="#c77566"           label="Ошибочный диагноз" count={wrong}   pct={pct(wrong)}   />
        </div>
      </div>
    </div>
  );
}

function LegendBar({ color, label, count, pct }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 12, marginBottom: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, background: color, borderRadius: 2, flexShrink: 0 }} />
          <span style={{
            fontSize: 12.5, color: PR_PALETTE.ink, fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{label}</span>
        </div>
        <div style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 11.5, color: PR_PALETTE.ink3,
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: PR_PALETTE.ink, fontWeight: 500 }}>{count}</span>
          <span style={{ margin: '0 5px', color: PR_PALETTE.ink4 }}>·</span>
          <span>{pct}%</span>
        </div>
      </div>
      <div style={{
        height: 3, borderRadius: 2,
        background: 'rgba(10,31,31,0.05)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 8, height: 8, background: color, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ fontSize: 12.5, color: PR_PALETTE.ink, flex: 1 }}>{label}</div>
      <div style={{
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 12, color: PR_PALETTE.ink2,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

// Recent cases table
function RecentCases({ items, onOpenAll }) {
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '18px 22px 10px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
          color: PR_PALETTE.ink3, textTransform: 'uppercase',
        }}>ПОСЛЕДНИЕ КЕЙСЫ</div>
        <div onClick={onOpenAll} style={{
          fontSize: 12, color: PR_PALETTE.teal, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          Все кейсы
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      <div>
        {items.map((it, i) => {
          const scoreColor = it.score >= 85 ? PR_PALETTE.teal
            : it.score >= 70 ? '#b38720'
            : '#8a2e20';
          const scoreBg = it.score >= 85 ? 'rgba(13,115,119,0.08)'
            : it.score >= 70 ? 'rgba(179,135,32,0.1)'
            : 'rgba(138,46,32,0.08)';
          const scoreLabel = it.score >= 85 ? 'Отлично'
            : it.score >= 70 ? 'Хорошо'
            : 'Требует разбора';
          return (
            <a key={it.id} href={`case-result.html?id=${encodeURIComponent(it.id)}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '16px 0',
              borderTop: i === 0 ? 'none' : `0.5px solid ${PR_PALETTE.line}`,
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background 120ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,31,31,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Score badge */}
              <div style={{
                width: 54, height: 54, flexShrink: 0,
                borderRadius: '50%',
                background: scoreBg,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                border: `0.5px solid ${scoreColor}22`,
              }}>
                <div style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 22, fontWeight: 500, letterSpacing: -0.5,
                  color: scoreColor, lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>{it.score}</div>
                <div style={{
                  fontSize: 8.5, color: scoreColor, opacity: 0.7,
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  letterSpacing: 0.6, marginTop: 1,
                }}>/100</div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: '"Geist Mono", ui-monospace, monospace',
                    fontSize: 9.5, letterSpacing: 1.1, fontWeight: 600,
                    color: PR_PALETTE.teal, textTransform: 'uppercase',
                  }}>{it.category}</span>
                  <span style={{
                    width: 2, height: 2, borderRadius: '50%',
                    background: PR_PALETTE.ink4,
                  }} />
                  <span style={{
                    fontSize: 11, color: PR_PALETTE.ink3,
                    fontFamily: '"Geist Mono", ui-monospace, monospace',
                    letterSpacing: 0.3,
                  }}>{it.date}</span>
                </div>
                <div style={{
                  fontSize: 15, color: PR_PALETTE.ink, fontWeight: 500,
                  lineHeight: 1.35,
                  marginBottom: 3,
                  fontFamily: 'Fraunces, Georgia, serif',
                  letterSpacing: -0.1,
                }}>{it.title}</div>
                <div style={{
                  fontSize: 12, color: PR_PALETTE.ink3,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>{it.patient}</span>
                </div>
              </div>

              {/* Status + arrow */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                flexShrink: 0,
              }}>
                <div style={{
                  fontSize: 11.5,
                  color: scoreColor,
                  fontWeight: 500,
                }}>{scoreLabel}</div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: PR_PALETTE.ink4 }}>
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// Achievements strip
function Achievements({ items }) {
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '18px 20px 16px',
    }}>
      <div style={{
        fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
        fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
        color: PR_PALETTE.ink3, textTransform: 'uppercase',
        marginBottom: 16,
      }}>ДОСТИЖЕНИЯ</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10,
      }}>
        {items.map(a => (
          <div key={a.id} style={{
            padding: 12,
            border: `0.5px solid ${a.unlocked ? 'rgba(13,115,119,0.25)' : PR_PALETTE.line}`,
            borderRadius: 10,
            background: a.unlocked ? PR_PALETTE.tealFaint : '#fafbfb',
            opacity: a.unlocked ? 1 : 0.55,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: a.unlocked ? PR_PALETTE.teal : PR_PALETTE.ink4,
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, Georgia, serif', fontSize: 14, fontStyle: 'italic', fontWeight: 600,
            }}>{a.glyph}</div>
            <div style={{ fontSize: 12.5, color: PR_PALETTE.ink, fontWeight: 500, lineHeight: 1.3 }}>{a.title}</div>
            <div style={{ fontSize: 11, color: PR_PALETTE.ink3, lineHeight: 1.4 }}>{a.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.StatBig = StatBig;
window.ActivityChart = ActivityChart;
window.SpecialtyBars = SpecialtyBars;
window.AccuracyDonut = AccuracyDonut;
window.RecentCases = RecentCases;
window.Achievements = Achievements;
window.PR_PALETTE = PR_PALETTE;
