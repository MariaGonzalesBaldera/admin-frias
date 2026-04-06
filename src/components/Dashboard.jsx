import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, doc,
  updateDoc, addDoc, deleteDoc, setDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const CATEGORIAS = ['Gas', 'Agua', 'Otro']

const PRODUCTO_VACIO = {
  nombre: '', precio: '', descripcion: '',
  categoria: 'Gas', activo: true,
  imagen: '',
  caracteristicas: [''],
}

export default function Dashboard({ onLogout }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [agregando, setAgregando] = useState(false)
  const [config, setConfig] = useState({ whatsapp: '', telefono: '', pin_admin: '1234' })
  const [tab, setTab] = useState('productos')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)
  const [nuevoProducto, setNuevoProducto] = useState({ ...PRODUCTO_VACIO })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'productos'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.categoria?.localeCompare(b.categoria) || a.nombre?.localeCompare(b.nombre))
      setProductos(data)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'negocio'), snap => {
      if (snap.exists()) setConfig(snap.data())
    })
    return unsub
  }, [])

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 2800)
  }

  // Normaliza las características — filtra vacías al guardar
  const limpiarCaracteristicas = (arr) =>
    (arr || []).filter(c => c.trim() !== '')

  const guardarProducto = async (id, datos) => {
    setGuardando(true)
    try {
      await updateDoc(doc(db, 'productos', id), {
        nombre: datos.nombre,
        precio: Number(datos.precio),
        descripcion: datos.descripcion,
        categoria: datos.categoria,
        activo: datos.activo,
        imagen: datos.imagen || '',
        caracteristicas: limpiarCaracteristicas(datos.caracteristicas),
      })
      setEditando(null)
      mostrarToast('Producto actualizado')
    } catch {
      mostrarToast('Error al guardar', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const agregarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio) return
    setGuardando(true)
    try {
      await addDoc(collection(db, 'productos'), {
        ...nuevoProducto,
        precio: Number(nuevoProducto.precio),
        caracteristicas: limpiarCaracteristicas(nuevoProducto.caracteristicas),
      })
      setNuevoProducto({ ...PRODUCTO_VACIO })
      setAgregando(false)
      mostrarToast('Producto agregado')
    } catch {
      mostrarToast('Error al agregar', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      await deleteDoc(doc(db, 'productos', id))
      mostrarToast('Producto eliminado')
    } catch {
      mostrarToast('Error al eliminar', 'error')
    }
  }

  const toggleActivo = async (id, activo) => {
    await updateDoc(doc(db, 'productos', id), { activo: !activo })
    mostrarToast(!activo ? 'Producto activado' : 'Producto ocultado')
  }

  const guardarConfig = async () => {
    setGuardando(true)
    try {
      await setDoc(doc(db, 'config', 'negocio'), config)
      mostrarToast('Configuración guardada')
    } catch {
      mostrarToast('Error al guardar config', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const productosGas  = productos.filter(p => p.categoria === 'Gas')
  const productosAgua = productos.filter(p => p.categoria === 'Agua')
  const productosOtro = productos.filter(p => p.categoria !== 'Gas' && p.categoria !== 'Agua')

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.brand}>
            <div style={s.brandIcon}>⏱</div>
            <div>
              <div style={s.brandName}>Gas & Agua</div>
              <div style={s.brandSub}>Panel Admin</div>
            </div>
          </div>
          <nav style={s.nav}>
            {[{ id: 'productos', label: 'Productos', icon: '▦' }, { id: 'config', label: 'Configuración', icon: '⚙' }].map(item => (
              <button key={item.id}
                style={{ ...s.navBtn, ...(tab === item.id ? s.navBtnActive : {}) }}
                onClick={() => setTab(item.id)}>
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>Cerrar sesión</button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <h1 style={s.pageTitle}>{tab === 'productos' ? 'Productos' : 'Configuración'}</h1>
            <p style={s.pageSub}>
              {tab === 'productos'
                ? `${productos.length} productos · ${productos.filter(p => p.activo).length} activos`
                : 'Datos del negocio y PIN'}
            </p>
          </div>
          {tab === 'productos' && (
            <button style={s.btnPrimary} onClick={() => setAgregando(true)}>+ Agregar producto</button>
          )}
        </header>

        {tab === 'productos' && (
          <div>
            {loading && <p style={{ color: 'var(--text2)' }}>Cargando...</p>}

            {/* Formulario nuevo producto */}
            {agregando && (
              <div style={s.formCard}>
                <div style={s.formTitle}>Nuevo producto</div>
                <ProductoForm
                  datos={nuevoProducto}
                  onChange={setNuevoProducto}
                />
                <div style={s.formActions}>
                  <button style={s.btnSecondary} onClick={() => { setAgregando(false); setNuevoProducto({ ...PRODUCTO_VACIO }) }}>
                    Cancelar
                  </button>
                  <button style={s.btnPrimary} onClick={agregarProducto} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Agregar'}
                  </button>
                </div>
              </div>
            )}

            {/* Grupos */}
            {[
              { label: 'Gas',   items: productosGas,  color: 'var(--gas)' },
              { label: 'Agua',  items: productosAgua, color: 'var(--agua)' },
              { label: 'Otros', items: productosOtro, color: 'var(--text2)' },
            ].filter(g => g.items.length > 0).map(grupo => (
              <div key={grupo.label} style={s.grupo}>
                <div style={s.grupoHeader}>
                  <span style={{ ...s.grupoDot, background: grupo.color }} />
                  <span style={s.grupoLabel}>{grupo.label}</span>
                  <span style={s.grupoCount}>{grupo.items.length}</span>
                </div>
                <div style={s.productGrid}>
                  {grupo.items.map(p => (
                    <ProductoCard
                      key={p.id}
                      producto={p}
                      editando={editando?.id === p.id ? editando : null}
                      onEdit={() => setEditando({ ...p, caracteristicas: p.caracteristicas?.length ? [...p.caracteristicas, ''] : [''] })}
                      onCancelEdit={() => setEditando(null)}
                      onSave={(datos) => guardarProducto(p.id, datos)}
                      onToggle={() => toggleActivo(p.id, p.activo)}
                      onDelete={() => eliminarProducto(p.id, p.nombre)}
                      onEditChange={setEditando}
                      guardando={guardando}
                    />
                  ))}
                </div>
              </div>
            ))}

            {productos.length === 0 && !agregando && !loading && (
              <div style={s.emptyState}>
                <p style={{ color: 'var(--text2)', marginBottom: '12px' }}>No hay productos aún.</p>
                <button style={s.btnPrimary} onClick={() => setAgregando(true)}>Agregar el primer producto</button>
              </div>
            )}
          </div>
        )}

        {tab === 'config' && (
          <div style={s.configWrap}>
            <div style={s.configCard}>
              <div style={s.configSectionTitle}>Contacto del negocio</div>
              <label style={s.label}>
                Número WhatsApp (con código de país, sin +)
                <input style={s.input} value={config.whatsapp || ''}
                  onChange={e => setConfig({ ...config, whatsapp: e.target.value })}
                  placeholder="51987654321" />
                <span style={s.hint}>Ejemplo Perú: 51987654321</span>
              </label>
              <label style={s.label}>
                Teléfono de llamadas
                <input style={s.input} value={config.telefono || ''}
                  onChange={e => setConfig({ ...config, telefono: e.target.value })}
                  placeholder="+51 987 654 321" />
              </label>
              <div style={s.divider} />
              <div style={s.configSectionTitle}>Seguridad</div>
              <label style={s.label}>
                PIN de acceso (4 dígitos)
                <input style={s.input} type="password" inputMode="numeric" maxLength={4}
                  value={config.pin_admin || ''}
                  onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setConfig({ ...config, pin_admin: e.target.value }) }}
                  placeholder="••••" />
              </label>
              <button style={{ ...s.btnPrimary, width: '100%', marginTop: '8px' }}
                onClick={guardarConfig} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div style={{
          ...s.toast,
          background: toast.tipo === 'error' ? 'var(--danger)' : 'var(--accent)',
          color: toast.tipo === 'error' ? '#fff' : '#0f0f0f',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── Formulario reutilizable ────────────────────────────────────
function ProductoForm({ datos, onChange }) {
  const setCarac = (i, val) => {
    const arr = [...(datos.caracteristicas || [''])]
    arr[i] = val
    // Auto-agregar línea si la última no está vacía
    if (i === arr.length - 1 && val !== '') arr.push('')
    onChange({ ...datos, caracteristicas: arr })
  }

  const removeCarac = (i) => {
    const arr = [...(datos.caracteristicas || [])]
    arr.splice(i, 1)
    if (arr.length === 0) arr.push('')
    onChange({ ...datos, caracteristicas: arr })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={s.formGrid}>
        <label style={s.label}>
          Nombre *
          <input style={s.input} value={datos.nombre}
            onChange={e => onChange({ ...datos, nombre: e.target.value })}
            placeholder="Ej: Gas 10kg" />
        </label>
        <label style={s.label}>
          Precio (S/) *
          <input style={s.input} type="number" value={datos.precio}
            onChange={e => onChange({ ...datos, precio: e.target.value })}
            placeholder="0.00" />
        </label>
        <label style={s.label}>
          Categoría
          <select style={s.input} value={datos.categoria}
            onChange={e => onChange({ ...datos, categoria: e.target.value })}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label style={s.label}>
          Descripción corta
          <input style={s.input} value={datos.descripcion || ''}
            onChange={e => onChange({ ...datos, descripcion: e.target.value })}
            placeholder="Ej: Balón de 10 kilos" />
        </label>
      </div>

      {/* Imagen URL */}
      <label style={s.label}>
        URL de imagen (opcional)
        <input style={s.input} value={datos.imagen || ''}
          onChange={e => onChange({ ...datos, imagen: e.target.value })}
          placeholder="https://i.imgur.com/ejemplo.jpg" />
        <span style={s.hint}>
          Sube la foto a <strong>imgur.com</strong> o <strong>imgbb.com</strong> (gratis) y pega el link aquí.
          También funciona con links directos de Google Fotos.
        </span>
        {datos.imagen ? (
          <img src={datos.imagen} alt="preview"
            style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : null}
      </label>

      {/* Características */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ ...s.label, marginBottom: '4px' }}>Características (una por línea)</span>
        {(datos.caracteristicas || ['']).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              style={{ ...s.input, flex: 1 }}
              value={c}
              onChange={e => setCarac(i, e.target.value)}
              placeholder={`Ej: Peso: 10 kg`}
            />
            {(datos.caracteristicas || []).length > 1 && (
              <button onClick={() => removeCarac(i)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text2)', fontSize: '14px' }}>
                ✕
              </button>
            )}
          </div>
        ))}
        <span style={s.hint}>Escribe en cada campo una característica. Se agrega una nueva línea automáticamente.</span>
      </div>

      {/* Activo toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)' }}>
        <input type="checkbox" checked={datos.activo}
          onChange={e => onChange({ ...datos, activo: e.target.checked })}
          style={{ width: '16px', height: '16px' }} />
        Visible para los clientes
      </label>
    </div>
  )
}

// ─── Tarjeta de producto ────────────────────────────────────────
function ProductoCard({ producto: p, editando, onEdit, onCancelEdit, onSave, onToggle, onDelete, onEditChange, guardando }) {
  if (editando) {
    return (
      <div style={{ ...s.card, border: '1.5px solid var(--accent)' }}>
        <div style={{ ...s.formTitle, marginBottom: '12px' }}>Editando: {p.nombre}</div>
        <ProductoForm datos={editando} onChange={onEditChange} />
        <div style={{ ...s.formActions, marginTop: '14px' }}>
          <button style={s.btnSecondary} onClick={onCancelEdit}>Cancelar</button>
          <button style={s.btnPrimary} onClick={() => onSave(editando)} disabled={guardando}>
            {guardando ? '...' : 'Guardar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...s.card, opacity: p.activo ? 1 : 0.5 }}>
      {/* Preview imagen */}
      {p.imagen && (
        <img src={p.imagen} alt={p.nombre}
          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
      {!p.imagen && (
        <div style={{ width: '100%', height: '80px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
          {p.categoria === 'Gas' ? '🔥' : '💧'}
        </div>
      )}

      <div style={s.cardTop}>
        <div style={{ flex: 1 }}>
          <div style={s.cardNombre}>{p.nombre}</div>
          {p.descripcion && <div style={s.cardDesc}>{p.descripcion}</div>}
          {p.caracteristicas?.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {p.caracteristicas.slice(0, 3).map((c, i) => (
                <span key={i} style={{ fontSize: '11px', color: 'var(--text2)' }}>· {c}</span>
              ))}
              {p.caracteristicas.length > 3 && (
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>+{p.caracteristicas.length - 3} más</span>
              )}
            </div>
          )}
        </div>
        <div style={s.cardPrecio}>S/ {Number(p.precio).toFixed(2)}</div>
      </div>

      <div style={s.cardActions}>
        <button style={s.iconBtn} onClick={onToggle} title={p.activo ? 'Ocultar' : 'Activar'}>
          {p.activo ? '👁' : '🙈'}
        </button>
        <button style={s.iconBtn} onClick={onEdit} title="Editar">✏️</button>
        <button style={{ ...s.iconBtn, marginLeft: 'auto' }} onClick={onDelete} title="Eliminar">🗑️</button>
      </div>
    </div>
  )
}

// ─── Estilos ────────────────────────────────────────────────────
const s = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },
  sidebar: {
    width: '220px', minHeight: '100vh',
    background: 'var(--bg2)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '24px 16px', flexShrink: 0,
  },
  sideTop: { display: 'flex', flexDirection: 'column', gap: '32px' },
  brand: { display: 'flex', gap: '12px', alignItems: 'center' },
  brandIcon: {
    width: '40px', height: '40px',
    background: 'rgba(232,245,90,0.08)', border: '1px solid rgba(232,245,90,0.2)',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
  },
  brandName: { fontSize: '15px', fontWeight: '600', color: 'var(--text)' },
  brandSub: { fontSize: '11px', color: 'var(--text2)', marginTop: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px' },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '8px',
    background: 'transparent', color: 'var(--text2)',
    fontSize: '14px', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer',
  },
  navBtnActive: { background: 'rgba(232,245,90,0.08)', color: 'var(--accent)' },
  logoutBtn: {
    background: 'transparent', color: 'var(--text3)', fontSize: '13px',
    padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', width: '100%', cursor: 'pointer',
  },
  main: { flex: 1, padding: '32px', overflowY: 'auto', maxWidth: '960px' },
  header: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: '28px',
  },
  pageTitle: { fontSize: '24px', fontWeight: '600', color: 'var(--text)', letterSpacing: '-0.02em' },
  pageSub: { fontSize: '13px', color: 'var(--text2)', marginTop: '4px' },
  grupo: { marginBottom: '28px' },
  grupoHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  grupoDot: { width: '8px', height: '8px', borderRadius: '50%' },
  grupoLabel: { fontSize: '13px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  grupoCount: {
    fontSize: '11px', color: 'var(--text3)',
    background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1px 7px',
  },
  productGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px',
  },
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  cardNombre: { fontSize: '15px', fontWeight: '500', color: 'var(--text)' },
  cardDesc: { fontSize: '12px', color: 'var(--text2)', marginTop: '3px' },
  cardPrecio: { fontSize: '18px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' },
  cardActions: { display: 'flex', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '10px' },
  iconBtn: {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '5px 8px', fontSize: '14px', cursor: 'pointer',
  },
  formCard: {
    background: 'var(--bg2)', border: '1.5px solid var(--accent)',
    borderRadius: '12px', padding: '20px', marginBottom: '24px',
  },
  formTitle: { fontSize: '15px', fontWeight: '500', color: 'var(--accent)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  formActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' },
  label: {
    display: 'flex', flexDirection: 'column', gap: '6px',
    fontSize: '12px', fontWeight: '500', color: 'var(--text2)',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  input: {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '9px 12px',
    color: 'var(--text)', fontSize: '14px', width: '100%', fontFamily: 'var(--font)',
  },
  hint: { fontSize: '11px', color: 'var(--text3)', fontWeight: '400', textTransform: 'none', letterSpacing: '0' },
  divider: { height: '1px', background: 'var(--border)', margin: '4px 0' },
  configWrap: { maxWidth: '500px' },
  configCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  configSectionTitle: { fontSize: '13px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  btnPrimary: {
    background: 'var(--accent)', color: '#0f0f0f',
    fontWeight: '600', fontSize: '14px',
    padding: '10px 18px', borderRadius: '8px',
    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnSecondary: {
    background: 'var(--bg3)', color: 'var(--text)',
    fontWeight: '500', fontSize: '14px',
    padding: '10px 18px', borderRadius: '8px',
    border: '1px solid var(--border)', cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center', padding: '60px 20px',
    border: '1px dashed var(--border)', borderRadius: '12px',
  },
  toast: {
    position: 'fixed', bottom: '24px', right: '24px',
    padding: '12px 20px', borderRadius: '8px',
    fontSize: '14px', fontWeight: '500', zIndex: 999,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
}
