import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Plus, Send, Power, PowerOff, Trash2, ChevronDown, ChevronUp,
  Globe, Server, Link, MessageCircle, Zap, Key, X, CheckCircle, AlertCircle, Clock,
  Eye, EyeOff, Pencil,
} from 'lucide-react';
import api from './api/axios';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type ServiceField = { key: string; label: string; value: string; secret?: boolean };
type ServiceBlock = { type: string; label: string; icon?: string; fields: ServiceField[] };
type Delivery = {
  id: string; title: string; status: 'PENDIENTE' | 'ACTIVO' | 'INACTIVO';
  clientId: string; quotationId?: string; services: ServiceBlock[];
  notes?: string; emailSentAt?: string; createdAt: string;
  client: { id: string; name: string; email?: string };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_TEMPLATES: Record<string, { label: string; icon: string; fields: Omit<ServiceField, 'value'>[] }> = {
  website:      { label: 'Sitio Web',       icon: '🌐', fields: [{ key:'url', label:'URL del sitio' }, { key:'admin_url', label:'Panel de administración' }, { key:'username', label:'Usuario admin', secret:false }, { key:'password', label:'Contraseña admin', secret:true }] },
  hosting:      { label: 'Hosting / VPS',   icon: '🖥',  fields: [{ key:'ip', label:'IP del servidor' }, { key:'panel_url', label:'Panel cPanel/Plesk' }, { key:'username', label:'Usuario FTP/SSH', secret:false }, { key:'password', label:'Contraseña', secret:true }] },
  domain:       { label: 'Dominio',         icon: '🔗',  fields: [{ key:'domain', label:'Dominio registrado' }, { key:'registrar', label:'Registrador' }, { key:'expiry', label:'Fecha de vencimiento' }, { key:'nameservers', label:'Nameservers' }] },
  whatsapp_bot: { label: 'WhatsApp Bot',    icon: '💬',  fields: [{ key:'number', label:'Número WhatsApp' }, { key:'webhook_url', label:'Webhook URL', secret:false }, { key:'api_key', label:'API Key', secret:true }, { key:'dashboard_url', label:'Dashboard URL' }] },
  automation:   { label: 'Automatización',  icon: '⚙️',  fields: [{ key:'n8n_url', label:'URL n8n' }, { key:'username', label:'Usuario', secret:false }, { key:'password', label:'Contraseña', secret:true }, { key:'webhook_base', label:'Base Webhook URL' }] },
  credentials:  { label: 'Credenciales',    icon: '🔑',  fields: [{ key:'service', label:'Servicio' }, { key:'username', label:'Usuario / Email', secret:false }, { key:'password', label:'Contraseña / Token', secret:true }] },
  custom:       { label: 'Personalizado',   icon: '📦',  fields: [] },
};

const STATUS_CONFIG = {
  PENDIENTE: { label: 'Pendiente',  bg: 'rgba(234,179,8,.15)',  color: '#eab308', Icon: Clock },
  ACTIVO:    { label: 'Activo',     bg: 'rgba(34,197,94,.15)',  color: '#22c55e', Icon: CheckCircle },
  INACTIVO:  { label: 'Inactivo',   bg: 'rgba(239,68,68,.15)',  color: '#ef4444', Icon: AlertCircle },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = { background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 };
const inp: React.CSSProperties = { width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#cdd9e5', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 4 };
const btn = (bg = '#1d4ed8', c = '#fff'): React.CSSProperties => ({ background: bg, color: c, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 });

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const { label, bg, color, Icon } = STATUS_CONFIG[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
      <Icon size={13} />{label}
    </span>
  );
}

function FieldRow({ field, revealed, onToggleReveal }: { field: ServiceField; revealed: boolean; onToggleReveal: () => void }) {
  const display = field.secret && !revealed ? '••••••••' : field.value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, color: '#6e7681', minWidth: 160 }}>{field.label}</span>
      <span style={{ flex: 1, fontSize: 13, color: field.secret ? '#a3e635' : '#cdd9e5', fontFamily: field.secret ? 'monospace' : 'inherit', letterSpacing: field.secret && !revealed ? 3 : 0 }}>{display}</span>
      {field.secret && (
        <button onClick={onToggleReveal} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', padding: 2 }}>
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}

// ─── Service Block Editor ─────────────────────────────────────────────────────

function ServiceEditor({ block, onChange, onRemove }: { block: ServiceBlock; onChange: (b: ServiceBlock) => void; onRemove: () => void }) {
  return (
    <div style={{ ...card, marginBottom: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{block.icon || SERVICE_TEMPLATES[block.type]?.icon || '📦'}</span>
        <input value={block.label} onChange={e => onChange({ ...block, label: e.target.value })}
          style={{ ...inp, flex: 1, fontWeight: 600 }} placeholder="Nombre del bloque" />
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      {block.fields.map((f, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 36px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input value={f.label} onChange={e => { const fs = [...block.fields]; fs[i] = { ...f, label: e.target.value }; onChange({ ...block, fields: fs }); }}
            style={{ ...inp, fontSize: 12 }} placeholder="Etiqueta" />
          <input value={f.value} onChange={e => { const fs = [...block.fields]; fs[i] = { ...f, value: e.target.value }; onChange({ ...block, fields: fs }); }}
            style={{ ...inp }} placeholder="Valor" type={f.secret ? 'text' : 'text'} />
          <button
            onClick={() => { const fs = [...block.fields]; fs[i] = { ...f, secret: !f.secret }; onChange({ ...block, fields: fs }); }}
            title={f.secret ? 'Campo secreto (oculto en suspensión)' : 'Campo público'}
            style={{ background: f.secret ? 'rgba(163,230,53,.15)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (f.secret ? 'rgba(163,230,53,.3)' : 'rgba(255,255,255,.1)'), borderRadius: 6, color: f.secret ? '#a3e635' : '#484f58', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={13} />
          </button>
          <button onClick={() => { const fs = block.fields.filter((_, j) => j !== i); onChange({ ...block, fields: fs }); }}
            style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange({ ...block, fields: [...block.fields, { key: 'field_' + Date.now(), label: '', value: '', secret: false }] })}
        style={{ ...btn('rgba(255,255,255,.05)', '#6e7681'), fontSize: 12, marginTop: 4 }}>
        <Plus size={13} /> Agregar campo
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Deliveries() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // Form state
  const [fTitle, setFTitle] = useState('');
  const [fClientId, setFClientId] = useState('');
  const [fServices, setFServices] = useState<ServiceBlock[]>([]);
  const [fNotes, setFNotes] = useState('');

  const { data: deliveries = [], isLoading } = useQuery<Delivery[]>({
    queryKey: ['deliveries'],
    queryFn: () => api.get('/deliveries').then(r => r.data.data),
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients-list'],
    queryFn: () => api.get('/clients?limit=200').then(r => r.data.data?.data || r.data.data || []),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post('/deliveries', d).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deliveries'] }); toast.success('Entrega creada'); resetForm(); },
    onError: () => toast.error('Error al crear'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/deliveries/${id}`, d).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deliveries'] }); toast.success('Guardado'); resetForm(); },
    onError: () => toast.error('Error al guardar'),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.patch(`/deliveries/${id}/toggle`).then(r => r.data.data),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ['deliveries'] }); toast.success(`Acceso ${d.status === 'ACTIVO' ? 'activado ✅' : 'suspendido ⚠'}`); },
    onError: () => toast.error('Error'),
  });

  const sendMut = useMutation({
    mutationFn: (id: string) => api.post(`/deliveries/${id}/send`).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deliveries'] }); toast.success('Credenciales enviadas por email ✉'); },
    onError: () => toast.error('Error al enviar. Verifica que el cliente tenga email.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/deliveries/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deliveries'] }); toast.success('Eliminado'); },
  });

  const resetForm = () => { setIsNew(false); setEditing(null); setFTitle(''); setFClientId(''); setFServices([]); setFNotes(''); };

  const openNew = () => { resetForm(); setIsNew(true); };
  const openEdit = (d: Delivery) => {
    setEditing(d); setIsNew(false);
    setFTitle(d.title); setFClientId(d.clientId); setFServices(d.services || []); setFNotes(d.notes || '');
  };

  const addServiceBlock = (type: string) => {
    const tmpl = SERVICE_TEMPLATES[type];
    setFServices(prev => [...prev, {
      type, label: tmpl.label, icon: tmpl.icon,
      fields: tmpl.fields.map(f => ({ ...f, value: '' })),
    }]);
  };

  const handleSave = () => {
    if (!fTitle || !fClientId) { toast.error('Título y cliente son obligatorios'); return; }
    const payload = { title: fTitle, clientId: fClientId, services: fServices, notes: fNotes };
    if (editing) updateMut.mutate({ id: editing.id, ...payload });
    else createMut.mutate(payload);
  };

  const toggleReveal = (deliveryId: string, blockIdx: number, fieldIdx: number) => {
    const key = `${deliveryId}-${blockIdx}-${fieldIdx}`;
    setRevealed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isFormOpen = isNew || !!editing;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={20} color="#22c55e" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#cdd9e5' }}>Entrega de Productos Digitales</h1>
          <p style={{ fontSize: 13, color: '#6e7681' }}>Gestiona accesos, credenciales y activa/desactiva por pago</p>
        </div>
        <button onClick={openNew} style={{ marginLeft: 'auto', ...btn() }}>
          <Plus size={16} /> Nueva entrega
        </button>
      </div>

      {/* Form panel */}
      {isFormOpen && (
        <div style={{ ...card, marginBottom: 24, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#cdd9e5' }}>{editing ? 'Editar entrega' : 'Nueva entrega'}</h2>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={lbl}>Título del proyecto *</label>
              <input style={inp} value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Ej: Sitio Web AMA Juguetes" />
            </div>
            <div>
              <label style={lbl}>Cliente *</label>
              <select style={inp} value={fClientId} onChange={e => setFClientId(e.target.value)}>
                <option value="">Seleccionar cliente...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Service blocks */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Servicios / Bloques de acceso</label>
            {fServices.map((block, i) => (
              <ServiceEditor key={i} block={block}
                onChange={b => setFServices(prev => prev.map((x, j) => j === i ? b : x))}
                onRemove={() => setFServices(prev => prev.filter((_, j) => j !== i))} />
            ))}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {Object.entries(SERVICE_TEMPLATES).map(([type, tmpl]) => (
                <button key={type} onClick={() => addServiceBlock(type)}
                  style={{ ...btn('rgba(255,255,255,.05)', '#8b949e'), fontSize: 12, padding: '6px 12px' }}>
                  {tmpl.icon} {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Notas internas (aparecen en el email)</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Instrucciones adicionales para el cliente..." />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} style={btn()}>
              {(createMut.isPending || updateMut.isPending) ? 'Guardando...' : '💾 Guardar'}
            </button>
            <button onClick={resetForm} style={btn('rgba(255,255,255,.06)', '#8b949e')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Deliveries list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#484f58' }}>Cargando...</div>
      ) : deliveries.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center' }}>
          <Package size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} color="#6e7681" />
          <div style={{ color: '#6e7681', fontSize: 14 }}>No hay entregas aún. Crea la primera.</div>
        </div>
      ) : (
        deliveries.map(d => (
          <div key={d.id} style={{ ...card, marginBottom: 12, overflow: 'hidden' }}>
            {/* Row header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#cdd9e5', fontSize: 15 }}>{d.title}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div style={{ fontSize: 12, color: '#484f58', marginTop: 3 }}>
                  {d.client.name}
                  {d.client.email && <span style={{ marginLeft: 8 }}>· {d.client.email}</span>}
                  {d.emailSentAt && <span style={{ marginLeft: 8, color: '#22c55e' }}>· Email enviado {new Date(d.emailSentAt).toLocaleDateString('es-CL')}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {/* Toggle active/inactive */}
                <button
                  onClick={() => toggleMut.mutate(d.id)}
                  title={d.status === 'ACTIVO' ? 'Suspender acceso' : 'Activar acceso'}
                  style={{
                    ...btn(d.status === 'ACTIVO' ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)',
                           d.status === 'ACTIVO' ? '#ef4444' : '#22c55e'),
                    padding: '7px 12px',
                  }}>
                  {d.status === 'ACTIVO' ? <><PowerOff size={14} /> Suspender</> : <><Power size={14} /> Activar</>}
                </button>

                {/* Send email */}
                <button onClick={() => sendMut.mutate(d.id)} title="Enviar credenciales por email"
                  style={{ ...btn('rgba(29,78,216,.15)', '#60a5fa'), padding: '7px 12px' }}>
                  <Send size={14} /> Enviar
                </button>

                {/* Edit */}
                <button onClick={() => openEdit(d)} style={{ ...btn('rgba(255,255,255,.05)', '#8b949e'), padding: '7px 10px' }}>
                  <Pencil size={14} />
                </button>

                {/* Expand */}
                <button onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                  style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', padding: 4 }}>
                  {expanded === d.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* Delete */}
                <button onClick={() => { if (confirm('¿Eliminar esta entrega?')) deleteMut.mutate(d.id); }}
                  style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', padding: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#484f58'}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Expanded credentials view */}
            {expanded === d.id && (
              <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {d.status === 'INACTIVO' && (
                  <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', margin: '14px 0', fontSize: 13, color: '#f87171' }}>
                    ⚠ Acceso suspendido — las credenciales secretas están ocultas en el email del cliente
                  </div>
                )}
                {(d.services || []).length === 0 && (
                  <p style={{ color: '#484f58', fontSize: 13, padding: '14px 0' }}>Sin servicios configurados. Edita para agregar.</p>
                )}
                {(d.services || []).map((svc, bi) => (
                  <div key={bi} style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#8b949e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{svc.icon || SERVICE_TEMPLATES[svc.type]?.icon || '📦'}</span> {svc.label}
                    </div>
                    {svc.fields.map((f, fi) => (
                      <FieldRow key={fi} field={f}
                        revealed={!!revealed[`${d.id}-${bi}-${fi}`]}
                        onToggleReveal={() => toggleReveal(d.id, bi, fi)} />
                    ))}
                  </div>
                ))}
                {d.notes && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 8, fontSize: 13, color: '#8b949e' }}>
                    📝 {d.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
