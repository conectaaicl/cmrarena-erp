import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, AlertCircle, Package, Loader2, Pencil, ChevronDown, Filter, Download } from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Cortinas Roller', 'Persianas', 'Toldos', 'Cierres de Terraza',
  'Domótica', 'Control de Acceso', 'Accesorios', 'Materiales', 'General',
];

const emptyForm = {
  sku: '', name: '', category: 'General', description: '',
  cost: '', price: '', stock: '', minStock: '',
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

const thStyle: React.CSSProperties = {
  padding: '10px 16px', fontSize: 11, fontWeight: 600,
  color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px',
  background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: 13, color: '#8b949e',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

export default function Inventory() {
  const { user } = useAuthStore();
  const accentColor = user?.tenant?.primaryColor || '#3b82f6';
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () =>
      api.get(`/products${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`)
        .then((r) => r.data.data ?? r.data),
  });

  const numericify = (f: typeof emptyForm) => ({
    ...f,
    cost:     f.cost     !== '' ? Number(f.cost)     : undefined,
    price:    f.price    !== '' ? Number(f.price)    : undefined,
    stock:    f.stock    !== '' ? Number(f.stock)    : undefined,
    minStock: f.minStock !== '' ? Number(f.minStock) : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => api.post('/products', numericify(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado');
      setIsAdding(false);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear producto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptyForm }) =>
      api.patch(`/products/${id}`, numericify(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto actualizado');
      setEditingId(null);
      setForm({ ...emptyForm });
      setIsAdding(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('El nombre es obligatorio');
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const handleEdit = (p: any) => {
    setForm({
      sku: p.sku || '',
      name: p.name || '',
      category: p.category || 'General',
      description: p.description || '',
      cost:     p.cost     != null ? String(p.cost)     : '',
      price:    p.price    != null ? String(p.price)    : '',
      stock:    p.stock    != null ? String(p.stock)    : '',
      minStock: p.minStock != null ? String(p.minStock) : '',
    });
    setEditingId(p.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>
            Inventario y Productos
          </h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>
            {isLoading ? '…' : `${products.length} producto${products.length !== 1 ? 's' : ''} en catálogo`}
          </p>
        </div>
        <button onClick={() => { handleCancel(); setIsAdding(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: accentColor, color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
          <Plus size={16} />
          Nuevo Producto
        </button>
        <button onClick={async () => {
          try {
            const res = await api.get('/exports/inventory/excel', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url;
            a.download = 'inventario.xlsx'; a.click(); URL.revokeObjectURL(url);
          } catch { toast.error('Error exportando'); }
        }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', color: '#8b949e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <Download size={14} />Excel
        </button>
        <button onClick={async () => {
          try {
            const res = await api.get('/exports/inventory/pdf', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url;
            a.download = 'inventario.pdf'; a.click(); URL.revokeObjectURL(url);
          } catch { toast.error('Error exportando'); }
        }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', color: '#8b949e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <Download size={14} />PDF
        </button>
      </div>

      {/* Form */}
      {isAdding && (
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f6fc', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {editingId ? 'Editar Producto' : 'Agregar Producto'}
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label style={labelStyle}>SKU / Código</label>
              <input style={inputStyle} value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="RL-BLACKOUT-100" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Nombre <span style={{ color: '#f85149' }}>*</span></label>
              <input style={inputStyle} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Cortina Roller Blackout 100x150cm" />
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <div style={{ position: 'relative' }}>
                <select style={{ ...inputStyle, paddingRight: 32, cursor: 'pointer', appearance: 'none' }}
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} color="#484f58" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Descripción</label>
              <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve..." />
            </div>
            {[
              { label: 'Costo ($)', key: 'cost' as const, placeholder: '0' },
              { label: 'Precio Venta ($)', key: 'price' as const, placeholder: '0' },
              { label: 'Stock', key: 'stock' as const, placeholder: '0' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type="number" min="0" style={inputStyle} value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Stock Mínimo</label>
              <input type="number" min="0" style={inputStyle} value={form.minStock}
                onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="0" />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="button" onClick={handleCancel}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#8b949e', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: (createMutation.isPending || updateMutation.isPending) ? 0.6 : 1 }}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                {editingId ? 'Actualizar' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={cardStyle}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Search size={15} color="#484f58" style={{ flexShrink: 0 }} />
          <input type="text" placeholder="Buscar por nombre o SKU..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '4px 0', flex: 1, minWidth: 140 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} color="#484f58" />
            <div style={{ position: 'relative' }}>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                style={{ ...inputStyle, padding: '5px 28px 5px 10px', fontSize: 12, cursor: 'pointer', appearance: 'none' }}>
                <option>Todos</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={11} color="#484f58" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 2 }}>
              {[['all','Todos'],['low','Stock bajo'],['ok','En orden']].map(([v, l]) => (
                <button key={v} onClick={() => setStockFilter(v as any)}
                  style={{ padding: '4px 10px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: stockFilter === v ? 600 : 400, background: stockFilter === v ? (v === 'low' ? 'rgba(248,81,73,0.2)' : 'rgba(59,130,246,0.15)') : 'transparent', color: stockFilter === v ? (v === 'low' ? '#f85149' : accentColor) : '#6e7681' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={28} color="#3b82f6" className="animate-spin" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['SKU', 'Producto', 'Categoría', 'Costo', 'Precio', 'Margen', 'Stock', ''].map(h => (
                    <th key={h} style={{ ...thStyle, textAlign: h === '' || h === 'Costo' || h === 'Precio' || h === 'Margen' || h === 'Stock' ? 'right' : 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.filter((p: any) => {
                  const cost = Number(p.cost) || 0; const price = Number(p.price) || 0;
                  const stock = Number(p.stock) || 0; const minStock = Number(p.minStock ?? p.min_stock) || 0;
                  const isLowStock = stock <= minStock && minStock > 0;
                  if (categoryFilter !== 'Todos' && p.category !== categoryFilter) return false;
                  if (stockFilter === 'low' && !isLowStock) return false;
                  if (stockFilter === 'ok' && isLowStock) return false;
                  return true;
                }).map((p: any) => {
                  const cost = Number(p.cost) || 0;
                  const price = Number(p.price) || 0;
                  const stock = Number(p.stock) || 0;
                  const minStock = Number(p.minStock ?? p.min_stock) || 0;
                  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
                  const isLow = stock <= minStock && minStock > 0;

                  return (
                    <tr key={p.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: '#6e7681' }}>{p.sku || '—'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={13} color="#484f58" />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#cdd9e5', margin: 0 }}>{p.name}</p>
                            {p.description && (
                              <p style={{ fontSize: 11, color: '#484f58', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>{p.category || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{cost > 0 ? `$${cost.toLocaleString('es-CL')}` : '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#cdd9e5', fontWeight: 500 }}>{price > 0 ? `$${price.toLocaleString('es-CL')}` : '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span style={{ color: margin >= 30 ? '#3fb950' : margin > 0 ? '#d29922' : '#484f58', fontWeight: 600 }}>
                          {price > 0 ? `${margin.toFixed(0)}%` : '—'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: isLow ? '#f85149' : '#cdd9e5' }}>{stock}</span>
                          {isLow && <AlertCircle size={13} color="#f85149" />}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button onClick={() => handleEdit(p)}
                          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#6e7681', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.color = '#60a5fa'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6e7681'; }}
                        >
                          <Pencil size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#484f58' }}>
                <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>
                  {searchTerm ? 'No se encontraron productos.' : 'No hay productos registrados aún.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
