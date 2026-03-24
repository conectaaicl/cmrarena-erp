import React, { useState } from 'react';
import { useStore, Product } from './store';
import { Plus, Search, AlertCircle, Package } from 'lucide-react';

function Inventory() {
  const { products, addProduct, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    sku: '', name: '', category: '', cost: 0, price: 0, stock: 0, minStock: 0
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.sku && newProduct.name) {
      addProduct({
        id: `p${Date.now()}`,
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category || 'General',
        cost: Number(newProduct.cost) || 0,
        price: Number(newProduct.price) || 0,
        stock: Number(newProduct.stock) || 0,
        minStock: Number(newProduct.minStock) || 0,
      });
      setIsAdding(false);
      setNewProduct({ sku: '', name: '', category: '', cost: 0, price: 0, stock: 0, minStock: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Inventario y Productos</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <Plus size={18} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Agregar Nuevo Producto</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU / Código</label>
              <input type="text" required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="RL-100" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
              <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="Roller Blackout 100x150" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <input type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="Roller" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo Base ($)</label>
              <input type="number" required value={newProduct.cost || ''} onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio Venta ($)</label>
              <input type="number" required value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Inicial</label>
              <input type="number" required value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
              <input type="number" required value={newProduct.minStock || ''} onChange={e => setNewProduct({...newProduct, minStock: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="0" />
            </div>
            <div className="md:col-span-3 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-white rounded-md" style={{ backgroundColor: settings.primaryColor }}>Guardar Producto</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium">Costo</th>
                <th className="p-4 font-medium">Precio</th>
                <th className="p-4 font-medium">Margen</th>
                <th className="p-4 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;
                const isLowStock = product.stock <= product.minStock;

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-600">{product.sku}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{product.category}</td>
                    <td className="p-4 text-sm text-gray-600">${product.cost.toLocaleString()}</td>
                    <td className="p-4 text-sm font-medium text-gray-800">${product.price.toLocaleString()}</td>
                    <td className="p-4 text-sm text-green-600 font-medium">{margin.toFixed(0)}%</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                          {product.stock}
                        </span>
                        {isLowStock && (
                          <span title="Stock Crítico">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay productos registrados en el inventario.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Inventory;