import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, X, Building2 } from 'lucide-react';
import { useAuthStore } from './store/authStore';

const API = import.meta.env.VITE_API_URL || '';

// ─── Dark theme constants ────────────────────────────────────────────────────
const page: React.CSSProperties  = { padding: 24, maxWidth: 1200, margin: '0 auto' };
const card: React.CSSProperties  = { background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 };
const inp: React.CSSProperties   = { width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#cdd9e5', outline: 'none', boxSizing: 'border-box' as const };
const sel: React.CSSProperties   = { ...inp, cursor: 'pointer' };
const lbl: React.CSSProperties   = { display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 4 };
const ta: React.CSSProperties    = { ...inp, resize: 'vertical' as const, minHeight: 70 };
const btn = (bg = '#1d4ed8', c = '#fff'): React.CSSProperties => ({ background: bg, color: c, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 });
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center' };

const PLANES: Record<string, string> = {
  WEB_BASICA: 'Web Básica', WEB_PRO: 'Web Pro', ECOMMERCE: 'Ecommerce',
  AUTOMATIZACION: 'Automatización', BOT_WA: 'Bot WhatsApp', HOSTING: 'Hosting',
  DOMINIO: 'Dominio', MANTENCION: 'Mantención', PERSONALIZADO: 'Personalizado',
};
const ESTADO_COLOR: Record<string, string> = {
  ACTIVO: '#22c55e', INACTIVO: '#6e7681', PROSPECTO: '#eab308',
};

const emptyForm = { nombre: '', empresa: '', email: '', telefono: '', pais: '', plan: 'WEB_PRO', montoMensual: 0, estado: 'ACTIVO', notas: '' };

export default function CaClientes() {
  const { token } = useAuthStore();
  const [clientes, setClientes] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, prospectos: 0, proyectosActivos: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    setLoading(true);
    try {
      const [cr, sr] = await Promise.all([
        fetch(`${API}/api/v1/ca-clientes`, { headers }),
        fetch(`${API}/api/v1/ca-clientes/stats`, { headers }),
      ]);
      const cd = await cr.json(); const sd = await sr.json();
      setClientes(Array.isArray(cd?.data ?? cd) ? (cd?.data ?? cd) : []);
      setStats(sd?.data ?? sd ?? stats);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm({ ...emptyForm }); setModal(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ nombre: c.nombre, empresa: c.empresa || '', email: c.email || '', telefono: c.telefono || '', pais: c.pais || '', plan: c.plan, montoMensual: Number(c.montoMensual) || 0, estado: c.estado, notas: c.notas || '' });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    const url    = editing ? `${API}/api/v1/ca-clientes/${editing.id}` : `${API}/api/v1/ca-clientes`;
    const method = editing ? 'PUT' : 'POST';
    await fetch(url, { method, headers, body: JSON.stringify({ ...form, montoMensual: Number(form.montoMensual) }) });
    setSaving(false); setModal(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    await fetch(`${API}/api/v1/ca-clientes/${id}`, { method: 'DELETE', headers });
    load();
  };

  const f = (v: any) => setForm(p => ({ ...p, ...v }));

  const filtered = clientes.filter(c =>
    (c.nombre + (c.empresa || '') + (c.email || '') + c.plan).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#cdd9e5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={22} color="#6e7681" /> Clientes ConectaAI
          </h1>
          <p style={{ fontSize: 13, color: '#6e7681', marginTop: 4 }}>Gestión de clientes y proyectos digitales</p>
        </div>
        <button onClick={openNew} style={btn()}>
          <Plus size={15} /> Nuevo Cliente
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', val: stats.total, color: '#cdd9e5' },
          { label: 'Activos', val: stats.activos, color: '#22c55e' },
          { label: 'Prospectos', val: stats.prospectos, color: '#eab308' },
          { label: 'Proyectos activos', val: stats.proyectosActivos, color: '#818cf8' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#6e7681', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre, empresa, plan..."
        style={{ ...inp, width: 320, marginBottom: 16 }}
      />

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6e7681' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6e7681' }}>
            <Users size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} color="#6e7681" />
            <div>No hay clientes aún. ¡Crea el primero!</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Cliente', 'Plan', 'Monto/mes', 'Estado', 'Proyectos', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6e7681', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#cdd9e5' }}>{c.nombre}</div>
                    {c.empresa && <div style={{ fontSize: 12, color: '#6e7681' }}>{c.empresa}</div>}
                    {c.email   && <div style={{ fontSize: 11, color: '#484f58' }}>{c.email}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                      {PLANES[c.plan] || c.plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cdd9e5', fontWeight: 600 }}>
                    {c.montoMensual > 0 ? `$${Number(c.montoMensual).toLocaleString()} USD` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: `${ESTADO_COLOR[c.estado]}22`, color: ESTADO_COLOR[c.estado], borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6e7681', fontSize: 12 }}>
                    {c._count?.proyectos ?? 0} proyecto{c._count?.proyectos !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => openEdit(c)} style={{ ...iconBtn, color: '#6e7681' }} title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(c.id)} style={{ ...iconBtn, color: '#6e7681' }} title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ ...card, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#cdd9e5' }}>{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setModal(false)} style={{ ...iconBtn, color: '#6e7681' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Nombre *</label>
                <input style={inp} value={form.nombre} onChange={e => f({ nombre: e.target.value })} placeholder="Nombre del contacto" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Empresa</label>
                  <input style={inp} value={form.empresa} onChange={e => f({ empresa: e.target.value })} placeholder="Nombre empresa" />
                </div>
                <div>
                  <label style={lbl}>País</label>
                  <input style={inp} value={form.pais} onChange={e => f({ pais: e.target.value })} placeholder="Chile, Ecuador..." />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input style={inp} type="email" value={form.email} onChange={e => f({ email: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Teléfono</label>
                  <input style={inp} value={form.telefono} onChange={e => f({ telefono: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Plan</label>
                  <select style={sel} value={form.plan} onChange={e => f({ plan: e.target.value })}>
                    {Object.entries(PLANES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Monto mensual (USD)</label>
                  <input style={inp} type="number" value={form.montoMensual} onChange={e => f({ montoMensual: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Estado</label>
                  <select style={sel} value={form.estado} onChange={e => f({ estado: e.target.value })}>
                    <option value="PROSPECTO">Prospecto</option>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Notas</label>
                <textarea style={ta} value={form.notas} onChange={e => f({ notas: e.target.value })} placeholder="Observaciones internas..." />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setModal(false)} style={btn('rgba(255,255,255,.06)', '#6e7681')}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.nombre} style={{ ...btn(), opacity: (saving || !form.nombre) ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
