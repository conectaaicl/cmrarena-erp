import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = import.meta.env.VITE_API_URL ?? '';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; probability: number }> = {
  NUEVO:              { label: 'Nuevo',             color: '#6b7280', bg: '#f9fafb',   border: '#e5e7eb', probability: 5   },
  CONTACTADO:         { label: 'Contactado',         color: '#3b82f6', bg: '#eff6ff',   border: '#bfdbfe', probability: 15  },
  COTIZACION_ENVIADA: { label: 'Cotizacion Enviada', color: '#8b5cf6', bg: '#f5f3ff',   border: '#ddd6fe', probability: 30  },
  SEGUIMIENTO:        { label: 'Seguimiento',        color: '#f59e0b', bg: '#fffbeb',   border: '#fde68a', probability: 40  },
  APROBADO:           { label: 'Aprobado',           color: '#10b981', bg: '#ecfdf5',   border: '#a7f3d0', probability: 65  },
  VENTA_CERRADA:      { label: 'Venta Cerrada',      color: '#059669', bg: '#d1fae5',   border: '#6ee7b7', probability: 100 },
  PERDIDO:            { label: 'Perdido',            color: '#ef4444', bg: '#fef2f2',   border: '#fecaca', probability: 0   },
};

const STAGES = Object.keys(STAGE_CONFIG);

function scoreColor(score: number) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function fmtCLP(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function fmtInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ─── RUT Utilities ──────────────────────────────────────────────────────────

function validateRut(rut: string): boolean {
  const clean = rut.replace(/[.\-]/g, '').toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = sum % 11;
  const computed = 11 - remainder;
  let expected: string;
  if (computed === 11) expected = '0';
  else if (computed === 10) expected = 'K';
  else expected = computed.toString();
  return dv === expected;
}

function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '');
  if (clean.length <= 1) return clean.toUpperCase();
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formatted + '-' + dv;
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  score: number;
  pipelineValue: number;
  totalRevenue: number;
  _count: { quotations: number; sales: number };
}

interface PipelineColumn {
  clients: Client[];
  count: number;
  totalValue: number;
  probability: number;
  weightedValue: number;
}

interface NewClientForm {
  name: string;
  rut: string;
  email: string;
  phone: string;
  giro: string;
  address: string;
  city: string;
  commune: string;
  contactName: string;
  notes: string;
}

// ─── Sortable Client Card ───────────────────────────────────────────────────

function ClientCard({ client, onClick, isDragging }: { client: Client; onClick: () => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: client.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      <CardContent client={client} />
    </div>
  );
}

function CardContent({ client }: { client: Client }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
      padding: '12px 14px', marginBottom: 8, cursor: 'grab',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>
          {fmtInitials(client.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {client.name}
          </div>
          {client.email && (
            <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {client.email}
            </div>
          )}
        </div>
        <div style={{
          background: scoreColor(client.score) + '18', color: scoreColor(client.score),
          border: '1px solid ' + scoreColor(client.score) + '40',
          borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {client.score}
        </div>
      </div>
      {client.pipelineValue > 0 && (
        <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{fmtCLP(client.pipelineValue)}</div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{client._count.quotations} cot.</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{client._count.sales} vent.</span>
        {client.phone && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>Tel</span>}
      </div>
    </div>
  );
}

// ─── Pipeline Column ────────────────────────────────────────────────────────

function PipelineColumnView({ stage, column, onCardClick }: {
  stage: string; column: PipelineColumn; onCardClick: (client: Client) => void;
}) {
  const cfg = STAGE_CONFIG[stage];
  const ids = column.clients.map(c => c.id);
  return (
    <div style={{
      width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: cfg.bg, border: '1px solid ' + cfg.border, borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + cfg.border, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
            <span style={{ fontWeight: 700, fontSize: 12, color: '#111' }}>{cfg.label}</span>
          </div>
          <span style={{ background: cfg.color + '18', color: cfg.color, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
            {column.count}
          </span>
        </div>
        {column.totalValue > 0 && (
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            {fmtCLP(column.totalValue)}
            {cfg.probability > 0 && (
              <span style={{ color: cfg.color, marginLeft: 4 }}>
                &rarr; {fmtCLP(column.weightedValue)} ({cfg.probability}%)
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 8px', flex: 1, overflowY: 'auto', minHeight: 80, maxHeight: 'calc(100vh - 300px)' }}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {column.clients.map(client => (
            <ClientCard key={client.id} client={client} onClick={() => onCardClick(client)} />
          ))}
        </SortableContext>
        {column.clients.length === 0 && (
          <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: 12, paddingTop: 20 }}>Arrastra aqui</div>
        )}
      </div>
    </div>
  );
}

// ─── Client Detail Slide-Over ───────────────────────────────────────────────

function ClientSlideOver({ client, onClose, onStatusChange }: {
  client: Client; onClose: () => void; onStatusChange: (clientId: string, status: string) => void;
}) {
  const [aiAction, setAiAction] = useState<any>(null);
  const [creditRisk, setCreditRisk] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setLoadingAi(true);
    Promise.all([
      fetch(API_URL + '/api/v1/ai/next-action/' + client.id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json()),
      fetch(API_URL + '/api/v1/ai/credit-risk/' + client.id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json()),
    ]).then(([action, risk]) => { setAiAction(action); setCreditRisk(risk); })
      .catch(() => {}).finally(() => setLoadingAi(false));
  }, [client.id]);

  const urgencyColor = (u: string) => u === 'high' ? '#ef4444' : u === 'medium' ? '#f59e0b' : '#10b981';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: '#fff', zIndex: 50,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16,
            }}>
              {fmtInitials(client.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{client.name}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: (STAGE_CONFIG[client.status]?.color ?? '#6b7280') + '18',
                color: STAGE_CONFIG[client.status]?.color ?? '#6b7280',
                borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600, marginTop: 2,
              }}>
                {STAGE_CONFIG[client.status]?.label}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&#x2715;</button>
        </div>

        <div style={{ padding: 24, flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Contacto</div>
            {client.email && <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>Email: {client.email}</div>}
            {client.phone && <div style={{ fontSize: 13, color: '#374151' }}>Tel: {client.phone}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Deal Score', value: String(client.score) + '/100', color: scoreColor(client.score) },
              { label: 'Pipeline', value: fmtCLP(client.pipelineValue), color: '#6366f1' },
              { label: 'Revenue', value: fmtCLP(client.totalRevenue), color: '#059669' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mover etapa</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STAGES.map(s => (
                <button key={s} onClick={() => onStatusChange(client.id, s)} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: client.status === s ? STAGE_CONFIG[s].color : 'transparent',
                  color: client.status === s ? '#fff' : STAGE_CONFIG[s].color,
                  border: '1.5px solid ' + STAGE_CONFIG[s].color, transition: 'all 0.15s',
                }}>
                  {STAGE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Siguiente Mejor Accion (IA)
            </div>
            {loadingAi ? (
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, color: '#9ca3af', fontSize: 13 }}>Analizando con IA...</div>
            ) : aiAction ? (
              <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111', flex: 1 }}>{aiAction.action}</div>
                  {aiAction.urgency && (
                    <span style={{
                      background: urgencyColor(aiAction.urgency) + '18', color: urgencyColor(aiAction.urgency),
                      borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                    }}>
                      {aiAction.urgency === 'high' ? 'Alta' : aiAction.urgency === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  )}
                </div>
                {aiAction.reason && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{aiAction.reason}</div>}
                {aiAction.suggestedMessage && (
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#1d4ed8', fontStyle: 'italic' }}>
                    {aiAction.suggestedMessage}
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 6, textAlign: 'right' }}>
                  {aiAction.source === 'ai' ? 'IA Groq' : 'Reglas'}
                </div>
              </div>
            ) : null}
          </div>

          {creditRisk && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Riesgo Crediticio
              </div>
              <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      border: '4px solid ' + scoreColor(100 - creditRisk.score),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: scoreColor(100 - creditRisk.score),
                    }}>
                      {creditRisk.score}
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>score</div>
                  </div>
                  <div>
                    <div style={{
                      fontWeight: 800, fontSize: 16,
                      color: creditRisk.level === 'BAJO' ? '#10b981' : creditRisk.level === 'MEDIO' ? '#f59e0b' : '#ef4444',
                    }}>
                      Riesgo {creditRisk.level}
                    </div>
                  </div>
                </div>
                {creditRisk.factors?.length > 0 && (
                  <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                    {creditRisk.factors.map((f: string, i: number) => (
                      <li key={i} style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          {client.phone && (
            <a href={'https://wa.me/56' + client.phone?.replace(/\D/g, '')} target='_blank' rel='noopener noreferrer'
              style={{ flex: 1, background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', textAlign: 'center', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>
              WhatsApp
            </a>
          )}
          {client.email && (
            <a href={'mailto:' + client.email}
              style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', textAlign: 'center', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>
              Email
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ─── List View ──────────────────────────────────────────────────────────────

function ListView({ clients, onCardClick }: { clients: Client[]; onCardClick: (c: Client) => void }) {
  const [search, setSearch] = useState('');
  const filtered = clients
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    )
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <input
          type='text'
          placeholder='Buscar por nombre, email o telefono...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#111', outline: 'none', boxSizing: 'border-box' as const }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              {['Cliente', 'Etapa', 'Score', 'Pipeline', 'Revenue', 'Cot.', 'Vent.'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const cfg = STAGE_CONFIG[c.status];
              return (
                <tr key={c.id} onClick={() => onCardClick(c)}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                        {fmtInitials(c.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111' }}>{c.name}</div>
                        {c.email && <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: (cfg?.color ?? '#6b7280') + '18', color: cfg?.color ?? '#6b7280', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                      {cfg?.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontWeight: 700, color: scoreColor(c.score), fontSize: 14 }}>{c.score}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>{c.pipelineValue > 0 ? fmtCLP(c.pipelineValue) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 600 }}>{c.totalRevenue > 0 ? fmtCLP(c.totalRevenue) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c._count.quotations}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c._count.sales}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 13 }}>
                  {search ? 'Sin resultados para "' + search + '"' : 'No hay clientes aun'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── New Client Modal ────────────────────────────────────────────────────────

const EMPTY_FORM: NewClientForm = {
  name: '', rut: '', email: '', phone: '',
  giro: '', address: '', city: '', commune: '', contactName: '', notes: '',
};

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<NewClientForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewClientForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof NewClientForm, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleRutChange = (value: string) => {
    set('rut', formatRut(value));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof NewClientForm, string>> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.rut.trim()) {
      e.rut = 'El RUT es requerido';
    } else if (!validateRut(form.rut)) {
      e.rut = 'RUT invalido — verifica el formato (ej: 12.345.678-9)';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Email invalido';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body: Record<string, string> = { name: form.name.trim(), rut: form.rut.trim() };
      if (form.email.trim()) body.email = form.email.trim();
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.giro.trim()) body.giro = form.giro.trim();
      if (form.address.trim()) body.address = form.address.trim();
      if (form.city.trim()) body.city = form.city.trim();
      if (form.commune.trim()) body.commune = form.commune.trim();
      if (form.contactName.trim()) body.contactName = form.contactName.trim();
      if (form.notes.trim()) body.notes = form.notes.trim();

      const res = await fetch(API_URL + '/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as any).message;
        if (Array.isArray(msg)) {
          toast.error(msg[0]);
        } else {
          toast.error(msg || 'Error al crear cliente (' + res.status + ')');
        }
        return;
      }

      toast.success('Cliente creado correctamente');
      onCreated();
      onClose();
    } catch {
      toast.error('Error de conexion — intenta nuevamente');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid ' + (hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'),
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 14,
    color: '#f1f5f9',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  });

  const labelCls: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(10,16,32,0.97)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: 32, width: '100%', maxWidth: 540,
          boxShadow: '0 25px 80px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
          pointerEvents: 'auto' as const, maxHeight: '90vh', overflowY: 'auto' as const,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
                Nuevo Cliente
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Ingresa los datos del cliente para agregarlo al CRM
              </p>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, width: 36, height: 36, cursor: 'pointer',
              fontSize: 18, color: '#94a3b8',
            }}>
              &#x2715;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Required */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Datos requeridos
            </div>
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelCls}>Nombre / Razon Social *</label>
                <input type='text' placeholder='Empresa ABC Ltda.' value={form.name}
                  onChange={e => set('name', e.target.value)} style={inputCls(!!errors.name)} autoFocus />
                {errors.name && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div>
                <label style={labelCls}>RUT *</label>
                <input type='text' placeholder='12.345.678-9' value={form.rut}
                  onChange={e => handleRutChange(e.target.value)} style={inputCls(!!errors.rut)} maxLength={12} />
                {errors.rut && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{errors.rut}</div>}
              </div>
            </div>

            {/* Contacto */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Contacto
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={labelCls}>Email</label>
                <input type='email' placeholder='contacto@empresa.cl' value={form.email}
                  onChange={e => set('email', e.target.value)} style={inputCls(!!errors.email)} />
                {errors.email && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{errors.email}</div>}
              </div>
              <div>
                <label style={labelCls}>Telefono</label>
                <input type='tel' placeholder='+56 9 1234 5678' value={form.phone}
                  onChange={e => set('phone', e.target.value)} style={inputCls(false)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelCls}>Nombre de Contacto</label>
                <input type='text' placeholder='Juan Perez' value={form.contactName}
                  onChange={e => set('contactName', e.target.value)} style={inputCls(false)} />
              </div>
            </div>

            {/* Informacion comercial */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Informacion Comercial
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelCls}>Giro / Actividad Comercial</label>
                <input type='text' placeholder='Instalacion de cortinas y persianas' value={form.giro}
                  onChange={e => set('giro', e.target.value)} style={inputCls(false)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelCls}>Direccion</label>
                <input type='text' placeholder='Av. Providencia 1234' value={form.address}
                  onChange={e => set('address', e.target.value)} style={inputCls(false)} />
              </div>
              <div>
                <label style={labelCls}>Ciudad</label>
                <input type='text' placeholder='Santiago' value={form.city}
                  onChange={e => set('city', e.target.value)} style={inputCls(false)} />
              </div>
              <div>
                <label style={labelCls}>Comuna</label>
                <input type='text' placeholder='Providencia' value={form.commune}
                  onChange={e => set('commune', e.target.value)} style={inputCls(false)} />
              </div>
            </div>

            {/* Notas */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelCls}>Notas / Observaciones</label>
              <textarea placeholder='Informacion adicional...' value={form.notes}
                onChange={e => set('notes', e.target.value)} rows={3}
                style={{ ...inputCls(false), resize: 'vertical' as const, fontFamily: 'inherit', minHeight: 80 }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type='button' onClick={onClose} style={{
                padding: '11px 22px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                Cancelar
              </button>
              <button type='submit' disabled={saving} style={{
                padding: '11px 28px', borderRadius: 10, border: 'none',
                background: saving ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}>
                {saving ? 'Guardando...' : '+ Crear Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Main CRM Page ──────────────────────────────────────────────────────────

export default function CRM() {
  const [pipeline, setPipeline] = useState<Record<string, PipelineColumn>>({});
  const [forecastRevenue, setForecastRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const token = localStorage.getItem('token');
  const headers = { Authorization: 'Bearer ' + token };

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch(API_URL + '/api/v1/crm/pipeline', { headers });
      const data = await res.json();
      setPipeline(data.pipeline ?? {});
      setForecastRevenue(data.forecastRevenue ?? 0);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  const findStage = (clientId: string) => {
    for (const stage of STAGES) {
      if (pipeline[stage]?.clients.find(c => c.id === clientId)) return stage;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const fromStage = findStage(active.id as string);
    const toStage = STAGES.includes(over.id as string)
      ? (over.id as string)
      : findStage(over.id as string);
    if (!fromStage || !toStage || fromStage === toStage) return;
    const client = pipeline[fromStage].clients.find(c => c.id === active.id)!;
    setPipeline(prev => {
      const next = { ...prev };
      next[fromStage] = { ...next[fromStage], clients: next[fromStage].clients.filter(c => c.id !== active.id), count: next[fromStage].count - 1 };
      next[toStage] = { ...next[toStage], clients: [{ ...client, status: toStage }, ...next[toStage].clients], count: next[toStage].count + 1 };
      return next;
    });
    await fetch(API_URL + '/api/v1/crm/clients/' + active.id + '/status', {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: toStage }),
    }).catch(() => fetchPipeline());
  };

  const handleStatusChange = async (clientId: string, status: string) => {
    if (selectedClient) setSelectedClient({ ...selectedClient, status });
    await fetch(API_URL + '/api/v1/crm/clients/' + clientId + '/status', {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchPipeline();
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    await fetch(API_URL + '/api/v1/crm/scores/recalculate', { method: 'POST', headers });
    await fetchPipeline();
    setRecalculating(false);
  };

  const allClients = STAGES.flatMap(s => pipeline[s]?.clients ?? []);
  const activeClient = activeId ? allClients.find(c => c.id === activeId) : null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>&#x1F3AF;</div>
          <div style={{ color: '#9ca3af' }}>Cargando pipeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', minHeight: '100%', background: '#f8f9fb' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>
            Pipeline CRM
          </h1>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            {allClients.length} clientes &middot; Forecast:{' '}
            <span style={{ color: '#059669', fontWeight: 700 }}>{fmtCLP(forecastRevenue)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: 8, padding: 2 }}>
            {(['kanban', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#111' : '#6b7280',
                fontWeight: view === v ? 700 : 400,
                fontSize: 13,
                boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                {v === 'kanban' ? 'Kanban' : 'Lista'}
              </button>
            ))}
          </div>

          <button onClick={handleRecalculate} disabled={recalculating} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 13,
            opacity: recalculating ? 0.7 : 1, transition: 'opacity 0.15s',
          }}>
            {recalculating ? 'Calculando...' : 'Recalcular Scores'}
          </button>

          <button onClick={() => setShowNewClient(true)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontWeight: 700, fontSize: 13,
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}>
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {forecastRevenue > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>FORECAST PONDERADO TOTAL</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>{fmtCLP(forecastRevenue)}</div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {STAGES.filter(s => s !== 'PERDIDO' && (pipeline[s]?.count ?? 0) > 0).map(s => (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{pipeline[s]?.count}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{STAGE_CONFIG[s].label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
            {STAGES.map(stage => (
              <PipelineColumnView
                key={stage}
                stage={stage}
                column={pipeline[stage] ?? { clients: [], count: 0, totalValue: 0, probability: 0, weightedValue: 0 }}
                onCardClick={setSelectedClient}
              />
            ))}
          </div>
          <DragOverlay>
            {activeClient ? (
              <div style={{ opacity: 0.95, transform: 'rotate(2deg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderRadius: 10, width: 220 }}>
                <CardContent client={activeClient} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <ListView clients={allClients} onCardClick={setSelectedClient} />
        </div>
      )}

      {selectedClient && (
        <ClientSlideOver
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onCreated={() => fetchPipeline()}
        />
      )}
    </div>
  );
}
