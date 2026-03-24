import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, Send, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';


const statusColors: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-700',
  ENVIADA: 'bg-blue-100 text-blue-700',
  APROBADA: 'bg-green-100 text-green-700',
  RECHAZADA: 'bg-red-100 text-red-700',
  VENCIDA: 'bg-orange-100 text-orange-700',
};

const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

export default function Quotations() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const primaryColor = user?.tenant?.primaryColor || '#0f172a';
  const taxRate = user?.tenant?.taxRate || 19;

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number; name: string }>>([]);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations', searchTerm],
    queryFn: () => api.get(`/quotations${searchTerm ? `?search=${searchTerm}` : ''}`).then((r) => r.data.data),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => api.get('/clients').then((r) => r.data.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products').then((r) => r.data.data),
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
    setSelectedProduct(productId);
    if (product) setUnitPrice(Number(product.price));
  };

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;
    const existing = items.findIndex((i) => i.productId === selectedProduct);
    if (existing >= 0) {
      const updated = [...items];
      updated[existing].quantity += quantity;
      setItems(updated);
    } else {
      setItems([...items, { productId: product.id, quantity, unitPrice, name: product.name }]);
    }
    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice(0);
  };

  const handleSave = () => {
    if (!selectedClient || items.length === 0) return toast.error('Selecciona cliente y agrega productos');
    createMutation.mutate({
      clientId: selectedClient,
      notes,
      items: items.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
    });
  };

  const resetForm = () => {
    setIsAdding(false);
    setSelectedClient('');
    setItems([]);
    setNotes('');
  };

  const downloadPDF = async (id: string, number: number) => {
    try {
      const res = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${String(number).padStart(4, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error generando PDF');
    }
  };

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cotizaciones</h1>
          <p className="text-slate-500 text-sm mt-1">{quotations.length} cotizaciones en total</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition" style={{ backgroundColor: primaryColor }}>
          <Plus size={18} /><span>Nueva Cotización</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-4 border-b pb-3">Crear Cotización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Seleccione cliente...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.rut}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones opcionales..."
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Agregar Producto</h3>
            <div className="flex gap-2 flex-wrap">
              <select value={selectedProduct} onChange={(e) => handleProductSelect(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg p-2 text-sm outline-none min-w-[200px]">
                <option value="">Seleccione producto...</option>
                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {formatCLP(p.price)}</option>)}
              </select>
              <input type="number" min="0.1" step="0.1" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-32 border border-slate-200 rounded-lg p-2 text-sm outline-none" placeholder="Precio" />
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20 border border-slate-200 rounded-lg p-2 text-sm outline-none" />
              <button onClick={handleAddItem} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">Agregar</button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-slate-500 text-left">
                  <th className="pb-2">Producto</th><th className="pb-2 text-right">Cant.</th>
                  <th className="pb-2 text-right">P. Unit.</th><th className="pb-2 text-right">Subtotal</th><th></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCLP(item.unitPrice)}</td>
                      <td className="py-2 text-right font-medium">{formatCLP(item.quantity * item.unitPrice)}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => setItems(items.filter((i) => i.productId !== item.productId))} className="text-red-400 text-xs hover:text-red-600">Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-1 text-right text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Neto:</span><span>{formatCLP(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>IVA ({taxRate}%):</span><span>{formatCLP(tax)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total:</span><span>{formatCLP(total)}</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 border-t pt-4">
            <button onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={createMutation.isPending || !selectedClient || items.length === 0}
              className="px-5 py-2 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Cotización
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente..." className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {quotations.map((q: any) => (
            <div key={q.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Cotización #{String(q.number).padStart(4, '0')}</p>
                  <p className="text-sm text-slate-500">{q.client?.name} · {q._count?.items || 0} productos</p>
                  <p className="text-xs text-slate-400">{new Date(q.date).toLocaleDateString('es-CL')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-800">{formatCLP(Number(q.total))}</span>
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusColors[q.status] || 'bg-gray-100 text-gray-700'}`}>{q.status}</span>

                <div className="flex gap-1.5">
                  <button onClick={() => downloadPDF(q.id, q.number)} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition" title="Descargar PDF">
                    <Download size={15} />
                  </button>
                  {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                    <button onClick={() => sendEmailMutation.mutate(q.id)} className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition" title="Enviar por email">
                      <Send size={15} />
                    </button>
                  )}
                  {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                    <button onClick={() => approveMutation.mutate(q.id)} className="p-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition" title="Aprobar">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {q.status !== 'RECHAZADA' && q.status !== 'APROBADA' && (
                    <button onClick={() => statusMutation.mutate({ id: q.id, status: 'RECHAZADA' })} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition" title="Rechazar">
                      <XCircle size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {quotations.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No hay cotizaciones aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
