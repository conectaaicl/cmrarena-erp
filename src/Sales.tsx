import { useState } from 'react';
import { useStore, Sale, QuoteItem } from './store';
import { ShoppingCart, Plus, Search, DollarSign } from 'lucide-react';

function Sales() {
  const { sales, clients, products, addSale, settings, dtes, emitDTE } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Transferencia');
  const [paymentStatus, setPaymentStatus] = useState<Sale['status']>('Pagado');
  const [items, setItems] = useState<QuoteItem[]>([]);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (product.stock < quantity) {
      alert(`¡Advertencia! No hay suficiente stock. Stock actual: ${product.stock}`);
    }

    const existingItemIndex = items.findIndex(i => i.productId === selectedProduct);
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([...items, { productId: product.id, quantity, unitPrice: product.price }]);
    }
    
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const handleSaveSale = () => {
    if (!selectedClient || items.length === 0) return;
    
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const total = subtotal * (1 + (settings.taxRate / 100)); // Incluye IVA

    addSale({
      id: `s${Date.now()}`,
      clientId: selectedClient,
      date: new Date().toISOString().split('T')[0],
      items,
      total,
      paymentMethod,
      status: paymentStatus
    });

    setIsAdding(false);
    setSelectedClient('');
    setItems([]);
  };

  const filteredSales = sales.filter(s => {
    const client = clients.find(c => c.id === s.clientId);
    return client?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Ventas Registradas</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <Plus size={18} />
          <span>Nueva Venta Directa</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Crear Venta Directa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Seleccione un cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.rut})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as Sale['paymentMethod'])} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Pago</label>
                  <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as Sale['status'])} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                    <option value="Pagado">Pagado Completo</option>
                    <option value="Parcial">Pago Parcial</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Agregar Producto</h3>
              <div className="flex space-x-2">
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="flex-1 border-gray-300 rounded-md shadow-sm p-2 border">
                  <option value="">Seleccione producto...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) - ${p.price}</option>)}
                </select>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-20 border-gray-300 rounded-md shadow-sm p-2 border" />
                <button type="button" onClick={handleAddItem} className="bg-gray-800 text-white px-3 rounded-md hover:bg-gray-700">Add</button>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2">Cant.</th>
                    <th className="pb-2">Precio Unit.</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <tr key={item.productId}>
                        <td className="py-2">{product?.name}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">${item.unitPrice.toLocaleString()}</td>
                        <td className="py-2">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => removeItem(item.productId)} className="text-red-500 text-xs">Quitar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2 text-right">
                  <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>${items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-gray-500"><span>IVA ({settings.taxRate}%):</span> <span>${(items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0) * (settings.taxRate / 100)).toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total a Cobrar:</span> <span>${(items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0) * (1 + (settings.taxRate / 100))).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
            <button onClick={handleSaveSale} disabled={!selectedClient || items.length === 0} className="px-4 py-2 text-white rounded-md disabled:opacity-50" style={{ backgroundColor: settings.primaryColor }}>Registrar Venta (Descuenta Stock)</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="Buscar venta por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4">
          {filteredSales.slice().reverse().map((sale) => {
            const client = clients.find(c => c.id === sale.clientId);
            return (
              <div key={sale.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="p-3 bg-gray-50 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Venta #{sale.id}</h3>
                    <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{client?.name || 'Cliente Eliminado'}</span></p>
                    <p className="text-xs text-gray-400">Fecha: {sale.date} • Pagado vía {sale.paymentMethod}</p>
                    {sale.quotationId && <p className="text-xs text-blue-500 mt-1">Ref: Cotización #{sale.quotationId}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900">${sale.total.toLocaleString()}</span>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sale.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                      sale.status === 'Parcial' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sale.status}
                    </span>
                    
                    {(() => {
                      const dteEmitido = dtes.find(d => d.saleId === sale.id);
                      if (dteEmitido) {
                        return (
                          <span className="flex items-center space-x-1 px-3 py-1 text-xs border border-blue-200 text-blue-700 bg-blue-50 rounded font-medium">
                            <DollarSign size={14} /> <span>{dteEmitido.type === 'Boleta Electrónica' ? 'Boleta' : 'Factura'} Nº {dteEmitido.folio}</span>
                          </span>
                        );
                      } else {
                        return (
                          <div className="flex space-x-2">
                            <button onClick={() => emitDTE(sale.id, 'Boleta Electrónica')} className="flex items-center space-x-1 px-3 py-1 text-xs border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition-colors shadow-sm">
                              <span>Emitir Boleta</span>
                            </button>
                            <button onClick={() => emitDTE(sale.id, 'Factura Electrónica')} className="flex items-center space-x-1 px-3 py-1 text-xs border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition-colors shadow-sm">
                              <span>Emitir Factura</span>
                            </button>
                          </div>
                        );
                      }
                    })()}

                  </div>
                </div>
              </div>
            );
          })}
          {filteredSales.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay ventas registradas en el sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sales;