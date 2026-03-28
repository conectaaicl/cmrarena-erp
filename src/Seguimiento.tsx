import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Loader2, Trash2, Pencil, X, CalendarDays } from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'] as const;
const PRIORITY_OPTIONS = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', EN_PROGRESO: 'En progreso', COMPLETADA: 'Completada', CANCELADA: 'Cancelada',
};
const PRIORITY_LABEL: Record<string, string> = {
  BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', URGENTE: 'Urgente',
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDIENTE:   { background: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  EN_PROGRESO: { background: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  COMPLETADA:  { background: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  CANCELADA:   { background: 'rgba(239,68,68,0.15)',   color: '#f87171' },
};
const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  BAJA:    { background: 'rgba(107,114,128,0.1)', color: '#6e7681' },
  MEDIA:   { background: 'rgba(59,130,246,0.1)',  color: '#60a5fa' },
  ALTA:    { background: 'rgba(249,115,22,0.15)', color: '#fb923c' },
  URGENTE: { background: 'rgba(239,68,68,0.15)',  color: '#f87171' },
};

const PRIORITY_ICON: Record<string, React.ElementType> = {
  BAJA: Circle, MEDIA: Circle, ALTA: AlertCircle, URGENTE: AlertCircle,
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#cdd9e5',
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 4,
};
const cardStyle: React.CSSProperties = {
  background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
};

type TaskForm = {
  title: string; description: string; clientId: string;
  dueDate: string; status: string; priority: string;
};
const emptyForm: TaskForm = {
  title: '', description: '', clientId: '', dueDate: '', status: 'PENDIENTE', priority: 'MEDIA',
};

export default function Seguimiento() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const accentColor = user?.tenant?.primaryColor || '#1d4ed8';

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: () => api.get(`/tasks${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data.data ?? r.data),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => api.get('/clients').then(r => r.data.data ?? r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Tarea creada'); resetForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Tarea actualizada'); resetForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Tarea eliminada'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const resetForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || '',
      clientId: task.clientId || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      status: task.status,
      priority: task.priority,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error('El título es requerido');
    const payload = {
      title: form.title,
      description: form.description || undefined,
      clientId: form.clientId || undefined,
      dueDate: form.dueDate || undefined,
      status: form.status,
      priority: form.priority,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const isOverdue = (task: any) =>
    task.dueDate && task.status !== 'COMPLETADA' && task.status !== 'CANCELADA' &&
    new Date(task.dueDate) < new Date();

  const pending = tasks.filter((t: any) => t.status === 'PENDIENTE').length;
  const inProgress = tasks.filter((t: any) => t.status === 'EN_PROGRESO').length;
  const overdue = tasks.filter((t: any) => isOverdue(t)).length;

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
      <Loader2 size={28} color="#3b82f6" className="animate-spin" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>Seguimiento</h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>
            {pending} pendientes · {inProgress} en progreso{overdue > 0 ? ` · ${overdue} vencidas` : ''}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} />Nueva Tarea
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total', count: tasks.length, color: '#6e7681', filter: '' },
          { label: 'Pendientes', count: pending, color: '#9ca3af', filter: 'PENDIENTE' },
          { label: 'En progreso', count: inProgress, color: '#60a5fa', filter: 'EN_PROGRESO' },
          { label: 'Completadas', count: tasks.filter((t: any) => t.status === 'COMPLETADA').length, color: '#4ade80', filter: 'COMPLETADA' },
        ].map(({ label, count, color, filter }) => (
          <button key={label} onClick={() => setStatusFilter(filter === statusFilter ? '' : filter)}
            style={{
              ...cardStyle,
              padding: '14px 18px', cursor: 'pointer', textAlign: 'left',
              borderColor: statusFilter === filter && filter !== '' ? color : 'rgba(255,255,255,0.07)',
              background: statusFilter === filter && filter !== '' ? `${color}10` : '#161b22',
            }}>
            <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{count}</p>
            <p style={{ fontSize: 11, color: '#6e7681', marginTop: 4 }}>{label}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f6fc', margin: 0 }}>
              {editingId ? 'Editar Tarea' : 'Nueva Tarea'}
            </p>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e7681' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título <span style={{ color: '#f85149' }}>*</span></label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Descripción breve de la tarea..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cliente (opcional)</label>
              <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Sin cliente asociado</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha límite</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notas</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Detalles adicionales..." rows={2}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={resetForm}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#8b949e', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: (createMutation.isPending || updateMutation.isPending) ? 0.6 : 1 }}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
              {editingId ? 'Actualizar' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      )}

      {/* Tasks list */}
      <div style={cardStyle}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: '#484f58' }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <p style={{ fontSize: 13 }}>No hay tareas {statusFilter ? `con estado "${STATUS_LABEL[statusFilter]}"` : 'registradas'}</p>
          </div>
        ) : (
          <div>
            {tasks.map((task: any, idx: number) => {
              const overdue = isOverdue(task);
              const PriorityIcon = PRIORITY_ICON[task.priority] || Circle;
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
                  borderBottom: idx < tasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: task.status === 'COMPLETADA' ? 'transparent' : overdue ? 'rgba(239,68,68,0.03)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (task.status !== 'COMPLETADA') e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = task.status === 'COMPLETADA' ? 'transparent' : overdue ? 'rgba(239,68,68,0.03)' : 'transparent'; }}>

                  {/* Quick complete toggle */}
                  <button
                    onClick={() => quickStatusMutation.mutate({ id: task.id, status: task.status === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA' })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'COMPLETADA' ? '#4ade80' : '#484f58', padding: '2px 0', flexShrink: 0, marginTop: 1 }}
                    title={task.status === 'COMPLETADA' ? 'Marcar pendiente' : 'Marcar completada'}
                  >
                    {task.status === 'COMPLETADA' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: task.status === 'COMPLETADA' ? '#484f58' : '#cdd9e5', textDecoration: task.status === 'COMPLETADA' ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                      <span style={{ ...PRIORITY_STYLE[task.priority], borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                      <span style={{ ...STATUS_STYLE[task.status], borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
                        {STATUS_LABEL[task.status]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                      {task.client && (
                        <span style={{ fontSize: 11, color: '#6e7681' }}>
                          Cliente: <span style={{ color: '#8b949e' }}>{task.client.name}</span>
                        </span>
                      )}
                      {task.dueDate && (
                        <span style={{ fontSize: 11, color: overdue ? '#f87171' : '#6e7681', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CalendarDays size={11} />
                          {new Date(task.dueDate).toLocaleDateString('es-CL')}
                          {overdue && ' · Vencida'}
                        </span>
                      )}
                      {task.description && (
                        <span style={{ fontSize: 11, color: '#484f58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                          {task.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {/* Quick status dropdown */}
                    <select
                      value={task.status}
                      onChange={e => quickStatusMutation.mutate({ id: task.id, status: e.target.value })}
                      style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 6px', fontSize: 11, color: '#8b949e', cursor: 'pointer' }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                    <button onClick={() => handleEdit(task)}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#6e7681', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#6e7681'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => { if (confirm('¿Eliminar esta tarea?')) deleteMutation.mutate(task.id); }}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#6e7681', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#6e7681'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
