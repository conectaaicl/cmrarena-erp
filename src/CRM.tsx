import React, { useState } from 'react';
import { useStore, Client } from './store';
import { Plus, Search, Mail, Phone, FileText } from 'lucide-react';

function CRM() {
  const { clients, addClient, updateClientStatus, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '', rut: '', email: '', phone: '', status: 'Nuevo', notes: ''
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.rut.includes(searchTerm)
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClient.name && newClient.rut) {
      addClient({
        id: `c${Date.now()}`,
        name: newClient.name,
        rut: newClient.rut,
        email: newClient.email || '',
        phone: newClient.phone || '',
        status: newClient.status as Client['status'],
        notes: newClient.notes || '',
      });
      setIsAdding(false);
      setNewClient({ name: '', rut: '', email: '', phone: '', status: 'Nuevo', notes: '' });
    }
  };

  const statusColors: Record<string, string> = {
    'Nuevo': 'bg-blue-100 text-blue-800',
    'Cotización enviada': 'bg-amber-100 text-amber-800',
    'Seguimiento': 'bg-purple-100 text-purple-800',
    'Aprobado': 'bg-green-100 text-green-800',
    'Venta cerrada': 'bg-teal-100 text-teal-800',
    'Perdido': 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Directorio de Clientes</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <Plus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Agregar Nuevo Cliente</h2>
          <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre o Razón Social</label>
              <input type="text" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="Constructora Alfa S.A." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">RUT</label>
              <input type="text" required value={newClient.rut} onChange={e => setNewClient({...newClient, rut: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="76.123.456-7" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="contacto@empresa.cl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input type="text" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="+56 9 1234 5678" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
              <textarea value={newClient.notes} onChange={e => setNewClient({...newClient, notes: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" rows={2} placeholder="Requisitos del cliente..."></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-white rounded-md" style={{ backgroundColor: settings.primaryColor }}>Guardar Cliente</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.rut}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[client.status]}`}>
                  {client.status}
                </span>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {client.email || 'Sin email'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {client.phone || 'Sin teléfono'}
                </div>
                {client.notes && (
                  <div className="flex items-start text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                    <FileText className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="italic line-clamp-2">{client.notes}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <select
                  value={client.status}
                  onChange={(e) => updateClientStatus(client.id, e.target.value as Client['status'])}
                  className="w-full text-sm border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1"
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Cotización enviada">Cotización enviada</option>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Venta cerrada">Venta cerrada</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No se encontraron clientes que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CRM;