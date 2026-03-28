import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Plus, Search, Loader2, CheckCircle, Clock,
  AlertCircle, ChevronDown, ChevronRight, Trash2, RefreshCw,
} from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['Transferencia', 'Efectivo', 'Débito', 'Crédito', 'Cheque'];
const PAYMENT_STATUSES = ['Pagado', 'Parcial', 'Pendiente'];

const METHOD_TO_ENUM: Record<string, string> = {
  'Transferencia': 'TRANSFERENCIA', 'Efectivo': 'EFECTIVO',
  'Débito': 'DEBITO', 'Crédito': 'CREDITO', 'Cheque': 'CHEQUE',
};
const STATUS_TO_ENUM: Record<string, string> = {
  'Pagado': 'PAGADO', 'Parcial': 'PARCIAL', 'Pendiente': 'PENDIENTE',
};
const ENUM_TO_LABEL: Record<string, string> = {
  'PAGADO': 'Pagado', 'PARCIAL': 'Parcial', 'PENDIENTE': 'Pendiente',
  'TRANSFERENCIA': 'Transferencia', 'EFECTIVO': 'Efectivo',
  'DEBITO': 'Débito', 'CREDITO': 'Crédito', 'CHEQUE': 'Cheque',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PAGADO:   { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
  PARCIAL:  { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  PENDIENTE:{ bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
};

const DATE_FILTERS = [
  { label: 'Todo', value: 'all' },
  { label: 'Este mes', value: 'month' },
  { label: 'Últimos 3 meses', value: 'quarter' },
];

const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

interface LineItem {
  productId: string; name: string; quantity: number; unitPrice: number;
}

const cardStyle: React.CSSProperties = {
  background: '#161b22',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
};

const inputStyle: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#cdd9e5',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 4,
};

function pillBtn(active: boolean, accent = '#3b82f6'): React.CSSProperties {
  return {
    padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
    fontWeight: active ? 600 : 400,
    background: active ? `${accent}22` : 'transparent',
    color: active ? accent : '#6e7681',
    transition: 'all 0.15s',
  };
}

export default function Sales() {
  const { user } = useAuthStore();
  const accentColor = user?.tenant?.primaryColor || '#3b82f6';
  const taxRate = user?.tenant?.taxRate || 19;
  const qc = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentStatus, setPaymentStatus] = useState('Pagado');
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', searchTerm],
    queryFn: () => api.get(`/sales${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`).then(r => r.data.data ?? r.data),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => api.get('/clients').then(r => r.data.data ?? r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products').then(r => r.data.data ?? r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/sales', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Venta registrada');
      resetForm();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al registrar venta'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/sales/${id}/payment-status`, { paymentStatus: STATUS_TO_ENUM[status] ?? status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); toast.success('Estado actualizado'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Venta anulada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al anular venta'),
  });

  const handleProductSelect = (productId: string) => {
    const p = products.find((x: any) => x.id === productId);
    setSelectedProduct(productId);
    if (p) setUnitPrice(Number(p.price) || 0);
  };

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const p = products.find((x: any) => x.id === selectedProduct);
    if (!p) return;
    const existing = items.findIndex(i => i.productId === selectedProduct);
    if (existing >= 0) {
      const updated = [...items];
      updated[existing].quantity += quantity;
      setItems(updated);
    } else {
      setItems([...items, { productId: p.id, name: p.name, quantity, unitPrice }]);
    }
    setSelectedProduct(''); setQuantity(1); setUnitPrice(0);
  };

  const handleSave = () => {
    if (!selectedClient || items.length === 0) return toast.error('Selecciona cliente y agrega productos');
    createMutation.mutate({
      clientId: selectedClient,
      paymentMethod: METHOD_TO_ENUM[paymentMethod] ?? paymentMethod,
      paymentStatus: STATUS_TO_ENUM[paymentStatus] ?? paymentStatus,
      items: items.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
    });
  };

  const resetForm = () => {
    setIsAdding(false); setSelectedClient(''); setItems([]);
    setPaymentMethod('Transferencia'); setPaymentStatus('Pagado');
  };

  // ── Filters ──
  const now = new Date();
  const filtered = sales.filter((s: any) => {
    const statusKey = s.paymentStatus || s.status || '';
    if (statusFilter !== 'all' && statusKey !== STATUS_TO_ENUM[statusFilter]) return false;
    if (dateFilter !== 'all') {
      const d = new Date(s.date || s.createdAt);
      if (dateFilter === 'month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'quarter') {
        const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 3);
        if (d < cutoff) return false;
      }
    }
    return true;
  });

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const, paddingRight: 32 };
  const totalRevenue = filtered.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>Ventas</h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>
            {filtered.length} venta{filtered.length !== 1 ? 's' : ''} · {formatCLP(totalRevenue)}
          </p>
        </div>
        <button onClick={() => { resetForm(); setIsAdding(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> Nueva Venta
        </button>
      </div>

      {isAdding && (
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f6fc', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            Registrar Venta
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Cliente</label>
              <div style={{ position: 'relative' }}>
                <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  <option value="">Seleccione cliente...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.rut}</option>)}
                </select>
                <ChevronDown size={12} color="#484f58" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Método de Pago</label>
              <div style={{ position: 'relative' }}>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} color="#484f58" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Estado del Pago</label>
              <div style={{ position: 'relative' }}>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} color="#484f58" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 10 }}>Agregar Producto</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <select value={selectedProduct} onChange={e => handleProductSelect(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  <option value="">Seleccione producto...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={12} color="#484f58" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))}
                style={{ ...inputStyle, width: 120 }} placeholder="Precio" />
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                style={{ ...inputStyle, width: 72 }} />
              <button onClick={handleAddItem}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#cdd9e5', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Agregar
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Producto', 'Cant.', 'P. Unit.', 'Subtotal', ''].map((h, i) => (
                      <th key={h} style={{ padding: '6px 8px', fontSize: 11, color: '#484f58', textAlign: i > 0 ? 'right' : 'left', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.productId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px', fontSize: 13, color: '#cdd9e5' }}>{item.name}</td>
                      <td style={{ padding: '8px', fontSize: 13, color: '#8b949e', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', fontSize: 13, color: '#8b949e', textAlign: 'right' }}>{formatCLP(item.unitPrice)}</td>
                      <td style={{ padding: '8px', fontSize: 13, color: '#cdd9e5', fontWeight: 600, textAlign: 'right' }}>{formatCLP(item.quantity * item.unitPrice)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button onClick={() => setItems(items.filter(i => i.productId !== item.productId))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f85149', fontSize: 11 }}>Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6e7681' }}>
                    <span>Neto:</span><span>{formatCLP(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#484f58' }}>
                    <span>IVA ({taxRate}%):</span><span>{formatCLP(tax)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#f0f6fc', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                    <span>Total:</span><span>{formatCLP(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 16 }}>
            <button onClick={resetForm}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#8b949e', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={createMutation.isPending || !selectedClient || items.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: (createMutation.isPending || !selectedClient || items.length === 0) ? 0.5 : 1 }}>
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Registrar Venta
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ ...cardStyle, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <Search size={15} color="#484f58" style={{ flexShrink: 0 }} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por cliente..."
              style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '4px 0', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 3 }}>
            {['all', ...PAYMENT_STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={pillBtn(statusFilter === s, accentColor)}>
                {s === 'all' ? 'Todos' : s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 3 }}>
            {DATE_FILTERS.map(f => (
              <button key={f.value} onClick={() => setDateFilter(f.value)}
                style={pillBtn(dateFilter === f.value, accentColor)}>
                {f.label}
              </button>
            ))}
          </div>
          {(statusFilter !== 'all' || dateFilter !== 'all') && (
            <button onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#484f58', fontSize: 12 }}>
              <RefreshCw size={11} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={28} color="#3b82f6" className="animate-spin" />
          </div>
        ) : (
          <div>
            {filtered.map((sale: any) => {
              const statusKey = sale.paymentStatus || sale.status || '';
              const st = STATUS_STYLES[statusKey] || { bg: 'rgba(255,255,255,0.06)', color: '#8b949e' };
              const statusLabel = ENUM_TO_LABEL[statusKey] || statusKey;
              const isExpanded = expandedId === sale.id;

              return (
                <div key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{
                    padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#484f58', padding: 0, display: 'flex' }}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShoppingCart size={16} color="#4ade80" />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#f0f6fc', margin: 0 }}>
                          Venta #{String(sale.number || sale.id).padStart(4, '0')}
                        </p>
                        <p style={{ fontSize: 12, color: '#8b949e', margin: '2px 0 0' }}>
                          {sale.client?.name || sale.clientName || '—'}
                          {sale.paymentMethod && ` · ${ENUM_TO_LABEL[sale.paymentMethod] || sale.paymentMethod}`}
                        </p>
                        <p style={{ fontSize: 11, color: '#484f58', margin: '2px 0 0' }}>
                          {sale.date ? new Date(sale.date).toLocaleDateString('es-CL') : '—'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#f0f6fc' }}>{formatCLP(Number(sale.total) || 0)}</span>

                      {/* Status selector */}
                      <div style={{ position: 'relative' }}>
                        <select
                          value={ENUM_TO_LABEL[statusKey] || statusKey}
                          onChange={e => updateStatusMutation.mutate({ id: sale.id, status: e.target.value })}
                          style={{ ...inputStyle, padding: '4px 28px 4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', appearance: 'none', background: st.bg, color: st.color, border: `1px solid ${st.color}33` }}
                        >
                          {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={10} color={st.color} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>

                      <button
                        onClick={() => { if (confirm('¿Anular esta venta?')) deleteMutation.mutate(sale.id); }}
                        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#484f58', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,81,73,0.4)'; e.currentTarget.style.color = '#f85149'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#484f58'; }}
                        title="Anular venta"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded items */}
                  {isExpanded && sale.items && (
                    <div style={{ padding: '0 20px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                        <thead>
                          <tr>
                            {['Producto', 'Cant.', 'P. Unit.', 'Subtotal'].map((h, i) => (
                              <th key={h} style={{ padding: '4px 8px', fontSize: 10, color: '#484f58', textAlign: i > 0 ? 'right' : 'left', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items.map((it: any) => (
                            <tr key={it.id}>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: '#cdd9e5' }}>{it.product?.name || it.description || '—'}</td>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: '#8b949e', textAlign: 'right' }}>{Number(it.quantity)}</td>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: '#8b949e', textAlign: 'right' }}>{formatCLP(Number(it.unitPrice))}</td>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: '#cdd9e5', fontWeight: 600, textAlign: 'right' }}>{formatCLP(Number(it.subtotal))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#6e7681' }}>
                        <span>Neto: {formatCLP(Number(sale.subtotal))}</span>
                        <span>IVA: {formatCLP(Number(sale.taxAmount))}</span>
                        <span style={{ color: '#f0f6fc', fontWeight: 700 }}>Total: {formatCLP(Number(sale.total))}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#484f58' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>No hay ventas con los filtros seleccionados.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
