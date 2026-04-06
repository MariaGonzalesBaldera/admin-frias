import { useState, useEffect, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

// PIN por defecto si no hay config en Firebase
const DEFAULT_PIN = '1234'

export default function PinLogin({ onSuccess }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputsRef = useRef([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    setError(false)

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus()
    }

    if (index === 3 && value) {
      const pin = [...next.slice(0, 3), value].join('')
      if (pin.length === 4) checkPin(pin)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const checkPin = async (pin) => {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'config', 'negocio'))
      const storedPin = snap.exists() ? snap.data().pin_admin : DEFAULT_PIN
      if (pin === storedPin) {
        onSuccess()
      } else {
        triggerError()
      }
    } catch {
      // Si falla Firebase, verificar contra PIN default
      if (pin === DEFAULT_PIN) {
        onSuccess()
      } else {
        triggerError()
      }
    } finally {
      setLoading(false)
    }
  }

  const triggerError = () => {
    setError(true)
    setShake(true)
    setDigits(['', '', '', ''])
    setTimeout(() => {
      setShake(false)
      inputsRef.current[0]?.focus()
    }, 600)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="fade-in">

        {/* Logo/marca */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#e8f55a" opacity="0.15"/>
              <path d="M12 6v6l4 2" stroke="#e8f55a" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="#e8f55a" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <span style={styles.logoText}>Gas & Agua</span>
          <span style={styles.logoBadge}>Admin</span>
        </div>

        <h1 style={styles.title}>Ingresa tu PIN</h1>
        <p style={styles.subtitle}>4 dígitos para acceder al panel</p>

        {/* PIN inputs */}
        <div
          style={{...styles.pinRow, animation: shake ? 'shake 0.5s ease' : 'none'}}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputsRef.current[i] = el}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                ...styles.pinInput,
                borderColor: error ? 'var(--danger)' : d ? 'var(--accent)' : 'var(--border)',
                background: d ? 'rgba(232,245,90,0.06)' : 'var(--bg3)',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={styles.errorMsg}>PIN incorrecto. Intenta de nuevo.</p>
        )}

        {loading && (
          <p style={{...styles.subtitle, animation: 'pulse 1s ease infinite'}}>
            Verificando...
          </p>
        )}

        {/* Keypad numérico para móvil */}
        <div style={styles.keypad}>
          {[1,2,3,4,5,6,7,8,9,null,0,'⌫'].map((k, i) => (
            <button
              key={i}
              style={{
                ...styles.key,
                opacity: k === null ? 0 : 1,
                pointerEvents: k === null ? 'none' : 'auto',
                background: k === '⌫' ? 'var(--bg3)' : 'var(--bg2)',
              }}
              onClick={() => {
                if (k === null) return
                if (k === '⌫') {
                  const lastFilled = [...digits].map((d,i) => d ? i : -1).filter(i => i >= 0).pop() ?? -1
                  if (lastFilled >= 0) {
                    const next = [...digits]
                    next[lastFilled] = ''
                    setDigits(next)
                    inputsRef.current[lastFilled]?.focus()
                  }
                  return
                }
                const emptyIdx = digits.findIndex(d => d === '')
                if (emptyIdx >= 0) handleDigit(emptyIdx, String(k))
              }}
            >
              <span style={styles.keyText}>{k}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'radial-gradient(ellipse at 50% 0%, #1e1e0a 0%, #0f0f0f 60%)',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    background: 'rgba(232,245,90,0.08)',
    border: '1px solid rgba(232,245,90,0.2)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text)',
    letterSpacing: '-0.02em',
  },
  logoBadge: {
    fontSize: '11px',
    fontWeight: '500',
    background: 'rgba(232,245,90,0.12)',
    color: 'var(--accent)',
    border: '1px solid rgba(232,245,90,0.25)',
    borderRadius: '6px',
    padding: '2px 7px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--text)',
    letterSpacing: '-0.02em',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text2)',
    textAlign: 'center',
  },
  pinRow: {
    display: 'flex',
    gap: '12px',
    margin: '8px 0',
  },
  pinInput: {
    width: '60px',
    height: '64px',
    borderRadius: 'var(--radius)',
    border: '1.5px solid',
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center',
    color: 'var(--text)',
    transition: 'border-color 0.2s, background 0.2s',
    fontFamily: 'var(--mono)',
  },
  errorMsg: {
    fontSize: '13px',
    color: 'var(--danger)',
    textAlign: 'center',
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    width: '100%',
    marginTop: '4px',
  },
  key: {
    height: '54px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, transform 0.1s',
  },
  keyText: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
  },
}
