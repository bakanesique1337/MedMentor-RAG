// Chat area — teal-forward palette, Fraunces/Manrope/Geist Mono

const C_COLORS = {
  bg: '#f4f7f7',            // cool off-white
  surface: '#ffffff',
  ink: '#0a1f1f',           // very dark teal (instead of black)
  ink2: '#4a6060',
  ink3: '#8aa0a0',
  line: 'rgba(10,31,31,0.08)',
  lineStrong: 'rgba(10,31,31,0.14)',
  teal: '#0d7377',          // primary
  tealBright: '#14a8a0',
  tealDeep: '#08484b',
  tealSoft: '#d5e9e8',
  tealGhost: '#e8f2f1',
  amber: '#d89a2a',
  amberSoft: '#f5ead0',
  alert: '#c44a38',
  alertSoft: '#f5dcd6',
  patientBg: '#ffffff',
  patientBorder: 'rgba(10,31,31,0.1)',
  studentBg: '#0d7377',     // primary teal bubbles
  studentInk: '#f4f7f7',
};

function Message({ role, content, meta, emotion, think, streaming }) {
  if (role === 'system') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 0', color: C_COLORS.ink2,
      }}>
        <div style={{ flex: 1, height: 0.5, background: C_COLORS.line }} />
        <div style={{
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace', fontSize: 10.5,
          letterSpacing: 1.2, textTransform: 'uppercase',
          color: C_COLORS.teal,
        }}>{content}</div>
        <div style={{ flex: 1, height: 0.5, background: C_COLORS.line }} />
      </div>
    );
  }

  const isStudent = role === 'student';
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 0',
      flexDirection: isStudent ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 999, flexShrink: 0,
        background: isStudent
          ? `linear-gradient(135deg, ${C_COLORS.tealDeep}, #062e30)`
          : 'linear-gradient(135deg, #3a4a48, #1e2e2c)',
        color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        fontFamily: 'Manrope, system-ui, sans-serif',
        letterSpacing: 0.3,
        boxShadow: isStudent ? '0 2px 8px rgba(13,115,119,0.25)' : '0 1px 3px rgba(10,31,31,0.15)',
      }}>{isStudent ? 'АК' : 'ИП'}</div>

      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isStudent ? 'flex-end' : 'flex-start' }}>
        <div style={{
          fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase',
          color: C_COLORS.ink2, marginBottom: 4, fontWeight: 500,
          display: 'flex', gap: 8, alignItems: 'center',
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
        }}>
          <span>{isStudent ? 'Вы — Студент' : 'Пациент'}</span>
        </div>
        <div style={{
          background: isStudent ? C_COLORS.studentBg : C_COLORS.patientBg,
          color: isStudent ? C_COLORS.studentInk : C_COLORS.ink,
          padding: '11px 14px',
          borderRadius: 14,
          borderTopRightRadius: isStudent ? 4 : 14,
          borderTopLeftRadius: isStudent ? 14 : 4,
          fontSize: 14, lineHeight: 1.5,
          fontFamily: 'Manrope, system-ui, sans-serif',
          letterSpacing: -0.1,
          border: isStudent ? 'none' : `0.5px solid ${C_COLORS.patientBorder}`,
          boxShadow: isStudent
            ? '0 2px 8px rgba(13,115,119,0.18)'
            : '0 1px 2px rgba(10,31,31,0.03)',
        }}>
          {content}
          {streaming && (
            <span style={{
              display: 'inline-block',
              width: 2, height: '1em',
              background: C_COLORS.teal,
              marginLeft: 2, verticalAlign: 'text-bottom',
              animation: 'caretBlink 0.9s steps(1) infinite',
              borderRadius: 1,
            }} />
          )}
        </div>
        {think && false && (
          <div style={{
            marginTop: 6, padding: '8px 12px',
            background: C_COLORS.tealGhost,
            border: `0.5px dashed ${C_COLORS.teal}`,
            borderRadius: 8, fontSize: 12, color: C_COLORS.tealDeep,
            fontStyle: 'italic', lineHeight: 1.5, maxWidth: 360,
          }}>
            <span style={{
              fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
              fontSize: 9.5, letterSpacing: 1, fontStyle: 'normal',
              marginRight: 6, color: C_COLORS.teal, fontWeight: 600,
            }}>RAG ↳</span>
            {think}
          </div>
        )}
        {meta && (
          <div style={{
            fontSize: 10.5, color: C_COLORS.ink3, marginTop: 4,
            fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
          }}>
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ onFinish, onDiagnose }) {
  const [w, setW] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  React.useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const showBreadcrumbs = w >= 1100;
  const showChip = w >= 980;
  const showTurns = w >= 1180;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 24px',
      borderBottom: `0.5px solid ${C_COLORS.lineStrong}`,
      background: C_COLORS.bg, zIndex: 3,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: C_COLORS.ink2,
        minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap',
        flexShrink: 1,
      }}>
        {showBreadcrumbs && (
          <>
            <span>Кейсы</span>
            <svg width="8" height="8" viewBox="0 0 8 8" style={{ opacity: 0.5, flexShrink: 0 }}><path d="M3 2l3 2-3 2" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
            <span>Кардиология</span>
            <svg width="8" height="8" viewBox="0 0 8 8" style={{ opacity: 0.5, flexShrink: 0 }}><path d="M3 2l3 2-3 2" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
          </>
        )}
        <span style={{
          color: C_COLORS.teal, fontWeight: 600,
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
          fontSize: 12, letterSpacing: 0.5,
        }}>C-0342</span>
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      {showChip && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: C_COLORS.tealSoft, color: C_COLORS.tealDeep,
          fontSize: 11, fontWeight: 500, letterSpacing: 0.2,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 999, background: C_COLORS.teal, animation: 'pulse 1.6s ease-in-out infinite' }} />
          Симуляция активна
        </div>
      )}

      {showTurns && (
        <div style={{
          fontSize: 11, color: C_COLORS.ink2,
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
          letterSpacing: 0.5, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          TURN 04 / 10
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={onFinish} style={{
          height: 34, padding: '0 14px', borderRadius: 7,
          background: 'transparent', color: C_COLORS.ink,
          border: `0.5px solid ${C_COLORS.lineStrong}`,
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3"/></svg>
          Завершить кейс
        </button>

        <button onClick={onDiagnose} style={{
          height: 34, padding: '0 16px', borderRadius: 7,
          background: C_COLORS.teal, color: '#fff',
          border: 'none',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap', flexShrink: 0,
          boxShadow: '0 2px 10px rgba(13,115,119,0.3)',
        }}>
          <svg width="12" height="12" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Подтвердить диагноз
        </button>
      </div>
    </div>
  );
}

function ChatInput({ value, onChange, onSend, suggestions, onSuggest }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  return (
    <div style={{
      borderTop: `0.5px solid ${C_COLORS.lineStrong}`,
      background: C_COLORS.bg,
      padding: '12px 24px 16px',
    }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
          color: C_COLORS.ink3, fontWeight: 500,
          padding: '5px 4px 5px 0',
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
        }}>Подсказки ↴</div>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggest(s)}
            style={{
              padding: '5px 10px', borderRadius: 999,
              background: C_COLORS.tealGhost,
              border: `0.5px solid ${C_COLORS.tealSoft}`,
              color: C_COLORS.tealDeep, fontSize: 12,
              cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
              fontWeight: 500,
            }}
          >{s}</button>
        ))}
      </div>

      <div style={{
        background: C_COLORS.surface,
        border: `1px solid ${C_COLORS.lineStrong}`,
        borderRadius: 12, padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 2px 10px rgba(10,31,31,0.04)',
      }}>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
          placeholder="Задайте вопрос пациенту или опишите действие…"
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 14, lineHeight: 1.5,
            color: C_COLORS.ink, background: 'transparent',
            minHeight: 22, maxHeight: 160,
          }}
        />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={onSend}
            disabled={!value.trim()}
            style={{
              height: 32, padding: '0 14px', borderRadius: 6,
              background: value.trim() ? C_COLORS.teal : C_COLORS.ink3,
              color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 500, cursor: value.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Manrope, system-ui, sans-serif',
            }}
          >
            Отправить
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 6, fontSize: 10.5, color: C_COLORS.ink3,
      }}>
        <span>Enter — отправить · Shift + Enter — новая строка</span>
        <span style={{ fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace' }}>MedMentor-RAG v1.2 · ollama/med-llama-7b</span>
      </div>
    </div>
  );
}

function DiagnosisModal({ open, onClose, onConfirm }) {
  const [icd, setIcd] = React.useState('I21.4');
  const [dx, setDx] = React.useState('Острый инфаркт миокарда без подъёма ST (NSTEMI)');
  const [rationale, setRationale] = React.useState('Типичная ангинозная боль >20 мин, факторы риска (АГ, СД, курение), тахикардия, умеренная гипоксемия. Требуется ЭКГ в динамике и тропонин.');
  const [confidence, setConfidence] = React.useState(70);
  const [plan, setPlan] = React.useState(['ЭКГ 12 отведений', 'Тропонин I (повтор через 3 ч)']);
  const [newStep, setNewStep] = React.useState('');

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,31,31,0.55)',
      backdropFilter: 'blur(6px)',
      animation: 'modalFade 180ms ease',
      fontFamily: 'Manrope, system-ui, sans-serif',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'relative', width: 560, maxHeight: '86vh',
        background: C_COLORS.bg, borderRadius: 14,
        boxShadow: '0 30px 80px rgba(8,72,75,0.35), 0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'modalPop 220ms cubic-bezier(0.22,1,0.36,1)',
        border: `1px solid ${C_COLORS.lineStrong}`,
      }}>
        {/* Header with teal strip */}
        <div style={{
          height: 4, background: `linear-gradient(90deg, ${C_COLORS.teal}, ${C_COLORS.tealBright})`,
        }} />
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `0.5px solid ${C_COLORS.line}`,
          position: 'relative',
        }}>
          <div style={{
            fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace', fontSize: 10.5,
            color: C_COLORS.teal, letterSpacing: 1.2, marginBottom: 8,
          }}>FINAL DIAGNOSIS · CASE #C-0342</div>
          <div style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 26, letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 4,
            color: C_COLORS.ink, fontWeight: 500,
          }}>Подтвердите <em style={{ color: C_COLORS.teal, fontStyle: 'italic' }}>диагноз</em></div>
          <div style={{ fontSize: 13, color: C_COLORS.ink2, lineHeight: 1.5 }}>
            После подтверждения симуляция завершится, и модель сравнит ваш ответ с эталоном.
          </div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 20, right: 16,
            width: 30, height: 30, border: 'none', background: 'transparent',
            cursor: 'pointer', color: C_COLORS.ink2, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '18px 24px 22px', flex: 1 }}>
          <div style={{ marginBottom: 14 }}>
            <ModalLabel>Формулировка диагноза</ModalLabel>
            <input value={dx} onChange={(e) => setDx(e.target.value)} style={modalInputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <ModalLabel hint="что натолкнуло на гипотезу">Обоснование</ModalLabel>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              style={{ ...modalInputStyle, minHeight: 76, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <ModalLabel>Уверенность</ModalLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min={0} max={100} value={confidence}
                onChange={(e) => setConfidence(+e.target.value)}
                style={{ flex: 1, accentColor: C_COLORS.teal }}
              />
              <div style={{
                fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace', fontSize: 14,
                fontWeight: 600, color: C_COLORS.teal,
                width: 52, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              }}>{confidence}%</div>
            </div>
          </div>

          <div style={{ marginBottom: 8, display: 'none' }}>
            <ModalLabel hint="исследования / терапия">План ведения</ModalLabel>
            <div style={{
              background: C_COLORS.surface, border: `0.5px solid ${C_COLORS.lineStrong}`,
              borderRadius: 8, padding: '8px 10px',
            }}>
              {plan.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0', fontSize: 13,
                  borderBottom: i < plan.length - 1 ? `0.5px solid ${C_COLORS.line}` : 'none',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 999,
                    background: C_COLORS.tealSoft, color: C_COLORS.tealDeep,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, color: C_COLORS.ink }}>{p}</div>
                  <button onClick={() => setPlan(plan.filter((_, j) => j !== i))} style={{
                    border: 'none', background: 'transparent', color: C_COLORS.ink3, cursor: 'pointer',
                    fontSize: 14, padding: 4,
                  }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, paddingTop: 6 }}>
                <input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newStep.trim()) {
                      setPlan([...plan, newStep.trim()]); setNewStep('');
                    }
                  }}
                  placeholder="+ добавить пункт"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    background: 'transparent', fontSize: 13,
                    fontFamily: 'Manrope, system-ui, sans-serif', padding: '4px 0', color: C_COLORS.ink,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{
          padding: '14px 24px',
          borderTop: `0.5px solid ${C_COLORS.line}`,
          display: 'flex', alignItems: 'center', gap: 10,
          background: C_COLORS.tealGhost,
        }}>
          <div style={{ fontSize: 11, color: C_COLORS.tealDeep, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1"/><path d="M6 3v3M6 8v0.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
            После подтверждения изменения невозможны.
          </div>
          <button onClick={onClose} style={{
            height: 34, padding: '0 14px', borderRadius: 7,
            background: 'transparent', color: C_COLORS.ink,
            border: `0.5px solid ${C_COLORS.lineStrong}`,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
          }}>Отмена</button>
          <button onClick={() => onConfirm({ icd, dx, rationale, confidence, plan })} style={{
            height: 34, padding: '0 16px', borderRadius: 7,
            background: C_COLORS.teal, color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 10px rgba(13,115,119,0.3)',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Подтвердить и завершить
          </button>
        </div>
      </div>
    </div>
  );
}

const modalInputStyle = {
  width: '100%', padding: '9px 11px',
  background: C_COLORS.surface, border: `0.5px solid ${C_COLORS.lineStrong}`,
  borderRadius: 8, fontSize: 13, color: C_COLORS.ink,
  fontFamily: 'Manrope, system-ui, sans-serif', outline: 'none', lineHeight: 1.5,
};

function ModalLabel({ children, hint }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase',
        color: C_COLORS.teal, fontWeight: 600,
        whiteSpace: 'nowrap',
        fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
      }}>{children}</div>
      {hint && (
        <div style={{
          fontSize: 11, color: C_COLORS.ink3, fontWeight: 400,
          marginTop: 2,
        }}>{hint}</div>
      )}
    </div>
  );
}

function FinishModal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,31,31,0.55)', backdropFilter: 'blur(6px)',
      animation: 'modalFade 180ms ease',
      fontFamily: 'Manrope, system-ui, sans-serif',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'relative', width: 460, maxHeight: '86vh',
        background: C_COLORS.bg, borderRadius: 14,
        boxShadow: '0 30px 80px rgba(8,72,75,0.35), 0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'modalPop 220ms cubic-bezier(0.22,1,0.36,1)',
        border: `1px solid ${C_COLORS.lineStrong}`,
      }}>
        <div style={{
          height: 4, background: `linear-gradient(90deg, ${C_COLORS.amber}, #e8b54a)`,
        }} />
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `0.5px solid ${C_COLORS.line}`,
          position: 'relative',
        }}>
          <div style={{
            fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace', fontSize: 10.5,
            color: C_COLORS.amber, letterSpacing: 1.2, marginBottom: 8, fontWeight: 600,
          }}>EXIT CASE · #C-0342</div>
          <div style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 26, letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 4,
            color: C_COLORS.ink, fontWeight: 500,
          }}>Завершить <em style={{ color: C_COLORS.amber, fontStyle: 'italic' }}>без диагноза</em>?</div>
          <div style={{ fontSize: 13, color: C_COLORS.ink2, lineHeight: 1.5 }}>
            Прогресс будет сохранён, но кейс будет отмечен как incomplete.
          </div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 20, right: 16,
            width: 30, height: 30, border: 'none', background: 'transparent',
            cursor: 'pointer', color: C_COLORS.ink2, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ padding: '18px 24px 20px' }}>
          <div style={{
            background: C_COLORS.amberSoft,
            border: `0.5px solid rgba(216,154,42,0.3)`,
            borderRadius: 8, padding: '14px 16px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            marginBottom: 16,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 999, flexShrink: 0,
              background: '#fff', color: C_COLORS.amber,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 22 22"><path d="M11 3L2 19h18L11 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M11 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="11" cy="16.5" r="0.9" fill="currentColor"/></svg>
            </div>
            <div style={{ flex: 1, fontSize: 13, color: '#6b4d0f', lineHeight: 1.55 }}>
              Вы не получите баллов за диагностическую точность. К кейсу можно вернуться позже — разбор будет доступен в режиме только для чтения.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, height: 38, padding: '0 14px', borderRadius: 7,
              background: 'transparent', color: C_COLORS.ink,
              border: `0.5px solid ${C_COLORS.lineStrong}`,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}>Продолжить кейс</button>
            <button onClick={onConfirm} style={{
              flex: 1, height: 38, padding: '0 16px', borderRadius: 7,
              background: C_COLORS.alert, color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Manrope, system-ui, sans-serif',
              boxShadow: '0 2px 10px rgba(196,74,56,0.28)',
              whiteSpace: 'nowrap',
            }}>
              Всё равно завершить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Message, TopBar, ChatInput, DiagnosisModal, FinishModal });
