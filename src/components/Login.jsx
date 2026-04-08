import { useState, useRef, useEffect } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const [shake, setShake]       = useState(false)
  const emailRef = useRef(null)

  useEffect(() => { emailRef.current?.focus() }, [])

  const mensajeError = (code) => {
    const mensajes = {
      'auth/invalid-email':        'El correo no tiene un formato válido.',
      'auth/user-not-found':       'No existe una cuenta con ese correo.',
      'auth/wrong-password':       'Contraseña incorrecta.',
      'auth/invalid-credential':   'Correo o contraseña incorrectos.',
      'auth/too-many-requests':    'Demasiados intentos. Espera unos minutos.',
      'auth/network-request-failed': 'Sin conexión. Verifica tu internet.',
      'auth/user-disabled':        'Esta cuenta fue desactivada.',
    }
    return mensajes[code] ?? 'Error al iniciar sesión. Intenta de nuevo.'
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await onLogin(email.trim(), password)
      // App.jsx detecta el cambio de sesión automáticamente
    } catch (err) {
      setError(mensajeError(err.code))
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div style={s.page}>
      {/* Fondo decorativo */}
      <div style={s.bgCircle1} />
      <div style={s.bgCircle2} />

      <div style={{ ...s.card, animation: shake ? 'shake 0.5s ease' : undefined }}>

        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.brandIcon}>
              <img
                src={'/favicon.png'}
                style={{ width: 40, height: 40 }}
              />
            </div>
          <div>
            <div style={s.logoName}>Frias Gas</div>
            <div style={s.logoBadge}>Panel Administrador</div>
          </div>
        </div>

        <div style={s.divider} />

        {/* Títulos */}
        <div style={s.titleWrap}>
          <h1 style={s.title}>Bienvenido</h1>
          <p style={s.subtitle}>Ingresa con tu cuenta para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={s.form}>

          {/* Email */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <span style={s.fieldIcon}>✉</span>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                placeholder="tu@correo.com"
                autoComplete="email"
                style={{
                  ...s.input,
                  borderColor: error ? '#ff5252' : 'var(--border)',
                }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <span style={s.fieldIcon}>🔒</span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                style={{
                  ...s.input,
                  paddingRight: '44px',
                  borderColor: error ? '#ff5252' : 'var(--border)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={s.showPassBtn}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBox}>
              <span style={{ fontSize: '14px' }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            style={{
              ...s.btnLogin,
              opacity: loading || !email || !password ? 0.6 : 1,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            }}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span style={s.loadingRow}>
                <span style={{ animation: 'pulse 1s ease infinite' }}>⏳</span>
                Verificando...
              </span>
            ) : (
              'Ingresar al panel'
            )}
          </button>
        </form>

        {/* Pie */}
        <p style={s.footer}>
          Solo el administrador puede acceder a este panel.
        </p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#0f0f0f',
    position: 'relative',
    overflow: 'hidden',
  },

  // Círculos decorativos de fondo
  bgCircle1: {
    position: 'absolute', top: '-120px', right: '-120px',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(232,245,90,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', bottom: '-120px', left: '-120px',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  card: {
    width: '100%',
    maxWidth: '400px',
    background: '#1a1a1a',
    border: '1px solid #2e2e2e',
    borderRadius: '20px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
 brandIcon: {
  width: 40,
  height: 40, 
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
},
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '48px', height: '48px',
    background: 'rgba(232,245,90,0.08)',
    border: '1px solid rgba(232,245,90,0.2)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '24px',
  },
  logoName: {
    fontSize: '18px', fontWeight: '700',
    color: '#f0ede8', letterSpacing: '-0.3px',
    fontFamily: 'var(--font)',
  },
  logoBadge: {
    fontSize: '11px', fontWeight: '500',
    color: '#e8f55a',
    background: 'rgba(232,245,90,0.1)',
    border: '1px solid rgba(232,245,90,0.2)',
    borderRadius: '6px',
    padding: '2px 8px',
    display: 'inline-block',
    marginTop: '4px',
    letterSpacing: '0.3px',
    fontFamily: 'var(--font)',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #2e2e2e, transparent)',
  },

  titleWrap: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: {
    fontSize: '24px', fontWeight: '700',
    color: '#f0ede8', margin: 0, letterSpacing: '-0.5px',
    fontFamily: 'var(--font)',
  },
  subtitle: {
    fontSize: '14px', color: '#666',
    margin: 0, fontFamily: 'var(--font)',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: {
    fontSize: '12px', fontWeight: '600',
    color: '#888', textTransform: 'uppercase',
    letterSpacing: '0.06em', fontFamily: 'var(--font)',
  },
  fieldIcon: {
    position: 'absolute', left: '12px',
    top: '50%', transform: 'translateY(-50%)',
    fontSize: '15px', pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    background: '#242424',
    border: '1.5px solid',
    borderRadius: '10px',
    padding: '12px 12px 12px 38px',
    color: '#f0ede8',
    fontSize: '15px',
    fontFamily: 'var(--font)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  showPassBtn: {
    position: 'absolute', right: '10px',
    top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none',
    cursor: 'pointer', fontSize: '16px', padding: '4px',
  },

  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(255,82,82,0.1)',
    border: '1px solid rgba(255,82,82,0.3)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px', color: '#ff7070',
    fontFamily: 'var(--font)',
  },

  btnLogin: {
    background: '#e8f55a',
    color: '#0f0f0f',
    fontWeight: '700',
    fontSize: '15px',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    width: '100%',
    marginTop: '4px',
    transition: 'opacity 0.2s, transform 0.1s',
    fontFamily: 'var(--font)',
    letterSpacing: '-0.2px',
  },
  loadingRow: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px',
  },

  footer: {
    textAlign: 'center',
    fontSize: '12px', color: '#444',
    margin: 0, fontFamily: 'var(--font)',
  },
}
