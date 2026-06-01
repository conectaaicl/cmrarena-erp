import { useState, useEffect } from 'react';
import { FolderKanban, Plus, Pencil, Trash2, X, ExternalLink, Power, PowerOff } from 'lucide-react';
import { useAuthStore } from './store/authStore';

const API = import.meta.env.VITE_API_URL || '';

// ─── Dark theme constants ────────────────────────────────────────────────────
const page: React.CSSProperties  = { padding: 24, maxWidth: 1200, margin: '0 auto' };
const card: React.CSSProperties  = { background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 };
const inp: React.CSSProperties   = { width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#cdd9e5', outline: 'none', boxSizing: 'border-box' as const };
const sel: React.CSSProperties   = { ...inp, cursor: 'pointer' };
const lbl: React.CSSProperties   = { display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 4 };
const ta: React.CSSProperties    = { ...inp, resize: 'vertical' as const, minHeight: 60 };
const btn = (bg = '#1d4ed8', c = '#fff'): React.CSSProperties => ({ background: bg, color: c, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 });
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center' };

const TIPOS: Record<string, { label: string; color: string; bg: string }> = {
  WEB:           { label: 'Web',           color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  ECOMMERCE:     { label: 'Ecommerce',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  AUTOMATIZACION:{ label: 'Automatización',color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  BOT_WA:        { label: 'Bot WhatsApp',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  HOSTING:       { label: 'Hosting',       color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  DOMINIO:       { label: 'Dominio',       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  SEO:           { label: 'SEO',           color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  PERSONALIZADO: { label: 'Personalizado', color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
};

const ESTADOS: Record<string, { label: string; color: string; bg: string }> = {
  DEV:       { label: 'En Desarrollo', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  ACTIVO:    { label: 'Activo',        color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  SUSPENDIDO:{ label: 'Suspendido',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  CANCELADO: { label: 'Cancelado',     color: '#484f58', bg: 'rgba(72,79,88,0.15)' },
  TERMINADO: { label: 'Terminado',     color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
};

const SISTEMAS = ['ama', 'volta', 'suite', 'omniflow', 'seo', 'social', 'shop', 'working', 'condominios', 'otro'];

const emptyForm = { clienteId: '', nombre: '', tipo: 'WEB', url: '', stack: '', estado: 'DEV', montoMensual: 0, fechaInicio: '', notas: '', sistema: '' };

export default function CaProyectos() {
  const { token } = useAuthStore();
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [clientes, setClientes]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm]           = useState({ ...emptyForm });
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo]     = useState('');
  const [search, setSearch]             = useState('');
  const [saving, setSaving]             = useState(false);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    setLoading(true);
    try {
      const [pr, cr] = await Promise.all([
        fetch(`${API}/api/v1/ca-proyectos`, { headers }),
        fetch(`${API}/api/v1/ca-clientes`, { headers }),
      ]);
      const pd = await pr.json(); const cd = await cr.json();
      setProyectos(Array.isArray(pd?.data ?? pd) ? (pd?.data ?? pd) : []);
      setClientes(Array.isArray(cd?.data ?? cd) ? (cd?.data ?? cd) : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm({ ...emptyForm }); setModal(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ clienteId: p.clienteId, nombre: p.nombre, tipo: p.tipo, url: p.url || '', stack: p.stack || '', estado: p.estado, montoMensual: Number(p.montoMensual) || 0, fechaInicio: p.fechaInicio ? p.fechaInicio.split('T')[0] : '', notas: p.notas || '', sistema: p.sistema || '' });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    const url    = editing ? `${API}/api/v1/ca-proyectos/${editing.id}` : `${API}/api/v1/ca-proyectos`;
    const method = editing ? 'PUT' : 'POST';
    await fetch(url, { method, headers, body: JSON.stringify({ ...form, montoMensual: Number(form.montoMensual), fechaInicio: form.fechaInicio || undefined }) });
    setSaving(false); setModal(false); load();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    await fetch(`${API}/api/v1/ca-proyectos/${id}/estado`, { method: 'PATCH', headers, body: JSON.stringify({ estado }) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    await fetch(`${API}/api/v1/ca-proyectos/${id}`, { method: 'DELETE', headers });
    load();
  };

  const f = (v: any) => setForm(p => ({ ...p, ...v }));

  const filtered = proyectos.filter(p => {
    const ok = (p.nombre + (p.url || '') + (p.cliente?.nombre || '')).toLowerCase().includes(search.toLowerCase());
    return ok && (!filterEstado || p.estado === filterEstado) && (!filterTipo || p.tipo === filterTipo);
  });

  const activos   = proyectos.filter(p => p.estado === 'ACTIVO').length;
  const enDev     = proyectos.filter(p => p.estado === 'DEV').length;
  const mrr       = proyectos.filter(p => p.estado === 'ACTIVO').reduce((s, p) => s + Number(p.montoMensual || 0), 0);

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#cdd9e5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderKanban size={22} color="#6e7681" /> Proyectos ConectaAI
          </h1>
          <p style={{ fontSize: 13, color: '#6e7681', marginTop: 4 }}>Webs, automatizaciones y servicios creados</p>
        </div>
        <button onClick={openNew} style={btn()}>
          <Plus size={15} /> Nuevo Proyecto
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', val: proyectos.length, color: '#cdd9e5' },
          { label: 'Activos', val: activos, color: '#22c55e' },
          { label: 'En Desarrollo', val: enDev, color: '#eab308' },
          { label: 'MRR Activos', val: `$${mrr.toLocaleString()}`, color: '#818cf8' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#6e7681', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto..." style={{ ...inp, width: 220 }} />
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ ...sel, width: 180 }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([v, e]) => <option key={v} value={v}>{e.label}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ ...sel, width: 180 }}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6e7681' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6e7681' }}>
          <FolderKanban size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} color="#6e7681" />
          <div>No hay proyectos. ¡Crea el primero!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map(p => {
            const t = TIPOS[p.tipo]  || TIPOS.PERSONALIZADO;
            const e = ESTADOS[p.estado] || ESTADOS.DEV;
            return (
              <div key={p.id} style={{ ...card, padding: 18 }}>
                {/* Badges + actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    <span style={{ background: t.bg, color: t.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{t.label}</span>
                    <span style={{ background: e.bg, color: e.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{e.label}</span>
                    {p.sistema && <span style={{ background: 'rgba(255,255,255,0.06)', color: '#6e7681', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>{p.sistema}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={() => openEdit(p)} style={{ ...iconBtn, color: '#6e7681' }}><Pencil size={14} /></button>
                    <button onClick={() => remove(p.id)} style={{ ...iconBtn, color: '#6e7681' }}><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Name + client */}
                <div style={{ fontWeight: 700, color: '#cdd9e5', fontSize: 15, marginBottom: 2 }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: '#6e7681', marginBottom: 8 }}>{p.cliente?.empresa || p.cliente?.nombre || ''}</div>

                {/* URL */}
                {p.url && (
                  <a href={p.url.startsWith('http') ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#60a5fa', textDecoration: 'none', marginBottom: 8 }}>
                    <ExternalLink size={11} /> {p.url}
                  </a>
                )}

                {p.stack && <div style={{ fontSize: 12, color: '#484f58', marginBottom: 10 }}>Stack: {p.stack}</div>}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontWeight: 700, color: '#cdd9e5', fontSize: 13 }}>
                    {p.montoMensual > 0 ? `$${Number(p.montoMensual).toLocaleString()}/mes` : 'Sin cobro'}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {p.estado !== 'ACTIVO' && (
                      <button onClick={() => cambiarEstado(p.id, 'ACTIVO')} title="Activar"
                        style={{ ...iconBtn, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '4px 8px', borderRadius: 8 }}>
                        <Power size={13} />
                      </button>
                    )}
                    {p.estado === 'ACTIVO' && (
                      <button onClick={() => cambiarEstado(p.id, 'SUSPENDIDO')} title="Suspender"
                        style={{ ...iconBtn, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 8 }}>
                        <PowerOff size={13} />
                      </button>
                    )}
                    {p.estado !== 'DEV' && p.estado !== 'ACTIVO' && (
                      <button onClick={() => cambiarEstado(p.id, 'DEV')} title="Mover a Dev"
                        style={{ ...iconBtn, color: '#eab308', background: 'rgba(234,179,8,0.1)', padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                        DEV
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ ...card, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#cdd9e5' }}>{editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
              <button onClick={() => setModal(false)} style={{ ...iconBtn, color: '#6e7681' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Cliente *</label>
                <select style={sel} value={form.clienteId} onChange={e => f({ clienteId: e.target.value })}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` — ${c.empresa}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Nombre del proyecto *</label>
                <input style={inp} value={form.nombre} onChange={e => f({ nombre: e.target.value })} placeholder="ej. Tienda AMA Juguetes" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Tipo</label>
                  <select style={sel} value={form.tipo} onChange={e => f({ tipo: e.target.value })}>
                    {Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Estado</label>
                  <select style={sel} value={form.estado} onChange={e => f({ estado: e.target.value })}>
                    {Object.entries(ESTADOS).map(([v, e]) => <option key={v} value={v}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>URL</label>
                  <input style={inp} value={form.url} onChange={e => f({ url: e.target.value })} placeholder="ama.conectaai.cl" />
                </div>
                <div>
                  <label style={lbl}>Stack</label>
                  <input style={inp} value={form.stack} onChange={e => f({ stack: e.target.value })} placeholder="FastAPI + Jinja2" />
                </div>
                <div>
                  <label style={lbl}>Monto mensual (USD)</label>
                  <input style={inp} type="number" value={form.montoMensual} onChange={e => f({ montoMensual: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Sistema</label>
                  <select style={sel} value={form.sistema} onChange={e => f({ sistema: e.target.value })}>
                    <option value="">— Ninguno —</option>
                    {SISTEMAS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Fecha inicio</label>
                  <input style={inp} type="date" value={form.fechaInicio} onChange={e => f({ fechaInicio: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={lbl}>Notas</label>
                <textarea style={ta} value={form.notas} onChange={e => f({ notas: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setModal(false)} style={btn('rgba(255,255,255,.06)', '#6e7681')}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.nombre || !form.clienteId} style={{ ...btn(), opacity: (saving || !form.nombre || !form.clienteId) ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
