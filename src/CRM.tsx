import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Mail, Phone, MapPin, FileText, Loader2,
  Building2, User2, ChevronDown, Globe, CheckCircle, XCircle,
  RefreshCw, LayoutGrid, List, X, ShoppingCart, Download, Trash2,
} from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';

// ── Status mapping ────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Nuevo',              value: 'NUEVO' },
  { label: 'Contactado',         value: 'CONTACTADO' },
  { label: 'Cotización enviada', value: 'COTIZACION_ENVIADA' },
  { label: 'Seguimiento',        value: 'SEGUIMIENTO' },
  { label: 'Aprobado',           value: 'APROBADO' },
  { label: 'Venta cerrada',      value: 'VENTA_CERRADA' },
  { label: 'Perdido',            value: 'PERDIDO' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  NUEVO:              { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  CONTACTADO:         { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8' },
  COTIZACION_ENVIADA: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  SEGUIMIENTO:        { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa' },
  APROBADO:           { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  VENTA_CERRADA:      { bg: 'rgba(20,184,166,0.15)',  color: '#2dd4bf' },
  PERDIDO:            { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
};

const statusLabel = (value: string) => STATUS_OPTIONS.find(o => o.value === value)?.label ?? value;
const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

const emptyForm = {
  name: '', rut: '', email: '', phone: '', address: '',
  city: '', giro: '', website: '', contactName: '', status: 'NUEVO', notes: '',
};

const cardStyle: React.CSSProperties = {
  background: '#161b22',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0d1117',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#cdd9e5',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: '#6e7681', marginBottom: 4,
};

// ── SEO Check Modal ───────────────────────────────────────────────────────────
function SeoModal({ clientId, clientName, onClose }: { clientId: string; clientName: string; onClose: () => void }) {
  const { data: seo, isLoading, refetch } = useQuery({
    queryKey: ['seo', clientId],
    queryFn: () => api.get(`/clients/${clientId}/seo`).then(r => r.data.data ?? r.data),
    staleTime: 0,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f6fc', margin: 0 }}>Verificación SEO</h2>
            <p style={{ fontSize: 12, color: '#6e7681', marginTop: 4 }}>{clientName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
            <Loader2 size={32} color="#3b82f6" className="animate-spin" />
          </div>
        ) : !seo?.hasWebsite ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Globe size={36} style={{ color: '#484f58', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#8b949e' }}>Este cliente no tiene sitio web registrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 10, background: seo.indexable ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${seo.indexable ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {seo.indexable ? <CheckCircle size={18} color="#4ade80" /> : <XCircle size={18} color="#f87171" />}
                <span style={{ fontSize: 14, fontWeight: 700, color: seo.indexable ? '#4ade80' : '#f87171' }}>
                  {seo.indexable ? 'Indexable por Google' : 'NO indexable por Google'}
                </span>
              </div>
              <a href={seo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#60a5fa', wordBreak: 'break-all' }}>{seo.url}</a>
            </div>
            <button onClick={() => refetch()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#21262d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#cdd9e5', cursor: 'pointer' }}>
              <RefreshCw size={13} /> Volver a verificar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Client Detail Slide-over ──────────────────────────────────────────────────
function ClientDetail({ client, onClose, onStatusChange }: { client: any; onClose: () => void; onStatusChange: (id: string, status: string) => void }) {
  const st = STATUS_COLORS[client.status] || { bg: 'rgba(255,255,255,0.06)', color: '#8b949e' };

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations-client', client.id],
    queryFn: () => api.get('/quotations').then(r => (r.data.data ?? r.data).filter((q: any) => q.clientId === client.id || q.client?.id === client.id)),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-client', client.id],
    queryFn: () => api.get('/sales').then(r => (r.data.data ?? r.data).filter((s: any) => s.clientId === client.id || s.client?.id === client.id)),
  });

  const totalRevenue = (sales as any[]).reduce((acc, s) => acc + (Number(s.total) || 0), 0);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 420,
        background: '#161b22', borderLeft: '1px solid rgba(255,255,255,0.1)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#f0f6fc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</p>
            <p style={{ fontSize: 12, color: '#484f58', fontFamily: 'monospace', margin: '4px 0 8px' }}>{client.rut}</p>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
              {statusLabel(client.status)}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Ventas', value: (sales as any[]).length, color: '#4ade80' },
            { label: 'Cotizaciones', value: (quotations as any[]).length, color: '#a78bfa' },
            { label: 'Revenue', value: formatCLP(totalRevenue), color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#0d1117', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 11, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Contacto</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {client.email && <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#8b949e' }}><Mail size={13} color="#484f58" />{client.email}</div>}
            {client.phone && <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#8b949e' }}><Phone size={13} color="#484f58" />{client.phone}</div>}
            {(client.address || client.city) && <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#8b949e' }}><MapPin size={13} color="#484f58" />{[client.address, client.city].filter(Boolean).join(', ')}</div>}
            {client.giro && <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#8b949e' }}><Building2 size={13} color="#484f58" />{client.giro}</div>}
            {client.contactName && <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#8b949e' }}><User2 size={13} color="#484f58" />{client.contactName}</div>}
            {client.website && <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#8b949e' }}><Globe size={13} color="#484f58" /><a href={client.website} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>{client.website}</a></div>}
          </div>
        </div>

        {/* Change status */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 11, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Estado del pipeline</p>
          <div style={{ position: 'relative' }}>
            <select value={client.status} onChange={e => onStatusChange(client.id, e.target.value)}
              style={{ ...inputStyle, paddingRight: 32, cursor: 'pointer', appearance: 'none' }}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown size={12} color="#484f58" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Quotations */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 11, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Cotizaciones</p>
          {(quotations as any[]).length === 0 ? (
            <p style={{ fontSize: 12, color: '#484f58', fontStyle: 'italic' }}>Sin cotizaciones</p>
          ) : (quotations as any[]).slice(0, 5).map((q: any) => (
            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Cot. #{String(q.number).padStart(4, '0')}</p>
                <p style={{ fontSize: 11, color: '#484f58', margin: '2px 0 0' }}>{q.date ? new Date(q.date).toLocaleDateString('es-CL') : '—'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc', margin: 0 }}>{formatCLP(Number(q.total))}</p>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#8b949e' }}>{q.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sales */}
        <div style={{ padding: '16px 24px' }}>
          <p style={{ fontSize: 11, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Ventas</p>
          {(sales as any[]).length === 0 ? (
            <p style={{ fontSize: 12, color: '#484f58', fontStyle: 'italic' }}>Sin ventas</p>
          ) : (sales as any[]).slice(0, 5).map((s: any) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <ShoppingCart size={13} color="#4ade80" />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Venta #{String(s.number || s.id).padStart(4, '0')}</p>
                  <p style={{ fontSize: 11, color: '#484f58', margin: '2px 0 0' }}>{s.date ? new Date(s.date).toLocaleDateString('es-CL') : '—'}</p>
                </div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc', margin: 0 }}>{formatCLP(Number(s.total))}</p>
            </div>
          ))}
        </div>

        {/* Activity Notes */}
        <ActivityNotes clientId={client.id} />
      </div>
    </>
  );
}

function ActivityNotes({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: () => api.get(`/clients/${clientId}/notes`).then(r => r.data.data ?? r.data),
  });

  const addNote = useMutation({
    mutationFn: (content: string) => api.post(`/clients/${clientId}/notes`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-notes', clientId] }); setText(''); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => api.delete(`/clients/${clientId}/notes/${noteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-notes', clientId] }),
  });

  return (
    <div style={{ padding: '16px 24px 32px' }}>
      <p style={{ fontSize: 11, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Actividad / Notas</p>

      {/* Add note */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) addNote.mutate(text.trim()); }}
          placeholder="Agregar nota (Enter para guardar)..."
          style={{ flex: 1, background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#cdd9e5', outline: 'none' }} />
        <button onClick={() => { if (text.trim()) addNote.mutate(text.trim()); }}
          disabled={!text.trim() || addNote.isPending}
          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Agregar
        </button>
      </div>

      {/* Notes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(notes as any[]).length === 0 && (
          <p style={{ fontSize: 12, color: '#484f58', fontStyle: 'italic' }}>Sin actividad registrada</p>
        )}
        {(notes as any[]).map((n: any) => (
          <div key={n.id} style={{ background: '#0d1117', borderRadius: 8, padding: '10px 12px', position: 'relative', group: true } as any}
            onMouseEnter={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '1'; }}
            onMouseLeave={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '0'; }}>
            <p style={{ fontSize: 13, color: '#cdd9e5', margin: '0 0 6px', lineHeight: 1.5 }}>{n.content}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#484f58' }}>
                {n.user?.firstName} {n.user?.lastName} · {new Date(n.createdAt).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              <button className="del-btn" onClick={() => deleteNote.mutate(n.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '2px 4px', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main CRM ──────────────────────────────────────────────────────────────────
export default function CRM() {
  const { user } = useAuthStore();
  const accentColor = user?.tenant?.primaryColor || '#3b82f6';
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailClient, setDetailClient] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [seoClientId, setSeoClientId] = useState<string | null>(null);
  const [seoClientName, setSeoClientName] = useState('');
  const [dragClientId, setDragClientId] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: () => api.get(`/clients${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`).then(r => r.data.data ?? r.data),
  });

  const invalidateClients = () => {
    qc.invalidateQueries({ queryKey: ['clients'] });
    qc.invalidateQueries({ queryKey: ['clients-all'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => api.post('/clients', data),
    onSuccess: () => { invalidateClients(); toast.success('Cliente creado'); setIsAdding(false); setForm({ ...emptyForm }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear cliente'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof emptyForm> }) => api.patch(`/clients/${id}`, data),
    onSuccess: () => { invalidateClients(); toast.success('Cliente actualizado'); setEditingId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const handleStatusChange = (id: string, status: string) => {
    setEditingId(id);
    updateMutation.mutate({ id, data: { status } });
    // Update detailClient if open
    if (detailClient?.id === id) setDetailClient((c: any) => c ? { ...c, status } : c);
  };

  const handleDrop = (status: string) => {
    if (!dragClientId) return;
    handleStatusChange(dragClientId, status);
    setDragClientId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.rut) return toast.error('Nombre y RUT son obligatorios');
    createMutation.mutate(form);
  };

  const f = (label: string, key: keyof typeof emptyForm, opts?: { type?: string; required?: boolean; placeholder?: string }) => (
    <div>
      <label style={labelStyle}>{label}{opts?.required && <span style={{ color: '#f85149' }}> *</span>}</label>
      <input type={opts?.type || 'text'} required={opts?.required} value={form[key] as string}
        onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={opts?.placeholder} style={inputStyle} />
    </div>
  );

  const filteredClients: any[] = (clients as any[]).filter((c: any) =>
    !searchTerm ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut?.includes(searchTerm)
  );

  // ── Client card (shared between list and kanban) ──
  const ClientCard = ({ client, compact = false }: { client: any; compact?: boolean }) => {
    const st = STATUS_COLORS[client.status] || { bg: 'rgba(255,255,255,0.06)', color: '#8b949e' };
    return (
      <div
        draggable
        onDragStart={() => setDragClientId(client.id)}
        onDragEnd={() => setDragClientId(null)}
        onClick={() => setDetailClient(client)}
        style={{
          background: compact ? '#161b22' : '#0d1117',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: compact ? 12 : 16,
          cursor: 'pointer', transition: 'border-color 0.2s, transform 0.1s',
          marginBottom: compact ? 8 : 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: compact ? 6 : 10 }}>
          <p style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#f0f6fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{client.name}</p>
          {!compact && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{statusLabel(client.status)}</span>}
        </div>
        <p style={{ fontSize: 10, color: '#484f58', fontFamily: 'monospace', margin: '0 0 6px' }}>{client.rut}</p>
        {client.email && <p style={{ fontSize: 11, color: '#6e7681', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</p>}
        {!compact && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative', flex: 1 }}>
              <select value={client.status} onChange={e => handleStatusChange(client.id, e.target.value)}
                disabled={updateMutation.isPending && editingId === client.id}
                style={{ ...inputStyle, paddingRight: 28, cursor: 'pointer', appearance: 'none', fontSize: 11 }}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown size={11} color="#484f58" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            <button onClick={() => { setSeoClientId(client.id); setSeoClientName(client.name); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 8px', fontSize: 11, cursor: 'pointer', color: client.website ? '#60a5fa' : '#484f58', flexShrink: 0 }}>
              <Globe size={11} /> SEO
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {seoClientId && <SeoModal clientId={seoClientId} clientName={seoClientName} onClose={() => setSeoClientId(null)} />}
      {detailClient && <ClientDetail client={detailClient} onClose={() => setDetailClient(null)} onStatusChange={handleStatusChange} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>CRM / Clientes</h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>
            {isLoading ? '…' : `${filteredClients.length} cliente${filteredClients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
            {[['list', List], ['kanban', LayoutGrid]].map(([mode, Icon]: any) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', border: 'none', cursor: 'pointer', background: viewMode === mode ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === mode ? '#f0f6fc' : '#484f58', transition: 'all 0.15s' }}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={async () => {
              try {
                const res = await api.get('/exports/clients/excel', { responseType: 'blob' });
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a'); a.href = url;
                a.download = 'clientes.xlsx'; a.click(); URL.revokeObjectURL(url);
              } catch { toast.error('Error exportando'); }
            }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', color: '#8b949e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <Download size={14} />Excel
            </button>
            <button onClick={() => { setIsAdding(!isAdding); setForm({ ...emptyForm }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} /> Nuevo Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f6fc', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Agregar Cliente</p>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {f('Nombre o Razón Social', 'name', { required: true, placeholder: 'Constructora Alfa SpA' })}
            {f('RUT', 'rut', { required: true, placeholder: '76.123.456-7' })}
            {f('Email', 'email', { type: 'email', placeholder: 'contacto@empresa.cl' })}
            {f('Teléfono', 'phone', { placeholder: '+56 9 1234 5678' })}
            {f('Dirección', 'address', { placeholder: 'Av. Providencia 1234' })}
            {f('Ciudad', 'city', { placeholder: 'Santiago' })}
            {f('Giro / Actividad', 'giro', { placeholder: 'Construcción y Obras Civiles' })}
            {f('Sitio Web', 'website', { placeholder: 'https://empresa.cl' })}
            {f('Nombre de Contacto', 'contactName', { placeholder: 'Juan Pérez' })}
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notas</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Requisitos especiales, observaciones..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#8b949e', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={createMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: createMutation.isPending ? 0.6 : 1 }}>
                {createMutation.isPending && <Loader2 size={14} />} Guardar Cliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ ...cardStyle, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Search size={15} color="#484f58" />
        <input type="text" placeholder="Buscar por nombre o RUT..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '4px 0', flex: 1 }} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Loader2 size={28} color="#3b82f6" className="animate-spin" /></div>
      ) : viewMode === 'list' ? (
        /* ── LIST VIEW ── */
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filteredClients.map((client: any) => <ClientCard key={client.id} client={client} />)}
            {filteredClients.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: '#484f58' }}>
                <User2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>{searchTerm ? 'No se encontraron clientes.' : 'Aún no hay clientes registrados.'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── KANBAN VIEW ── */
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {STATUS_OPTIONS.map(({ label, value }) => {
            const colClients = filteredClients.filter((c: any) => c.status === value);
            const colColor = STATUS_COLORS[value]?.color || '#8b949e';
            return (
              <div
                key={value}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(value)}
                style={{
                  minWidth: 220, maxWidth: 220,
                  background: '#161b22',
                  border: `1px solid rgba(255,255,255,0.07)`,
                  borderRadius: 12, padding: 12,
                  flexShrink: 0,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: colColor, margin: 0 }}>{label}</p>
                  <span style={{ fontSize: 11, background: `${colColor}22`, color: colColor, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{colClients.length}</span>
                </div>
                {colClients.map((client: any) => <ClientCard key={client.id} client={client} compact />)}
                {colClients.length === 0 && (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, padding: '20px 0', textAlign: 'center', fontSize: 11, color: '#484f58' }}>
                    Sin clientes
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
