const LD = {
  bg: '#f4f7f7',
  paper: '#fff',
  cream: '#e8f2f1',
  ink: '#0a1f1f',
  ink2: '#1b3434',
  ink3: '#4a6060',
  ink4: '#7a8f8f',
  line: 'rgba(10,31,31,0.08)',
  line2: 'rgba(10,31,31,0.14)',
  teal: '#0d7377',
  tealDeep: '#0a5a5d',
  tealFaint: 'rgba(13,115,119,0.08)',
  amber: '#b58a4e',
  mint: '#9fc6c2',
  sand: '#efe6d6',
};

// ---------- Logo ----------
function Logo({ size = 28, color = LD.teal }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="1" y="1" width="38" height="38" rx="10" fill="#fff" stroke={color} strokeOpacity="0.35" strokeWidth="1"/>
        <path d="M9 27V13l6 10 6-10v14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="28" cy="16" r="3" fill={color}/>
        <path d="M28 19v6M25 22h6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 500, letterSpacing: -0.2, color: LD.ink }}>
          MedMentor <span style={{ color: LD.teal, fontStyle: 'italic' }}>RAG</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Header ----------
function Header({ onLogin, onGoCases, isLoggedIn }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const navItems = [
    { label: 'Продукт', href: '#features' },
    { label: 'Как работает', href: '#how' },
    { label: 'FAQ', href: '#faq' },
  ];
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(244,247,247,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: `0.5px solid ${scrolled ? LD.line : 'transparent'}`,
      transition: 'background 200ms ease, border-color 200ms ease',
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '18px 32px',
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        <Logo />
        <nav style={{ display: 'flex', gap: 28, marginLeft: 28 }}>
          {navItems.map(n => (
            <a key={n.href} href={n.href} className="mm-link" style={{
              fontSize: 13.5, color: LD.ink3, fontWeight: 500,
              transition: 'color 150ms ease', whiteSpace: 'nowrap',
            }}>{n.label}</a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        {isLoggedIn ? (
          <button onClick={onGoCases} style={{
            height: 40, padding: '0 22px',
            background: LD.teal, border: 'none',
            borderRadius: 999, color: '#fff', fontSize: 13.5, fontWeight: 500,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 6px 18px rgba(13,115,119,0.3)',
          }}>
            Начать кейс
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        ) : (
          <button onClick={onLogin} style={{
            height: 40, padding: '0 22px',
            background: LD.teal, border: 'none',
            borderRadius: 999, color: '#fff', fontSize: 13.5, fontWeight: 500,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 6px 18px rgba(13,115,119,0.3)',
          }}>
            Войти
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Hero ----------
function Hero({ onStart, onLogin, isLoggedIn }) {
  const words = ['Тренируйте', 'клиническое', 'мышление'];
  return (
    <section style={{
      position: 'relative',
      background: `linear-gradient(180deg, ${LD.cream} 0%, ${LD.bg} 78%)`,
      paddingTop: 40, paddingBottom: 100,
      overflow: 'hidden',
    }}>
      {/* Decorative grid lines */}
      <svg style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', opacity: 0.4,
      }}>
        <defs>
          <pattern id="mm-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0L0 0 0 48" fill="none" stroke="rgba(13,115,119,0.06)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mm-grid)" />
      </svg>

      <div style={{
        maxWidth: 1240, margin: '0 auto', padding: '56px 32px 0',
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
        gap: 56, alignItems: 'center', position: 'relative',
      }}>
        {/* Left */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(13,115,119,0.1)',
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 11, letterSpacing: 1.2, color: LD.teal, fontWeight: 600,
            marginBottom: 28,
          }} className="fadein-init" data-anim="hero-sub">
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: LD.teal, animation: 'mm-blink 1.8s ease-in-out infinite',
            }}/>
            КЛИНИЧЕСКИЙ ТРЕНАЖЕР НА БАЗЕ LLM + RAG
          </div>
          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 72, lineHeight: 1.02, letterSpacing: -2.2,
            fontWeight: 400, color: LD.ink,
            margin: '0 0 24px', maxWidth: 640,
          }}>
            {words.map((w, i) => (
              <span key={i} style={{ display: 'inline-block', marginRight: 14, overflow: 'hidden' }}>
                <span className="fadein-init" data-anim="hero-word" style={{
                  display: 'inline-block',
                  fontStyle: i === 1 ? 'italic' : 'normal',
                  color: i === 1 ? LD.teal : LD.ink,
                }}>
                  {w}
                </span>
              </span>
            ))}
            <br/>
            <span style={{ display: 'inline-block', overflow: 'hidden' }}>
              <span className="fadein-init" data-anim="hero-word" style={{ display: 'inline-block' }}>
                на виртуальных пациентах.
              </span>
            </span>
          </h1>
          <p className="fadein-init" data-anim="hero-sub" style={{
            fontSize: 18, lineHeight: 1.55, color: LD.ink3,
            maxWidth: 520, margin: '0 0 36px',
          }}>
            MedMentor RAG — тренажёр, где вы ведёте живой диалог с&nbsp;пациентом на русском, назначаете обследования и&nbsp;ставите диагноз. Система сверяет каждый ход с&nbsp;актуальными клиническими гайдлайнами.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isLoggedIn ? (
              <button onClick={onStart} className="fadein-init" data-anim="hero-cta" style={{
                height: 52, padding: '0 26px',
                background: LD.teal, border: 'none', borderRadius: 999,
                color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(13,115,119,0.3)',
              }}>
                Начать кейс
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ) : (
              <button onClick={onLogin} className="fadein-init" data-anim="hero-cta" style={{
                height: 52, padding: '0 26px',
                background: LD.teal, border: 'none', borderRadius: 999,
                color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(13,115,119,0.3)',
              }}>
                Войти в аккаунт
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </div>
          <div className="fadein-init" data-anim="hero-sub" style={{
            display: 'flex', alignItems: 'center', gap: 16, marginTop: 40,
            fontSize: 12.5, color: LD.ink4,
            fontFamily: '"Geist Mono", ui-monospace, monospace', letterSpacing: 0.4,
          }}>
            <div style={{ display: 'flex', marginRight: -6 }}>
              {['#0d7377', '#b58a4e', '#9fc6c2', '#1b3434'].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c, border: '2px solid #f4f7f7',
                  marginLeft: i === 0 ? 0 : -8,
                }}/>
              ))}
            </div>
            <span>2 400+ ординаторов уже тренируются</span>
          </div>
        </div>

        {/* Right — visual */}
        <div className="fadein-init" data-anim="hero-visual" style={{ position: 'relative', minHeight: 540 }}>
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 560, perspective: 1200 }}>
      {/* Soft backdrop glow */}
      <div style={{
        position: 'absolute', top: '18%', left: '12%', width: '70%', height: '60%',
        background: 'radial-gradient(closest-side, rgba(13,115,119,0.18), transparent 70%)',
        filter: 'blur(6px)', pointerEvents: 'none',
      }}/>

      {/* MAIN case card — dead center, slight 3D tilt */}
      <div data-anim="hero-float-1" style={{
        position: 'absolute', top: 60, left: '50%',
        transform: 'translateX(-50%) rotate(-1deg)',
        width: 'min(360px, 92%)',
        background: '#fff', borderRadius: 14,
        border: `0.5px solid ${LD.line}`,
        boxShadow: '0 40px 80px -24px rgba(10,31,31,0.22), 0 12px 28px -14px rgba(10,31,31,0.12)',
        padding: 18, zIndex: 3,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, flexShrink: 0,
            background: 'linear-gradient(135deg, #f0b5a8 0%, #c4584a 100%)',
            borderRadius: 8, position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 52 52" preserveAspectRatio="xMidYMid slice"
              style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
              <circle cx="8" cy="46" r="28" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4"/>
              <circle cx="46" cy="6"  r="22" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.4"/>
            </svg>
            <div style={{
              fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, lineHeight: 1,
              fontWeight: 500, color: 'rgba(255,255,255,0.95)', letterSpacing: -0.5,
              position: 'relative',
            }}>ПИ</div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
              color: LD.teal, textTransform: 'uppercase',
            }}>Кардиология</div>
            <div style={{ fontSize: 11.5, color: LD.ink4 }}>
              <span style={{ color: LD.ink3, fontWeight: 500 }}>Пётр Иванов</span>
              <span style={{ margin: '0 6px' }}>·</span><span>54 л.</span>
              <span style={{ margin: '0 6px' }}>·</span><span>муж.</span>
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 19, lineHeight: 1.22, letterSpacing: -0.2,
          color: LD.ink, fontWeight: 500, marginBottom: 8,
        }}>Давящая загрудинная боль с&nbsp;иррадиацией в&nbsp;руку</div>
        <div style={{
          fontSize: 12.5, color: LD.ink3, lineHeight: 1.5, marginBottom: 14,
        }}>
          Сжимающая боль за&nbsp;грудиной 40&nbsp;минут, иррадиация в&nbsp;левую руку. АГ и&nbsp;СД в&nbsp;анамнезе, курильщик.
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          paddingTop: 12, borderTop: `0.5px solid ${LD.line}`,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 8px', borderRadius: 4,
            background: '#f5dcd6', color: '#8a2e20',
            fontSize: 10.5, letterSpacing: 0.8, fontWeight: 600,
            fontFamily: '"Geist Mono", ui-monospace, monospace', textTransform: 'uppercase',
          }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3].map(i => (<div key={i} style={{ width: 4, height: 4, borderRadius: 1, background: '#8a2e20' }}/>))}
            </div>
            Сложный
          </div>
          <div style={{
            fontSize: 12, color: LD.teal, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            Начать кейс
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      {/* Top-left: catalog chip — peeks above the card */}
      <div data-anim="hero-float-2" style={{
        position: 'absolute', top: 14, left: 10,
        transform: 'rotate(-4deg)',
        background: '#fff', borderRadius: 999,
        border: `0.5px solid ${LD.line}`,
        boxShadow: '0 12px 28px -12px rgba(10,31,31,0.18)',
        padding: '8px 14px',
        display: 'inline-flex', alignItems: 'center', gap: 8, zIndex: 4,
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 10.5, letterSpacing: 1.2, fontWeight: 600, color: LD.teal,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: LD.teal, animation: 'mm-blink 1.8s ease-in-out infinite',
        }}/>
        КАТАЛОГ · 240+ КЕЙСОВ
      </div>

      {/* Bottom-right: score sticker — nudged closer to main card */}
      <div data-anim="hero-float-1" style={{
        position: 'absolute', bottom: 20, right: 20,
        transform: 'rotate(3deg)',
        background: LD.ink, color: '#eaf4f3',
        borderRadius: 14,
        boxShadow: '0 24px 40px -16px rgba(10,31,31,0.32)',
        padding: '14px 18px', width: 200, zIndex: 4,
      }}>
        <div style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 9.5, letterSpacing: 1.2, color: 'rgba(234,244,243,0.65)',
          fontWeight: 600, marginBottom: 6,
        }}>РАЗБОР КЕЙСА</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, color: LD.mint, fontWeight: 500, lineHeight: 1 }}>88</span>
          <span style={{ fontSize: 12, color: 'rgba(234,244,243,0.55)' }}>/ 100</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(159,198,194,0.2)', overflow: 'hidden' }}>
          <div style={{ width: '88%', height: '100%', background: LD.mint }}/>
        </div>
      </div>
    </div>
  );
}

// ---------- Stats ----------
function Stats() {
  const items = [
    { value: 240, suffix: '+', label: 'Клинических кейсов' },
    { value: 12,  suffix: '',  label: 'Специализаций' },
    { value: 94,  suffix: '%', label: 'Покрытие гайдлайнами' },
    { value: 0.8, suffix: ' с', label: 'Отклик модели' },
  ];
  return (
    <section style={{
      borderTop: `0.5px solid ${LD.line}`,
      borderBottom: `0.5px solid ${LD.line}`,
      background: '#fff',
      padding: '36px 0',
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto', padding: '0 32px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20,
      }} data-stagger>
        {items.map((it, i) => (
          <div key={i} data-stagger-child style={{
            padding: '10px 24px',
            borderLeft: i === 0 ? 'none' : `0.5px solid ${LD.line}`,
          }}>
            <div style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 54, fontWeight: 500, letterSpacing: -1.5, lineHeight: 1,
              color: LD.ink, marginBottom: 8,
            }}>
              <span data-count={it.value} data-suffix={it.suffix}>0{it.suffix}</span>
            </div>
            <div style={{ fontSize: 13, color: LD.ink3, fontWeight: 500 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Features ----------
function Features() {
  const features = [
    {
      eyebrow: '01',
      title: 'Живой диалог с пациентом',
      text: 'Собирайте анамнез как в реальной клинике. Модель симулирует речь, эмоции и реакцию на ваши вопросы — от уклончивых ответов тревожного больного до ясной картины острого состояния.',
      visual: <FeatureVisualChat />,
    },
    {
      eyebrow: '02',
      title: 'RAG по клиническим гайдлайнам',
      text: 'Каждый ход модели подкреплён цитатами из актуальных российских рекомендаций: Минздрав РФ, РКО, РОАСЛ. Вы видите источник решения и&nbsp;можете его оспорить.',
      visual: <FeatureVisualRAG />,
    },
    {
      eyebrow: '03',
      title: 'Разбор диагностики после кейса',
      text: 'Модель сравнивает ваш диагноз с эталоном и раскладывает итоговую оценку по критериям: полнота анамнеза, логика рассуждения, коммуникация, точность формулировки. Плюс — ключевые ходы диалога и&nbsp;упущенные находки.',
      visual: <FeatureVisualReview />,
    },
  ];
  return (
    <section id="features" style={{ padding: '120px 0 100px', background: LD.bg }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
        <SectionHead
          eyebrow="ВОЗМОЖНОСТИ"
          title={<>Тренажёр, приближенный <em style={{ color: LD.teal, fontStyle: 'italic' }}>к&nbsp;клинике</em></>}
          hint="Не заучивание тестов, а тренировка решений под давлением."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} data-stagger>
          {features.map((f, i) => (
            <div key={i} data-stagger-child style={{
              background: '#fff', borderRadius: 20,
              border: `0.5px solid ${LD.line}`,
              padding: 40,
              display: 'grid',
              gridTemplateColumns: i % 2 === 0 ? 'minmax(0, 1fr) minmax(0, 1.2fr)' : 'minmax(0, 1.2fr) minmax(0, 1fr)',
              gap: 48, alignItems: 'center',
            }}>
              <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                <div style={{
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  fontSize: 11, letterSpacing: 1.3, color: LD.teal, fontWeight: 600,
                  marginBottom: 14,
                }}>0{i + 1} / 03</div>
                <h3 style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 40, fontWeight: 500, lineHeight: 1.08, letterSpacing: -1,
                  color: LD.ink, margin: '0 0 16px',
                }}>{f.title}</h3>
                <p style={{
                  fontSize: 15.5, lineHeight: 1.6, color: LD.ink3, margin: 0,
                  maxWidth: 480,
                }}>{f.text}</p>
              </div>
              <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                {f.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureVisualChat() {
  const msgs = [
    { who: 'student', t: 'Опишите характер боли.' },
    { who: 'patient', t: 'Сжимающая, будто обруч. В груди по центру.' },
    { who: 'student', t: 'Куда отдаёт?' },
    { who: 'patient', t: 'В левую руку и челюсть. Уже третий час…' },
  ];
  return (
    <div style={{
      background: LD.cream, borderRadius: 14, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 10,
      border: `0.5px solid rgba(13,115,119,0.15)`,
    }}>
      {msgs.map((m, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: m.who === 'student' ? 'flex-end' : 'flex-start',
        }}>
          <div style={{
            maxWidth: '78%',
            padding: '10px 14px',
            background: m.who === 'student' ? LD.ink : '#fff',
            color: m.who === 'student' ? '#eaf4f3' : LD.ink,
            borderRadius: m.who === 'student' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
            fontSize: 13.5, lineHeight: 1.45,
            border: m.who === 'patient' ? `0.5px solid ${LD.line}` : 'none',
          }}>
            {m.t}
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureVisualRAG() {
  const cites = [
    { src: 'Клинические рекомендации Минздрава РФ', sec: 'ОКС без подъёма ST · 2023', hl: 'ЭКГ в 12 отведениях в&nbsp;течение 10&nbsp;минут от первого медконтакта' },
    { src: 'РКО · Российское кардиологическое общество', sec: 'Ведение ОКС · раздел 6.3', hl: 'Высокочувствительный тропонин I как маркер некроза' },
    { src: 'Приказ Минздрава РФ', sec: '№ 203н · критерии качества', hl: 'Стратификация риска по GRACE в&nbsp;первые часы' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {cites.map((c, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px',
          background: '#fff',
          border: `0.5px solid ${LD.line}`,
          borderLeft: `3px solid ${LD.teal}`,
          borderRadius: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: 10, letterSpacing: 0.8, color: LD.teal, fontWeight: 600,
              marginBottom: 6, textTransform: 'uppercase',
            }}>{c.src}</div>
            <div style={{ fontSize: 13, color: LD.ink, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}
              dangerouslySetInnerHTML={{ __html: c.hl }}/>
            <div style={{ fontSize: 11.5, color: LD.ink4 }}>{c.sec}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: LD.ink4, flexShrink: 0 }}>
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ))}
    </div>
  );
}

function FeatureVisualReview() {
  // Mirrors Case Chat's review page: dx vs reference, criterion scores, model quote
  const criteria = [
    { k: 'Сбор анамнеза', v: 85 },
    { k: 'Логика рассуждения', v: 80 },
    { k: 'Коммуникация', v: 76 },
    { k: 'Точность диагноза', v: 90 },
  ];
  return (
    <div style={{
      background: '#fff', border: `0.5px solid ${LD.line}`, borderRadius: 14,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header: total score */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 14, borderBottom: `0.5px solid ${LD.line}`,
      }}>
        <div style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: 1.2, color: LD.ink4, fontWeight: 600,
        }}>РАЗБОР ВАШЕЙ ДИАГНОСТИКИ</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 30, color: LD.teal, fontWeight: 500, lineHeight: 1 }}>83</span>
          <span style={{ fontSize: 11, color: LD.ink4 }}>/ 100</span>
        </div>
      </div>

      {/* Dx vs reference */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{
          padding: '10px 12px', background: LD.bg,
          border: `0.5px solid ${LD.line}`, borderRadius: 8,
        }}>
          <div style={{
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 9, letterSpacing: 1, color: LD.ink4, fontWeight: 600, marginBottom: 5,
          }}>ВАШ ОТВЕТ</div>
          <div style={{ fontSize: 12, color: LD.ink, fontWeight: 500, lineHeight: 1.35 }}>
            ОКС без подъёма ST
          </div>
        </div>
        <div style={{
          padding: '10px 12px', background: 'rgba(13,115,119,0.06)',
          border: `0.5px solid rgba(13,115,119,0.2)`, borderRadius: 8,
        }}>
          <div style={{
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 9, letterSpacing: 1, color: LD.teal, fontWeight: 600, marginBottom: 5,
          }}>ЭТАЛОН</div>
          <div style={{ fontSize: 12, color: LD.ink, fontWeight: 500, lineHeight: 1.35 }}>
            ОКС без подъёма ST
          </div>
        </div>
      </div>

      {/* Criteria rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {criteria.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 40px', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12.5, color: LD.ink, fontWeight: 500 }}>{c.k}</div>
            <div style={{
              height: 4, borderRadius: 2, background: 'rgba(10,31,31,0.06)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${c.v}%`, height: '100%',
                background: c.v >= 85 ? LD.teal : c.v >= 75 ? LD.teal : '#b58a4e',
              }}/>
            </div>
            <div style={{
              fontSize: 11.5, color: LD.ink3, textAlign: 'right',
              fontFamily: '"Geist Mono", ui-monospace, monospace',
            }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Model quote */}
      <div style={{
        padding: '10px 12px',
        background: 'linear-gradient(135deg, #e8f2f1 0%, #d5e9e8 100%)',
        border: `0.5px solid rgba(13,115,119,0.2)`, borderRadius: 8,
      }}>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.45, color: LD.ink,
        }}>
          «Уверенная диагностическая логика. Зона роста — стратификация риска по&nbsp;шкале GRACE.»
        </div>
      </div>
    </div>
  );
}

// ---------- How it works ----------
function HowItWorks() {
  const steps = [
    { n: '01', t: 'Выбор кейса', d: 'Найдите кейс по специальности и уровню сложности.' },
    { n: '02', t: 'Диалог', d: 'Задавайте вопросы пациенту, собирайте анамнез, назначайте обследования.' },
    { n: '03', t: 'Диагноз', d: 'Сформулируйте диагноз по ICD-10 с обоснованием и планом ведения.' },
    { n: '04', t: 'Разбор', d: 'Получите детальный ревью хода, ссылки на гайдлайны и оценку.' },
  ];
  return (
    <section id="how" style={{
      padding: '120px 0',
      background: LD.ink,
      color: '#eaf4f3',
      position: 'relative', overflow: 'hidden',
    }}>
      <div data-parallax style={{
        position: 'absolute', top: -120, right: -120,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,115,119,0.25), transparent 70%)',
        pointerEvents: 'none',
      }}/>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', position: 'relative' }}>
        <SectionHead
          dark
          eyebrow="ПРОЦЕСС"
          title={<>Четыре шага <em style={{ color: LD.mint, fontStyle: 'italic' }}>от&nbsp;жалобы до&nbsp;диагноза</em></>}
          hint="Полный клинический цикл в одной сессии."
        />
        <div style={{ position: 'relative', marginTop: 48 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32,
            position: 'relative',
          }} data-stagger>
            {/* Progress line — spans from center of step 1 to center of step 4 */}
            <div style={{
              position: 'absolute',
              top: 30,
              left: `calc((100% - 96px) / 8)`,
              right: `calc((100% - 96px) / 8)`,
              height: 1,
              background: 'rgba(159,198,194,0.25)',
              pointerEvents: 'none',
            }}>
              <div data-anim="how-line" style={{
                position: 'absolute', inset: 0, background: LD.mint,
                transformOrigin: 'left center',
              }}/>
            </div>
            {steps.map((s, i) => (
              <div key={i} data-stagger-child style={{ position: 'relative', paddingTop: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 28, borderRadius: '50%',
                  background: LD.ink, border: `1.5px solid ${LD.mint}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  fontSize: 10, fontWeight: 600, color: LD.mint, letterSpacing: 0.4,
                }}>{s.n}</div>
                <h4 style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 24, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.15,
                  margin: '0 0 10px', color: '#fff',
                }}>{s.t}</h4>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'rgba(234,244,243,0.65)' }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Universities ----------
function Universities({ onLogin }) {
  const perks = [
    'Персональные дашборды для преподавателей',
    'Отчёты по группам и когортам',
    'Пользовательские кейсы под вашу программу',
    'Интеграция с LMS через API',
  ];
  return (
    <section id="universities" style={{
      padding: '120px 0',
      background: `linear-gradient(180deg, ${LD.bg} 0%, ${LD.cream} 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div data-parallax style={{
        position: 'absolute', bottom: -80, left: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,115,119,0.18), transparent 70%)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        maxWidth: 1240, margin: '0 auto', padding: '0 32px',
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 72,
        alignItems: 'center', position: 'relative',
      }}>
        <div data-reveal>
          <div style={{
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 11, letterSpacing: 1.4, color: LD.teal, fontWeight: 600,
            marginBottom: 20,
          }}>ДЛЯ ВУЗОВ И&nbsp;КЛИНИК</div>
          <h2 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 56, fontWeight: 500, lineHeight: 1.05, letterSpacing: -1.6,
            margin: '0 0 20px', color: LD.ink,
          }}>
            Тренировка, которую <em style={{ color: LD.teal, fontStyle: 'italic' }}>принимают</em> кафедры
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: LD.ink3, maxWidth: 480, margin: '0 0 32px' }}>
            Подключите MedMentor RAG к учебной программе. Мы помогаем кафедрам развернуть тренажёр за две недели и&nbsp;настроить аналитику под ваши требования.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
            {perks.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="9" r="8.5" fill={LD.teal} fillOpacity="0.1" stroke={LD.teal} strokeWidth="0.5"/>
                  <path d="M5 9l2.5 2.5L13 6" stroke={LD.teal} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 14.5, color: LD.ink2 }}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={onLogin} style={{
              height: 48, padding: '0 22px',
              background: LD.ink, border: 'none', borderRadius: 999,
              color: '#eaf4f3', fontSize: 14.5, fontWeight: 500, cursor: 'pointer',
            }}>Связаться с нами</button>
          </div>
        </div>

        <div data-reveal style={{ position: 'relative' }}>
          <div style={{
            background: '#fff', borderRadius: 20,
            border: `0.5px solid ${LD.line}`,
            padding: 28,
            boxShadow: '0 30px 60px -20px rgba(10,31,31,0.15)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <div>
                <div style={{
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  fontSize: 10, letterSpacing: 1.2, color: LD.ink4, fontWeight: 600,
                  marginBottom: 6,
                }}>ДАШБОРД КАФЕДРЫ</div>
                <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, color: LD.ink, fontWeight: 500 }}>
                  Группа Л-504, терапия
                </div>
              </div>
              <div style={{
                fontSize: 11, color: LD.teal, fontWeight: 500,
                padding: '4px 10px', borderRadius: 999, background: LD.tealFaint,
              }}>24 студента</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { n: 'Ковалева А.', p: 88, cases: 12 },
                { n: 'Петров Д.',    p: 74, cases: 9 },
                { n: 'Новикова М.',  p: 91, cases: 14 },
                { n: 'Абрамов К.',   p: 62, cases: 6 },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 50px 1fr',
                  alignItems: 'center', gap: 14,
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : `0.5px solid ${LD.line}`,
                }}>
                  <div style={{ fontSize: 13, color: LD.ink, fontWeight: 500 }}>{s.n}</div>
                  <div style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 18, fontWeight: 500, color: s.p >= 80 ? LD.teal : s.p >= 70 ? LD.ink : '#8a2e20',
                  }}>{s.p}</div>
                  <div style={{
                    height: 5, borderRadius: 3, background: 'rgba(10,31,31,0.06)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: '0 auto 0 0', width: `${s.p}%`,
                      background: s.p >= 80 ? LD.teal : s.p >= 70 ? LD.amber : '#c77566',
                    }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 16, paddingTop: 16,
              borderTop: `0.5px solid ${LD.line}`,
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, color: LD.ink3,
              fontFamily: '"Geist Mono", ui-monospace, monospace', letterSpacing: 0.4,
            }}>
              <span>СРЕДНИЙ БАЛЛ · <span style={{ color: LD.ink, fontWeight: 600 }}>78,9</span></span>
              <span>ЗА НЕДЕЛЮ · +4,2</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- FAQ ----------
function FAQ() {
  const items = [
    { q: 'Для кого предназначен MedMentor RAG?',
      a: 'Для студентов медицинских вузов (3–6 курс), ординаторов и молодых врачей. Система полезна и для преподавателей — как инструмент тренировки клинического мышления с контролируемой сложностью.' },
    { q: 'На каких языках доступен тренажёр?',
      a: 'Сейчас — русский. Индексированные гайдлайны — российские: клинические рекомендации Минздрава РФ, материалы РКО и других профильных обществ.' },
    { q: 'Откуда берётся медицинский контент?',
      a: 'Только из рецензируемых источников: национальные клинические рекомендации, руководства профессиональных обществ, приказы Минздрава. Каждая подсказка имеет ссылку на первоисточник.' },
    { q: 'Как происходит оценка моих действий?',
      a: 'Оценка складывается из трёх частей: полнота сбора данных, своевременность ключевых вмешательств, правильность формулировки диагноза по ICD-10. Все критерии видны в разборе.' },
    { q: 'Есть ли бесплатный доступ?',
      a: 'Да, 5 кейсов в базовых специальностях доступны без регистрации. Для расширенной библиотеки и отслеживания прогресса нужен аккаунт.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section id="faq" style={{ padding: '120px 0', background: LD.bg }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px' }}>
        <SectionHead
          eyebrow="ЧАСТЫЕ ВОПРОСЫ"
          title={<>Что обычно <em style={{ color: LD.teal, fontStyle: 'italic' }}>спрашивают</em></>}
          center
        />
        <div style={{ marginTop: 48 }} data-stagger>
          {items.map((it, i) => (
            <div key={i} data-stagger-child
              onClick={() => setOpen(open === i ? -1 : i)}
              style={{
                borderTop: i === 0 ? `0.5px solid ${LD.line2}` : 'none',
                borderBottom: `0.5px solid ${LD.line2}`,
                padding: '24px 4px', cursor: 'pointer',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, color: LD.ink, fontWeight: 500, letterSpacing: -0.3 }}>
                  {it.q}
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: open === i ? LD.ink : 'transparent',
                  color: open === i ? '#fff' : LD.ink,
                  border: `0.5px solid ${open === i ? LD.ink : LD.line2}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 200ms ease',
                  flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 200ms ease',
                  }}>
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div style={{
                maxHeight: open === i ? 200 : 0,
                overflow: 'hidden',
                transition: 'max-height 350ms ease, margin 350ms ease',
                marginTop: open === i ? 14 : 0,
              }}>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: LD.ink3, maxWidth: 720 }}>
                  {it.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer style={{
      background: LD.ink, color: 'rgba(234,244,243,0.72)',
      padding: '64px 0 32px',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 48, marginBottom: 48, flexWrap: 'wrap',
        }}>
          <div style={{ maxWidth: 360 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect x="1" y="1" width="38" height="38" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(159,198,194,0.4)" strokeWidth="1"/>
                <path d="M9 27V13l6 10 6-10v14" stroke={LD.mint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="28" cy="16" r="3" fill={LD.mint}/>
                <path d="M28 19v6M25 22h6" stroke={LD.mint} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, color: '#fff', fontWeight: 500 }}>
                MedMentor <span style={{ color: LD.mint, fontStyle: 'italic' }}>RAG</span>
              </div>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
              Клинический тренажёр для будущих врачей. Разработан при участии кафедр РНИМУ им. Н.И.&nbsp;Пирогова.
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 28, borderTop: '0.5px solid rgba(159,198,194,0.2)',
          fontSize: 12, color: 'rgba(234,244,243,0.5)',
          fontFamily: '"Geist Mono", ui-monospace, monospace', letterSpacing: 0.4,
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>© 2026 MedMentor RAG · Все права защищены</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#" className="mm-link">Условия использования</a>
            <a href="#" className="mm-link">Конфиденциальность</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---------- Section head ----------
function SectionHead({ eyebrow, title, hint, dark, center }) {
  return (
    <div data-reveal style={{
      textAlign: center ? 'center' : 'left',
      marginBottom: 48,
      maxWidth: center ? 720 : 'none',
      margin: center ? '0 auto 48px' : '0 0 48px',
    }}>
      <div style={{
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 11, letterSpacing: 1.4, fontWeight: 600,
        color: dark ? LD.mint : LD.teal, marginBottom: 20,
      }}>{eyebrow}</div>
      <h2 style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 56, fontWeight: 500, lineHeight: 1.03, letterSpacing: -1.6,
        color: dark ? '#fff' : LD.ink, margin: 0,
      }}>{title}</h2>
      {hint && (
        <p style={{
          fontSize: 16.5, lineHeight: 1.55,
          color: dark ? 'rgba(234,244,243,0.65)' : LD.ink3,
          margin: '18px 0 0', maxWidth: 520,
          marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0,
        }}>{hint}</p>
      )}
    </div>
  );
}

Object.assign(window, {
  Logo, Header, Hero, Stats, Features, HowItWorks, Universities, FAQ, Footer,
  SectionHead, LD_PALETTE: LD,
});
