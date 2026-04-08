import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, doc,
  updateDoc, addDoc, deleteDoc, setDoc, orderBy, query
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const CATEGORIAS = ["Gas", "Agua", "Otro"]
const MARCAS_GAS = ["Llamagas", "Limagas", "Solgas", "Costagas", "Primax", "Otra"]
const KILOS_GAS = [5, 10, 15, 25, 45]
const PRODUCTO_VACIO = { nombre: '', precio: '', descripcion: '', categoria: 'Gas', marca: '', kilos: '', litros: '', activo: true, imagen: '', caracteristicas: [''] }

export default function Dashboard({ onLogout, usuario }) {
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPedidos, setLoadingPedidos] = useState(true)
  const [editando, setEditando] = useState(null)
  const [agregando, setAgregando] = useState(false)
  const [config, setConfig] = useState({ whatsapp: '', telefono: '', pin_admin: '' })
  const [tab, setTab] = useState('productos')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)
  const [nuevoProducto, setNuevoProducto] = useState({ ...PRODUCTO_VACIO })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'productos'), snap => {
      setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.categoria?.localeCompare(b.categoria) || a.nombre?.localeCompare(b.nombre)))
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('creadoEn', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoadingPedidos(false)
    }, () => setLoadingPedidos(false))
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

  const limpiarCaracteristicas = (arr) => (arr || []).filter(c => c.trim() !== '')

  const guardarProducto = async (id, datos) => {
    setGuardando(true)
    try {
      await updateDoc(doc(db, 'productos', id), {
        nombre: datos.nombre, precio: Number(datos.precio),
        descripcion: datos.descripcion, categoria: datos.categoria, marca: datos.marca || '', kilos: datos.kilos || '', litros: datos.litros || '',
        activo: datos.activo, imagen: datos.imagen || '',
        caracteristicas: limpiarCaracteristicas(datos.caracteristicas),
      })
      setEditando(null)
      mostrarToast('Producto actualizado')
    } catch { mostrarToast('Error al guardar', 'error') }
    finally { setGuardando(false) }
  }

  const agregarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio) return
    setGuardando(true)
    try {
      await addDoc(collection(db, 'productos'), {
        ...nuevoProducto, precio: Number(nuevoProducto.precio),
        caracteristicas: limpiarCaracteristicas(nuevoProducto.caracteristicas),
      })
      setNuevoProducto({ ...PRODUCTO_VACIO })
      setAgregando(false)
      mostrarToast('Producto agregado')
    } catch { mostrarToast('Error al agregar', 'error') }
    finally { setGuardando(false) }
  }

  const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try { await deleteDoc(doc(db, 'productos', id)); mostrarToast('Eliminado') }
    catch { mostrarToast('Error', 'error') }
  }

  const toggleActivo = async (id, activo) => {
    await updateDoc(doc(db, 'productos', id), { activo: !activo })
    mostrarToast(!activo ? 'Activado' : 'Ocultado')
  }

  const cambiarEstadoPedido = async (id, estado) => {
    await updateDoc(doc(db, 'pedidos', id), { estado })
    mostrarToast(`Pedido marcado como ${estado}`)
  }

  const guardarConfig = async () => {
    setGuardando(true)
    try { await setDoc(doc(db, 'config', 'negocio'), config); mostrarToast('Configuración guardada') }
    catch { mostrarToast('Error', 'error') }
    finally { setGuardando(false) }
  }

  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length

  const NAV_ITEMS = [
    { id: 'productos', label: 'Productos', icon: '▦' },
    { id: 'pedidos', label: 'Pedidos', icon: '📋', badge: pedidosPendientes },
    { id: 'config', label: 'Configuración', icon: '⚙' },
  ]

  return (
    <div style={s.page}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div style={s.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{ ...s.sidebar, transform: sidebarOpen ? 'translateX(0)' : undefined }} className={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}>
        <div style={s.sideTop}>
          <div style={s.brand}>
            <div style={s.brandIcon}>
              <img
                src={'/favicon.png'}
                style={{ width: 40, height: 40 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.brandName}>Frias Gas</div>
              <div style={s.brandSub}>Panel Admin</div>
            </div>
            {/* Cerrar sidebar en mobile */}
            <button style={s.sideCloseBtn} onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          <nav style={s.nav}>
            {NAV_ITEMS.map(item => (
              <button key={item.id}
                style={{ ...s.navBtn, ...(tab === item.id ? s.navBtnActive : {}) }}
                onClick={() => { setTab(item.id); setSidebarOpen(false) }}>
                <span>{item.icon}</span>
                {item.label}
                {item.badge > 0 && <span style={s.navBadge}>{item.badge}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '0 4px', wordBreak: 'break-all' }}>
            {usuario?.email}
          </div>
          <button style={s.logoutBtn} onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main style={s.main}>
        {/* Topbar mobile */}
        <div
          style={{
            ...s.topbar,
            display: window.innerWidth <= 768 ? 'flex' : 'none'
          }}
        >
          <button style={s.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔥</span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Frias Gas</span>
          </div>
          {pedidosPendientes > 0 && (
            <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '3px 9px', borderRadius: '12px' }}>
              {pedidosPendientes} nuevos
            </span>
          )}
        </div>
        <header style={s.header}>
          <div>
            <h1 style={s.pageTitle}>
              {tab === 'productos' ? 'Productos' : tab === 'pedidos' ? 'Pedidos' : 'Configuración'}
            </h1>
            <p style={s.pageSub}>
              {tab === 'productos' && `${productos.length} productos · ${productos.filter(p => p.activo).length} activos`}
              {tab === 'pedidos' && `${pedidos.length} pedidos · ${pedidosPendientes} pendientes`}
              {tab === 'config' && 'Datos del negocio y acceso'}
            </p>
          </div>
          {tab === 'productos' && (
            <button style={s.btnPrimary} onClick={() => setAgregando(true)}>+ Agregar producto</button>
          )}
        </header>

        {/* ── TAB PRODUCTOS ── */}
        {tab === 'productos' && (
          <div>
            {agregando && (
              <div style={s.formCard}>
                <div style={s.formTitle}>Nuevo producto</div>
                <ProductoForm datos={nuevoProducto} onChange={setNuevoProducto} />
                <div style={s.formActions}>
                  <button style={s.btnSecondary} onClick={() => { setAgregando(false); setNuevoProducto({ ...PRODUCTO_VACIO }) }}>Cancelar</button>
                  <button style={s.btnPrimary} onClick={agregarProducto} disabled={guardando}>{guardando ? 'Guardando...' : 'Agregar'}</button>
                </div>
              </div>
            )}
            {[
              { label: 'Gas', items: productos.filter(p => p.categoria === 'Gas'), color: 'var(--gas)' },
              { label: 'Agua', items: productos.filter(p => p.categoria === 'Agua'), color: 'var(--agua)' },
              { label: 'Otros', items: productos.filter(p => !['Gas', 'Agua'].includes(p.categoria)), color: 'var(--text2)' },
            ].filter(g => g.items.length > 0).map(grupo => (
              <div key={grupo.label} style={s.grupo}>
                <div style={s.grupoHeader}>
                  <span style={{ ...s.grupoDot, background: grupo.color }} />
                  <span style={s.grupoLabel}>{grupo.label}</span>
                  <span style={s.grupoCount}>{grupo.items.length}</span>
                </div>
                <div style={s.productGrid}>
                  {grupo.items.map(p => (
                    <ProductoCard key={p.id} producto={p}
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
                <button style={s.btnPrimary} onClick={() => setAgregando(true)}>Agregar el primero</button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB PEDIDOS ── */}
        {tab === 'pedidos' && (
          <div>
            {loadingPedidos && <p style={{ color: 'var(--text2)' }}>Cargando pedidos...</p>}
            {!loadingPedidos && pedidos.length === 0 && (
              <div style={s.emptyState}>
                <p style={{ color: 'var(--text2)' }}>No hay pedidos aún. Cuando los clientes confirmen por WhatsApp, aparecerán aquí.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pedidos.map(p => <PedidoCard key={p.id} pedido={p} onCambiarEstado={cambiarEstadoPedido} />)}
            </div>
          </div>
        )}

        {/* ── TAB CONFIG ── */}
        {tab === 'config' && (
          <div style={s.configWrap}>
            <div style={s.configCard}>
              <div style={s.configSectionTitle}>Contacto</div>
              <label style={s.label}>
                Número WhatsApp (sin + ni espacios)
                <input style={s.input} value={config.whatsapp || ''} onChange={e => setConfig({ ...config, whatsapp: e.target.value })} placeholder="51987654321" />
                <span style={s.hint}>Ejemplo Perú: 51987654321</span>
              </label>
              <label style={s.label}>
                Teléfono de llamadas
                <input style={s.input} value={config.telefono || ''} onChange={e => setConfig({ ...config, telefono: e.target.value })} placeholder="+51 987 654 321" />
              </label>
              <div style={s.divider} />
              <div style={s.configSectionTitle}>Seguridad</div>
              <label style={s.label}>
                PIN de acceso (6 dígitos)
                <input style={s.input} type="password" inputMode="numeric" maxLength={6}
                  value={config.pin_admin || ''}
                  onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) setConfig({ ...config, pin_admin: e.target.value }) }}
                  placeholder="••••••" />
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
        <div style={{ ...s.toast, background: toast.tipo === 'error' ? 'var(--danger)' : 'var(--accent)', color: toast.tipo === 'error' ? '#fff' : '#0f0f0f' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta de pedido ─────────────────────────────────────────
function PedidoCard({ pedido: p, onCambiarEstado }) {
  const fecha = p.creadoEn?.toDate?.()
  const fechaStr = fecha ? fecha.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recién llegado'

  const estadoColors = {
    pendiente: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pendiente' },
    preparando: { bg: '#dbeafe', color: '#1e40af', label: '👨‍🍳 Preparando' },
    entregado: { bg: '#dcfce7', color: '#166534', label: '✅ Entregado' },
    cancelado: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelado' },
  }
  const est = estadoColors[p.estado] || estadoColors.pendiente

  return (
    <div style={s.pedidoCard}>
      <div style={s.pedidoTop}>
        <div>
          <div style={s.pedidoId}>Pedido #{p.id.slice(-6).toUpperCase()}</div>
          <div style={s.pedidoFecha}>{fechaStr}</div>
          {p.nombre !== 'Sin nombre' && <div style={s.pedidoCliente}>👤 {p.nombre}</div>}
          {p.direccion !== 'Sin dirección' && <div style={s.pedidoDir}>📍 {p.direccion}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={s.pedidoTotal}>S/ {Number(p.total).toFixed(2)}</div>
          <span style={{ ...s.estadoBadge, background: est.bg, color: est.color }}>{est.label}</span>
        </div>
      </div>

      {/* Items */}
      <div style={s.pedidoItems}>
        {(p.items || []).map((item, i) => (
          <div key={i} style={s.pedidoItemRow}>
            <span style={s.pedidoItemNombre}>{item.nombre} ×{item.cantidad}</span>
            <span style={s.pedidoItemSub}>S/ {Number(item.subtotal).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Acciones de estado */}
      <div style={s.pedidoAcciones}>
        {['pendiente', 'preparando', 'entregado', 'cancelado'].map(est => (
          <button key={est}
            style={{
              ...s.estadoBtn,
              background: p.estado === est ? estadoColors[est].bg : 'var(--bg3)',
              color: p.estado === est ? estadoColors[est].color : 'var(--text2)',
              borderColor: p.estado === est ? estadoColors[est].color : 'var(--border)',
            }}
            onClick={() => onCambiarEstado(p.id, est)}>
            {estadoColors[est].label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Formulario de producto ────────────────────────────────────
function ProductoForm({ datos, onChange }) {
  const setCarac = (i, val) => {
    const arr = [...(datos.caracteristicas || [''])]
    arr[i] = val
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
        <label style={s.label}>Nombre *<input style={s.input} value={datos.nombre} onChange={e => onChange({ ...datos, nombre: e.target.value })} placeholder="Ej: Llamagas 10kg" /></label>
        <label style={s.label}>Precio (S/) *<input style={s.input} type="number" value={datos.precio} onChange={e => onChange({ ...datos, precio: e.target.value })} placeholder="0.00" /></label>
        <label style={s.label}>Categoría<select style={s.input} value={datos.categoria} onChange={e => onChange({ ...datos, categoria: e.target.value, marca: '', kilos: '', litros: '' })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label style={s.label}>Descripción<input style={s.input} value={datos.descripcion || ''} onChange={e => onChange({ ...datos, descripcion: e.target.value })} placeholder="Ej: Balón doméstico" /></label>
        {datos.categoria === 'Gas' && (<label style={s.label}>Marca<select style={s.input} value={datos.marca || ''} onChange={e => onChange({ ...datos, marca: e.target.value })}><option value="">-- Selecciona --</option>{MARCAS_GAS.map(m => <option key={m}>{m}</option>)}</select></label>)}
        {datos.categoria === 'Gas' && (<label style={s.label}>Kilos del balón<select style={s.input} value={datos.kilos || ''} onChange={e => onChange({ ...datos, kilos: Number(e.target.value) || '' })}><option value="">-- Tamaño --</option>{KILOS_GAS.map(k => <option key={k} value={k}>{k} kg</option>)}</select><span style={s.hint}>Para el filtro de tamaño en la app</span></label>)}
        {datos.categoria === 'Agua' && (<label style={s.label}>Litros del bidón<input style={s.input} type="number" value={datos.litros || ''} onChange={e => onChange({ ...datos, litros: Number(e.target.value) || '' })} placeholder="Ej: 20" /><span style={s.hint}>Cantidad de litros (ej: 7, 20)</span></label>)}
      </div>
      <label style={s.label}>
        URL de imagen (opcional)
        <input style={s.input} value={datos.imagen || ''} onChange={e => onChange({ ...datos, imagen: e.target.value })} placeholder="https://i.imgur.com/ejemplo.jpg" />
        <span style={s.hint}>Sube la foto a <strong>imgur.com</strong> o <strong>imgbb.com</strong> y pega el link directo.</span>
        {datos.imagen && <img src={datos.imagen} alt="preview" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} onError={e => { e.target.style.display = 'none' }} />}
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Características</span>
        {(datos.caracteristicas || ['']).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px' }}>
            <input style={{ ...s.input, flex: 1 }} value={c} onChange={e => setCarac(i, e.target.value)} placeholder="Ej: Peso: 10 kg" />
            {(datos.caracteristicas || []).length > 1 && (
              <button onClick={() => removeCarac(i)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text2)' }}>✕</button>
            )}
          </div>
        ))}
        <span style={s.hint}>Se agrega una línea nueva automáticamente al escribir.</span>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)' }}>
        <input type="checkbox" checked={datos.activo} onChange={e => onChange({ ...datos, activo: e.target.checked })} style={{ width: '16px', height: '16px' }} />
        Visible para los clientes
      </label>
    </div>
  )
}

// ─── Tarjeta de producto ───────────────────────────────────────
function ProductoCard({ producto: p, editando, onEdit, onCancelEdit, onSave, onToggle, onDelete, onEditChange, guardando }) {
  if (editando) return (
    <div style={{ ...s.card, border: '1.5px solid var(--accent)' }}>
      <div style={{ ...s.formTitle, marginBottom: '12px' }}>Editando: {p.nombre}</div>
      <ProductoForm datos={editando} onChange={onEditChange} />
      <div style={{ ...s.formActions, marginTop: '14px' }}>
        <button style={s.btnSecondary} onClick={onCancelEdit}>Cancelar</button>
        <button style={s.btnPrimary} onClick={() => onSave(editando)} disabled={guardando}>{guardando ? '...' : 'Guardar'}</button>
      </div>
    </div>
  )
  return (
    <div style={{ ...s.card, opacity: p.activo ? 1 : 0.5 }}>
      {p.imagen
        ? <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} onError={e => { e.target.style.display = 'none' }} />
        : <div style={{ width: '100%', height: '80px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>{p.categoria === 'Gas' ? '🔥' : '💧'}</div>
      }
      <div style={s.cardTop}>
        <div style={{ flex: 1 }}>
          <div style={s.cardNombre}>{p.nombre}</div>
          {p.descripcion && <div style={s.cardDesc}>{p.descripcion}</div>}
          {p.caracteristicas?.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              {p.caracteristicas.slice(0, 2).map((c, i) => <div key={i} style={{ fontSize: '11px', color: 'var(--text2)' }}>· {c}</div>)}
              {p.caracteristicas.length > 2 && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>+{p.caracteristicas.length - 2} más</div>}
            </div>
          )}
        </div>
        <div style={s.cardPrecio}>S/ {Number(p.precio).toFixed(2)}</div>
      </div>
      <div style={s.cardActions}>
        <button style={s.iconBtn} onClick={onToggle}>{p.activo ? '👁' : '🙈'}</button>
        <button style={s.iconBtn} onClick={onEdit}>✏️</button>
        <button style={{ ...s.iconBtn, marginLeft: 'auto' }} onClick={onDelete}>🗑️</button>
      </div>
    </div>
  )
}

// ─── Estilos ───────────────────────────────────────────────────
const s = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 },
  sidebar: { width: '220px', minHeight: '100vh', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', flexShrink: 0, transition: 'transform 0.25s ease', zIndex: 100 },
  sideCloseBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: '18px', padding: '4px', display: 'none' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', marginBottom: '20px' },
  menuBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', color: 'var(--text)', padding: '4px 8px' },
  sideTop: { display: 'flex', flexDirection: 'column', gap: '32px' },
  brand: { display: 'flex', gap: '12px', alignItems: 'center' },
  brandIcon: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: '15px', fontWeight: '600', color: 'var(--text)' },
  brandSub: { fontSize: '11px', color: 'var(--text2)', marginTop: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px' },
  navBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--text2)', fontSize: '14px', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', position: 'relative' },
  navBtnActive: { background: 'rgba(232,245,90,0.08)', color: 'var(--accent)' },
  navBadge: { marginLeft: 'auto', background: 'var(--danger)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px' },
  logoutBtn: { background: 'transparent', color: 'var(--text3)', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', cursor: 'pointer' },
  main: { flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' },
  pageTitle: { fontSize: '24px', fontWeight: '600', color: 'var(--text)', letterSpacing: '-0.02em' },
  pageSub: { fontSize: '13px', color: 'var(--text2)', marginTop: '4px' },
  grupo: { marginBottom: '28px' },
  grupoHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  grupoDot: { width: '8px', height: '8px', borderRadius: '50%' },
  grupoLabel: { fontSize: '13px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  grupoCount: { fontSize: '11px', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1px 7px' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  cardNombre: { fontSize: '15px', fontWeight: '500', color: 'var(--text)' },
  cardDesc: { fontSize: '12px', color: 'var(--text2)', marginTop: '3px' },
  cardPrecio: { fontSize: '18px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' },
  cardActions: { display: 'flex', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '10px' },
  iconBtn: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', fontSize: '14px', cursor: 'pointer' },

  pedidoCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  pedidoTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pedidoId: { fontSize: '14px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--mono)' },
  pedidoFecha: { fontSize: '12px', color: 'var(--text2)', marginTop: '2px' },
  pedidoCliente: { fontSize: '13px', color: 'var(--text)', marginTop: '4px' },
  pedidoDir: { fontSize: '12px', color: 'var(--text2)', marginTop: '2px' },
  pedidoTotal: { fontSize: '20px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--mono)', textAlign: 'right' },
  estadoBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px', display: 'inline-block', marginTop: '6px' },
  pedidoItems: { background: 'var(--bg3)', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  pedidoItemRow: { display: 'flex', justifyContent: 'space-between' },
  pedidoItemNombre: { fontSize: '13px', color: 'var(--text)' },
  pedidoItemSub: { fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--mono)' },
  pedidoAcciones: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  estadoBtn: { fontSize: '12px', padding: '5px 10px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontWeight: '500' },

  formCard: { background: 'var(--bg2)', border: '1.5px solid var(--accent)', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  formTitle: { fontSize: '15px', fontWeight: '500', color: 'var(--accent)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  formActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' },
  label: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text)', fontSize: '14px', width: '100%', fontFamily: 'var(--font)' },
  hint: { fontSize: '11px', color: 'var(--text3)', fontWeight: '400', textTransform: 'none', letterSpacing: '0' },
  divider: { height: '1px', background: 'var(--border)', margin: '4px 0' },
  configWrap: { maxWidth: '500px' },
  configCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  configSectionTitle: { fontSize: '13px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  btnPrimary: { background: 'var(--accent)', color: '#0f0f0f', fontWeight: '600', fontSize: '14px', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSecondary: { background: 'var(--bg3)', color: 'var(--text)', fontWeight: '500', fontSize: '14px', padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: '12px' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', zIndex: 999, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' },
}
