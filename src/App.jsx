import { useState, useEffect } from 'react'
import { escucharSesion, loginAdmin, logoutAdmin } from './lib/firebase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  // undefined = cargando | null = no autenticado | objeto = autenticado
  const [usuario, setUsuario] = useState(undefined)

  useEffect(() => {
    // Firebase mantiene la sesión activa entre recargas automáticamente
    const unsub = escucharSesion((user) => setUsuario(user))
    return unsub
  }, [])

  // Pantalla de carga inicial
  if (usuario === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f0f0f', gap: '16px',
      }}>
        <div style={{ fontSize: '32px' }}>🔥</div>
        <div style={{ color: '#555', fontSize: '14px', fontFamily: 'var(--font)' }}>
          Verificando sesión...
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Login onLogin={loginAdmin} />
  }

  return <Dashboard onLogout={logoutAdmin} usuario={usuario} />
}
