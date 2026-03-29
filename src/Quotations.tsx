import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, Send, CheckCircle, XCircle, Printer, Loader2, Trash2, Pencil, ShoppingCart, X, Download } from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';
import { printQuotation } from './utils/quotationPrint';

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  BORRADOR: { background: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  ENVIADA:  { background: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  APROBADA: { background: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  RECHAZADA:{ background: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  VENCIDA:  { background: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

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
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 4,
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: 11, fontWeight: 600,
  color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px',
  background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: 13, color: '#8b949e',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  verticalAlign: 'middle',
};

type ItemRow = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  width: string;
  height: string;
};

export default function Quotations() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const accentColor = user?.tenant?.primaryColor || '#1d4ed8';
  const taxRate = user?.tenant?.taxRate ?? 19;
  const t = user?.tenant as any;
  const logoUrl        = t?.logoUrl        || '';
  const companyName    = t?.name           || '';
  const companyTagline = t?.companyTagline || '';
  const whatsapp       = t?.whatsapp       || '';
  const companyEmail   = t?.companyEmail   || '';
  const bankHolder     = t?.bankHolder     || '';
  const bankName       = t?.bankName       || '';
  const bankAccountType= t?.bankAccountType|| '';
  const bankRut        = t?.bankRut        || '';
  const bankAccount    = t?.bankAccount    || '';

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [convertingQuotation, setConvertingQuotation] = useState<any>(null);
  const [convertPayMethod, setConvertPayMethod] = useState('TRANSFERENCIA');

  // Form state
  const [selectedClient, setSelectedClient] = useState('');
  const [notes, setNotes] = useState('');
  const [installationCost, setInstallationCost] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);

  // Item add row state
  const [selProduct, setSelProduct] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemWidth, setItemWidth] = useState('');
  const [itemHeight, setItemHeight] = useState('');

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations', searchTerm],
    queryFn: () => api.get(`/quotations${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`).then((r) => r.data.data ?? r.data),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => api.get('/clients').then((r) => r.data.data ?? r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products').then((r) => r.data.data ?? r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/quotations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización creada');
      resetForm();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear cotización'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/quotations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización actualizada');
      resetForm();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar cotización'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/quotations/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id: string) => api.post(`/quotations/${id}/send-email`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización enviada por email');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error enviando email'),
  });

  const convertToSaleMutation = useMutation({
    mutationFn: ({ quotation, paymentMethod }: { quotation: any; paymentMethod: string }) => {
      const detail = quotation;
      return api.post('/sales', {
        clientId: detail.client?.id || detail.clientId,
        quotationId: detail.id,
        paymentMethod,
        paymentStatus: 'PENDIENTE',
        notes: detail.notes,
        items: (detail.items || []).map((it: any) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          description: it.description,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta creada desde cotización');
      setConvertingQuotation(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al convertir'),
  });

  const handleConvert = async (q: any) => {
    try {
      const res = await api.get(`/quotations/${q.id}`);
      const detail = res.data.data ?? res.data;
      setConvertingQuotation(detail);
      setConvertPayMethod('TRANSFERENCIA');
    } catch {
      toast.error('Error cargando cotización');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/exports/sales/excel', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `cotizaciones-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Error exportando'); }
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/quotations/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Cotización aprobada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const handleProductSelect = (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    setSelProduct(productId);
    if (product) setItemPrice(Number(product.price));
  };

  const handleAddItem = () => {
    if (!selProduct || itemQty <= 0) return;
    const product = products.find((p: any) => p.id === selProduct);
    if (!product) return;
    const newItem: ItemRow = {
      productId: product.id,
      name: product.name,
      sku: product.sku || '',
      quantity: itemQty,
      unitPrice: itemPrice,
      width: itemWidth,
      height: itemHeight,
    };
    const existing = items.findIndex((i) => i.productId === selProduct);
    if (existing >= 0) {
      const updated = [...items];
      updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + itemQty };
      setItems(updated);
    } else {
      setItems([...items, newItem]);
    }
    setSelProduct('');
    setItemQty(1);
    setItemPrice(0);
    setItemWidth('');
    setItemHeight('');
  };

  const handleSave = () => {
    if (!selectedClient || items.length === 0) return toast.error('Selecciona cliente y agrega productos');
    const payload = {
      clientId: selectedClient,
      notes,
      installationCost: installationCost !== '' ? Number(installationCost) : undefined,
      items: items.map(({ productId, quantity, unitPrice, width, height }) => ({
        productId, quantity, unitPrice,
        width: width !== '' ? Number(width) : undefined,
        height: height !== '' ? Number(height) : undefined,
      })),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = async (q: any) => {
    try {
      const res = await api.get(`/quotations/${q.id}`);
      const detail = res.data.data ?? res.data;
      setEditingId(detail.id);
      setSelectedClient(detail.clientId);
      setNotes(detail.notes || '');
      setInstallationCost(Number(detail.installationCost ?? 0) > 0 ? String(detail.installationCost) : '');
      setItems((detail.items || []).map((it: any) => ({
        productId: it.productId,
        name: it.product?.name || '',
        sku: it.product?.sku || '',
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        width: it.width ? String(it.width) : '',
        height: it.height ? String(it.height) : '',
      })));
      setIsAdding(true);
    } catch {
      toast.error('Error cargando cotización');
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setSelectedClient('');
    setNotes('');
    setInstallationCost('');
    setItems([]);
    setSelProduct('');
    setItemQty(1);
    setItemPrice(0);
    setItemWidth('');
    setItemHeight('');
  };

  // Fetch full quotation detail and open print window
  const handlePrint = async (q: any) => {
    try {
      // Try to get full detail with items
      let detail = q;
      if (!q.items) {
        const res = await api.get(`/quotations/${q.id}`);
        detail = res.data.data ?? res.data;
      }
      const client = detail.client || {};
      const inst = Number(detail.installationCost ?? 0);
      const subtotalVal = Number(detail.subtotal ?? 0);
      const taxVal = Number(detail.tax ?? 0);
      const totalVal = Number(detail.total ?? 0);

      printQuotation({
        number: detail.number,
        date: detail.date,
        client: {
          name: client.name || '',
          rut: client.rut,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city,
        },
        items: (detail.items || []).map((it: any) => ({
          name: it.product?.name || it.name || '',
          sku: it.product?.sku || it.sku || '',
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          subtotal: Number(it.subtotal ?? it.quantity * it.unitPrice),
          width: it.width ? Number(it.width) : undefined,
          height: it.height ? Number(it.height) : undefined,
        })),
        subtotal: subtotalVal,
        tax: taxVal,
        taxRate: Number(detail.taxRate ?? taxRate),
        total: totalVal,
        notes: detail.notes,
        installationCost: inst > 0 ? inst : undefined,
        companyName,
        companyTagline: companyTagline || undefined,
        logoUrl: logoUrl || undefined,
        whatsapp: whatsapp || undefined,
        companyEmail: companyEmail || undefined,
        bankHolder: bankHolder || undefined,
        bankName: bankName || undefined,
        bankAccountType: bankAccountType || undefined,
        bankRut: bankRut || undefined,
        bankAccount: bankAccount || undefined,
      });
    } catch {
      toast.error('Error generando cotización');
    }
  };

  // Subtotal preview while building form
  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (taxRate / 100);
  const inst = installationCost !== '' ? Number(installationCost) : 0;
  const total = subtotal + tax + inst;

  const clientObj = clients.find((c: any) => c.id === selectedClient);

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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>Cotizaciones</h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>{quotations.length} cotizaciones en total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', color: '#8b949e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={14} />Excel
          </button>
          <button onClick={() => { resetForm(); setIsAdding(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={16} />Nueva Cotización
          </button>
        </div>
      </div>

      {/* Create Form */}
      {isAdding && (
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f6fc', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {editingId ? 'Editar Cotización' : 'Nueva Cotización'}
          </p>

          {/* Client + Notes + Installation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Cliente <span style={{ color: '#f85149' }}>*</span></label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Seleccione cliente...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.rut ? ` — ${c.rut}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Observaciones</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Instalación ($)</label>
              <input type="number" min="0" value={installationCost}
                onChange={(e) => setInstallationCost(e.target.value)}
                placeholder="0" style={inputStyle} />
            </div>
          </div>

          {/* Client detail preview */}
          {clientObj && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, fontSize: 12, color: '#8b949e', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {clientObj.rut && <span><b style={{ color: '#6e7681' }}>RUT:</b> {clientObj.rut}</span>}
              {clientObj.email && <span><b style={{ color: '#6e7681' }}>Email:</b> {clientObj.email}</span>}
              {clientObj.phone && <span><b style={{ color: '#6e7681' }}>Tel:</b> {clientObj.phone}</span>}
              {clientObj.address && <span><b style={{ color: '#6e7681' }}>Dir:</b> {clientObj.address}</span>}
              {clientObj.city && <span><b style={{ color: '#6e7681' }}>Comuna:</b> {clientObj.city}</span>}
            </div>
          )}

          {/* Add item row */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6e7681', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agregar Producto</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 70px 70px auto', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Producto</label>
                <select value={selProduct} onChange={(e) => handleProductSelect(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Seleccione...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Precio ($)</label>
                <input type="number" min="0" value={itemPrice} onChange={(e) => setItemPrice(Number(e.target.value))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Cantidad</label>
                <input type="number" min="1" value={itemQty} onChange={(e) => setItemQty(Number(e.target.value))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ancho (cm)</label>
                <input type="number" min="0" value={itemWidth} onChange={(e) => setItemWidth(e.target.value)}
                  placeholder="—" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Alto (cm)</label>
                <input type="number" min="0" value={itemHeight} onChange={(e) => setItemHeight(e.target.value)}
                  placeholder="—" style={inputStyle} />
              </div>
              <div>
                <button onClick={handleAddItem}
                  style={{ background: accentColor, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Producto', 'SKU', 'Cant.', 'Ancho', 'Alto', 'P.Unit.', 'Subtotal', ''].map(h => (
                      <th key={h} style={{ ...thStyle, textAlign: ['Cant.', 'Ancho', 'Alto', 'P.Unit.', 'Subtotal'].includes(h) ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.productId}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ ...tdStyle, color: '#cdd9e5', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{item.sku || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.width || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.height || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#cdd9e5' }}>{fmt(item.quantity * item.unitPrice)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f85149', padding: 4 }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals preview */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <div style={{ width: 240, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#8b949e' }}>
                    <span>Subtotal neto:</span><span>{fmt(subtotal)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#8b949e' }}>
                      <span>IVA ({taxRate}%):</span><span>{fmt(tax)}</span>
                    </div>
                  )}
                  {inst > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#8b949e' }}>
                      <span>Instalación:</span><span>{fmt(inst)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4, fontWeight: 700, fontSize: 15, color: '#f0f6fc' }}>
                    <span>TOTAL:</span><span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={resetForm}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#8b949e', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={(createMutation.isPending || updateMutation.isPending) || !selectedClient || items.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: accentColor, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: ((createMutation.isPending || updateMutation.isPending) || !selectedClient || items.length === 0) ? 0.5 : 1 }}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
              {editingId ? 'Actualizar Cotización' : 'Guardar Cotización'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Convertir a Venta */}
      {convertingQuotation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f6fc', margin: 0 }}>Convertir a Venta</p>
              <button onClick={() => setConvertingQuotation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e7681' }}><X size={16} /></button>
            </div>
            <div style={{ background: '#0d1117', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#8b949e' }}>
              <div>Cotización <strong style={{ color: '#cdd9e5' }}>#{String(convertingQuotation.number).padStart(4,'0')}</strong></div>
              <div>Cliente: <strong style={{ color: '#cdd9e5' }}>{convertingQuotation.client?.name}</strong></div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: '#f0f6fc' }}>Total: {fmt(Number(convertingQuotation.total))}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Método de pago</label>
              <select value={convertPayMethod} onChange={e => setConvertPayMethod(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {[['TRANSFERENCIA','Transferencia'],['EFECTIVO','Efectivo'],['DEBITO','Débito'],['CREDITO','Crédito'],['CHEQUE','Cheque']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConvertingQuotation(null)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#8b949e', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => convertToSaleMutation.mutate({ quotation: convertingQuotation, paymentMethod: convertPayMethod })}
                disabled={convertToSaleMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#22c55e', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: convertToSaleMutation.isPending ? 0.6 : 1 }}>
                {convertToSaleMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                Crear Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={cardStyle}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={15} color="#484f58" style={{ flexShrink: 0 }} />
          <input type="text" placeholder="Buscar por cliente..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '4px 0', flex: 1 }} />
        </div>

        {quotations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#484f58' }}>
            <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 13 }}>No hay cotizaciones aún</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Cotización', 'Cliente', 'Fecha', 'Items', 'Total', 'Estado', ''].map(h => (
                  <th key={h} style={{ ...thStyle, textAlign: ['Total', ''].includes(h) ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotations.map((q: any) => {
                const badge = STATUS_BADGE[q.status] || STATUS_BADGE.BORRADOR;
                return (
                  <tr key={q.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={14} color="#60a5fa" />
                        </div>
                        <span style={{ fontWeight: 600, color: '#cdd9e5', fontFamily: 'monospace' }}>
                          #{String(q.number).padStart(4, '0')}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#cdd9e5' }}>{q.client?.name || '—'}</td>
                    <td style={tdStyle}>{new Date(q.date).toLocaleDateString('es-CL')}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{q._count?.items ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#cdd9e5' }}>{fmt(Number(q.total))}</td>
                    <td style={tdStyle}>
                      <span style={{ ...badge, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {q.status === 'APROBADA' && (
                          <button onClick={() => handleConvert(q)} title="Convertir a venta"
                            style={{ background: 'none', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#4ade80', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                            <ShoppingCart size={13} />
                          </button>
                        )}
                        {q.status === 'BORRADOR' && (
                          <button onClick={() => handleEdit(q)} title="Editar cotización"
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#6e7681', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; e.currentTarget.style.color = '#fbbf24'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6e7681'; }}>
                            <Pencil size={13} />
                          </button>
                        )}
                        <button onClick={() => handlePrint(q)} title="Imprimir / PDF"
                          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#6e7681', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.color = '#60a5fa'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6e7681'; }}>
                          <Printer size={13} />
                        </button>
                        {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                          <button onClick={() => sendEmailMutation.mutate(q.id)} title="Enviar por email"
                            style={{ background: 'none', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                            <Send size={13} />
                          </button>
                        )}
                        {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                          <button onClick={() => approveMutation.mutate(q.id)} title="Aprobar"
                            style={{ background: 'none', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#4ade80', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                            <CheckCircle size={13} />
                          </button>
                        )}
                        {q.status !== 'RECHAZADA' && q.status !== 'APROBADA' && (
                          <button onClick={() => statusMutation.mutate({ id: q.id, status: 'RECHAZADA' })} title="Rechazar"
                            style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
