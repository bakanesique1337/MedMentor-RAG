// Profile hero + settings panels

// Big avatar, echo of Case List avatar but at profile scale
function ProfileAvatar({ name, size = 120, variant = 'teal' }) {
  const initials = name.split(' ').slice(0, 2).map(p => p[0]).join('');
  const variants = {
    teal:   ['#3fb9b3', '#0d7377'],
    sand:   ['#e8c98a', '#b58a4e'],
    rose:   ['#e8b0a6', '#c77566'],
    violet: ['#c5b8de', '#7a6da0'],
    mint:   ['#b8d8d5', '#4a8a85'],
    sky:    ['#a8c8d5', '#5a8ba3'],
  };
  const [from, to] = variants[variant] || variants.teal;
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      borderRadius: size * 0.16,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 12px 32px rgba(8,72,75,0.16), 0 0 0 1px rgba(255,255,255,0.5) inset',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, opacity: 0.28 }}>
        <circle cx="20" cy="100" r="70"  fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6"/>
        <circle cx="100" cy="20" r="50"  fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6"/>
        <circle cx="60" cy="60" r="28"   fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6"/>
      </svg>
      <div style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: size * 0.38, lineHeight: 1, fontWeight: 500,
        color: 'rgba(255,255,255,0.95)',
        letterSpacing: -1,
        textShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}>{initials}</div>
    </div>
  );
}

// Hero header with avatar + name + meta + primary action
function ProfileHero({ name, role, faculty, university, avatarVariant, editing, onToggleEdit }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #e8f2f1 0%, #f4f7f7 100%)',
      borderBottom: '0.5px solid rgba(10,31,31,0.08)',
      padding: '36px 28px 30px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
          fontSize: 11, color: '#0d7377', letterSpacing: 1.4, fontWeight: 600,
          marginBottom: 14,
        }}>ПРОФИЛЬ</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <ProfileAvatar name={name} size={120} variant={avatarVariant} />

          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 42, letterSpacing: -0.8, lineHeight: 1.08,
              fontWeight: 500, color: '#0a1f1f', marginBottom: 10,
            }}>
              {name}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              fontSize: 13.5, color: '#4a6060',
            }}>
              <span style={{
                padding: '3px 8px', borderRadius: 4, background: '#fff',
                border: '0.5px solid rgba(10,31,31,0.12)',
                fontFamily: '"Geist Mono", ui-monospace, monospace',
                fontSize: 10.5, letterSpacing: 1, fontWeight: 600,
                color: '#0d7377', textTransform: 'uppercase',
              }}>{role}</span>
              <span>{faculty}</span>
              <span style={{ color: '#c8d4d3' }}>·</span>
              <span>{university}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onToggleEdit} style={{
              height: 38, padding: '0 16px', borderRadius: 8,
              background: editing ? '#0a1f1f' : '#0d7377',
              color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 6px 14px rgba(13,115,119,0.25)',
            }}>
              {editing ? 'Готово' : 'Редактировать профиль'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings card — inline editable fields
function SettingsCard({ fields, editing, onChange, onChangeAvatar, avatarVariant, name }) {
  const AVATAR_VARIANTS = [
    { k: 'teal',   label: 'Бирюзовый' },
    { k: 'sand',   label: 'Песочный' },
    { k: 'rose',   label: 'Коралл' },
    { k: 'violet', label: 'Сирень' },
    { k: 'mint',   label: 'Мята' },
    { k: 'sky',    label: 'Небо' },
  ];
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '20px 22px 22px',
    }}>
      {editing && (
        <div style={{
          fontSize: 10.5, color: PR_PALETTE.teal,
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          letterSpacing: 0.8, fontWeight: 600,
          textAlign: 'right', marginBottom: 14,
          textTransform: 'uppercase',
        }}>● Режим редактирования</div>
      )}

      {/* Avatar row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 22,
        paddingBottom: 20, marginBottom: 20,
        borderBottom: `0.5px solid ${PR_PALETTE.line}`,
      }}>
        <ProfileAvatar name={name} size={72} variant={avatarVariant} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: PR_PALETTE.ink, fontWeight: 500, marginBottom: 3 }}>
            Аватар-монограмма
          </div>
          <div style={{ fontSize: 12, color: PR_PALETTE.ink3, marginBottom: 10 }}>
            Выберите цвет или загрузите фотографию
          </div>
          {editing ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AVATAR_VARIANTS.map(v => {
                const active = v.k === avatarVariant;
                return (
                  <button
                    key={v.k}
                    onClick={() => onChangeAvatar(v.k)}
                    style={{
                      padding: 3, border: `0.5px solid ${active ? PR_PALETTE.teal : PR_PALETTE.line}`,
                      background: 'transparent', borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10,
                      outline: active ? `2px solid ${PR_PALETTE.tealSoft}` : 'none',
                    }}
                    title={v.label}
                  >
                    <ProfileAvatar name={name} size={28} variant={v.k} />
                    <span style={{ fontSize: 11, color: PR_PALETTE.ink2 }}>{v.label}</span>
                  </button>
                );
              })}
              <button style={{
                padding: '0 12px', height: 38,
                border: `0.5px dashed ${PR_PALETTE.lineStrong}`,
                background: 'transparent', borderRadius: 8, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: PR_PALETTE.ink2, fontSize: 12,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Загрузить фото
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: PR_PALETTE.ink4 }}>
              Цвет: {AVATAR_VARIANTS.find(v => v.k === avatarVariant)?.label || '—'}
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
      }}>
        {fields.map(f => (
          <SettingsField key={f.key} field={f} editing={editing} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function SettingsField({ field, editing, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 10.5, letterSpacing: 1.1, textTransform: 'uppercase', fontWeight: 600,
        color: PR_PALETTE.ink3,
        fontFamily: '"Geist Mono", ui-monospace, monospace',
      }}>{field.label}</label>
      {editing && !field.readonly ? (
        field.options ? (
          <select
            value={field.value}
            onChange={e => onChange(field.key, e.target.value)}
            style={{
              height: 38, padding: '0 10px',
              border: `0.5px solid ${PR_PALETTE.lineStrong}`,
              borderRadius: 7, background: '#fff',
              fontSize: 13.5, color: PR_PALETTE.ink,
              fontFamily: 'Manrope, sans-serif',
              outline: 'none',
            }}
          >
            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={field.type || 'text'}
            value={field.value}
            onChange={e => onChange(field.key, e.target.value)}
            style={{
              height: 38, padding: '0 12px',
              border: `0.5px solid ${PR_PALETTE.lineStrong}`,
              borderRadius: 7, background: '#fff',
              fontSize: 13.5, color: PR_PALETTE.ink,
              fontFamily: 'Manrope, sans-serif',
              outline: 'none',
            }}
            onFocus={e => e.currentTarget.style.borderColor = PR_PALETTE.teal}
            onBlur={e => e.currentTarget.style.borderColor = PR_PALETTE.lineStrong}
          />
        )
      ) : (
        <div style={{
          fontSize: 14, color: PR_PALETTE.ink,
          padding: '8px 0',
          borderBottom: `0.5px solid ${PR_PALETTE.line}`,
          fontFamily: field.mono ? '"Geist Mono", ui-monospace, monospace' : 'inherit',
        }}>{field.value || <span style={{ color: PR_PALETTE.ink4 }}>—</span>}</div>
      )}
      {field.hint && (
        <div style={{ fontSize: 11, color: PR_PALETTE.ink4, marginTop: 2 }}>
          {field.hint}
        </div>
      )}
    </div>
  );
}

// Preferences toggles
function PreferencesCard({ prefs, onToggle }) {
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${PR_PALETTE.line}`,
      borderRadius: 14,
      padding: '20px 22px 12px',
    }}>
      <div style={{
        fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
        fontSize: 10, letterSpacing: 1.3, fontWeight: 600,
        color: PR_PALETTE.ink3, textTransform: 'uppercase',
        marginBottom: 14,
      }}>ПРЕДПОЧТЕНИЯ</div>
      <div>
        {prefs.map((p, i) => (
          <div key={p.key} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0',
            borderTop: i === 0 ? 'none' : `0.5px solid ${PR_PALETTE.line}`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: PR_PALETTE.ink, fontWeight: 500 }}>{p.label}</div>
              <div style={{ fontSize: 11.5, color: PR_PALETTE.ink3, marginTop: 2 }}>{p.hint}</div>
            </div>
            <div
              onClick={() => onToggle(p.key)}
              style={{
                width: 36, height: 20, borderRadius: 999, flexShrink: 0,
                background: p.value ? PR_PALETTE.teal : 'rgba(10,31,31,0.15)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 160ms',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: p.value ? 18 : 2,
                width: 16, height: 16, borderRadius: 999, background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                transition: 'left 160ms cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ProfileAvatar = ProfileAvatar;
window.ProfileHero = ProfileHero;
window.SettingsCard = SettingsCard;
window.PreferencesCard = PreferencesCard;
