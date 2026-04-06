import { useState } from 'react'
import PinLogin from './components/PinLogin'
import Dashboard from './components/Dashboard'

export default function App() {
  const [autenticado, setAutenticado] = useState(false)

  if (!autenticado) {
    return <PinLogin onSuccess={() => setAutenticado(true)} />
  }

  return <Dashboard onLogout={() => setAutenticado(false)} />
}
