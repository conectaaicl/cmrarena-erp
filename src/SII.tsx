import React, { useState } from 'react';
import { useStore } from './store';
import { ShieldCheck, Upload, FileText, CheckCircle, Search, AlertTriangle, Eye, RefreshCw, Download, FileCode2 } from 'lucide-react';

function SII() {
  const { siiConfig, dtes, updateSIIConfig } = useStore();
  const [activeTab, setActiveTab] = useState<'cert' | 'dtes'>('dtes');
  const [searchTerm, setSearchTerm] = useState('');

  const handleUploadCert = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Simula subida y validación
      setTimeout(() => {
        updateSIIConfig({ certificateUploaded: true });
        alert('Certificado digital (.pfx) subido y validado exitosamente.');
      }, 1000);
    }
  };

  const filteredDtes = dtes.filter(dte => 
    dte.folio.toString().includes(searchTerm) || 
    dte.trackId.includes(searchTerm) ||
    dte.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Facturación Electrónica SII</h1>
          <p className="text-sm text-gray-500">
            Ambiente actual: <span className={`font-medium ${siiConfig.environment === 'Producción' ? 'text-green-600' : 'text-amber-600'}`}>
              {siiConfig.environment}
            </span>
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button 
            onClick={() => setActiveTab('dtes')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'dtes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Historial DTE
          </button>
          <button 
            onClick={() => setActiveTab('cert')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'cert' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Certificado & Configuración
          </button>
        </div>
      </div>

      {activeTab === 'cert' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center space-x-3 mb-8 border-b border-slate-100 pb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Certificado Digital</h2>
                <p className="text-xs text-slate-500">Credenciales para firma electrónica</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Estado del Certificado</p>
                  {siiConfig.certificateUploaded ? (
                    <div className="flex items-center mt-2 text-green-600 bg-green-50 w-max px-3 py-1 rounded-full border border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      <span className="text-xs font-bold uppercase tracking-wide">Instalado y Vigente</span>
                    </div>
                  ) : (
                    <div className="flex items-center mt-2 text-red-600 bg-red-50 w-max px-3 py-1 rounded-full border border-red-200">
                      <AlertTriangle className="h-4 w-4 mr-1.5" />
                      <span className="text-xs font-bold uppercase tracking-wide">No instalado</span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center h-full">
                  <label className="cursor-pointer bg-slate-800 text-white text-xs px-4 py-2.5 rounded-lg flex items-center hover:bg-slate-700 hover:shadow-md transition-all font-medium">
                    <Upload className="h-4 w-4 mr-2" />
                    <span>Subir .PFX</span>
                    <input type="file" accept=".pfx,.p12" className="hidden" onChange={handleUploadCert} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">RUT Empresa (Emisor)</label>
                <input type="text" value={siiConfig.rutEmpresa} onChange={e => updateSIIConfig({ rutEmpresa: e.target.value })} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500 text-slate-700 transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Entorno Operativo</label>
                <select value={siiConfig.environment} onChange={e => updateSIIConfig({ environment: e.target.value as 'Certificación' | 'Producción' })} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500 text-slate-700 transition-shadow">
                  <option value="Certificación">Certificación (Pruebas)</option>
                  <option value="Producción">Producción (Real)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center space-x-3 mb-8 border-b border-slate-100 pb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Folios y CAF</h2>
                <p className="text-xs text-slate-500">Autorización de documentos</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Último Folio Boleta Electrónica</label>
                <input type="number" value={siiConfig.lastBoletaFolio} onChange={e => updateSIIConfig({ lastBoletaFolio: Number(e.target.value) })} className="w-full border-slate-200 rounded-xl shadow-inner p-3 border bg-slate-50 text-slate-500 font-mono" readOnly />
                <p className="text-xs text-slate-500 mt-2 flex items-center"><RefreshCw className="w-3 h-3 mr-1" /> Sincronizado automáticamente</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Último Folio Factura Electrónica</label>
                <input type="number" value={siiConfig.lastFacturaFolio} onChange={e => updateSIIConfig({ lastFacturaFolio: Number(e.target.value) })} className="w-full border-slate-200 rounded-xl shadow-inner p-3 border bg-slate-50 text-slate-500 font-mono" readOnly />
              </div>
              
              <div className="pt-6 border-t border-slate-100">
                <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold py-3 rounded-xl transition-all flex justify-center items-center shadow-sm">
                  <RefreshCw className="h-4 w-4 mr-2 text-slate-500" />
                  Solicitar nuevos CAF al SII
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dtes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input type="text" placeholder="Buscar por Folio, Track ID o Tipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
            </div>
            
            {!siiConfig.certificateUploaded && (
              <div className="text-xs text-red-600 bg-red-50 px-4 py-2 rounded-full flex items-center font-medium border border-red-100 shadow-sm">
                <AlertTriangle className="h-4 w-4 mr-2" /> Certificado pendiente. Las emisiones son simuladas.
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Documento</th>
                  <th className="p-4 font-semibold">Folio</th>
                  <th className="p-4 font-semibold">Fecha Emisión</th>
                  <th className="p-4 font-semibold text-right">Monto Total</th>
                  <th className="p-4 font-semibold text-center">Estado SII</th>
                  <th className="p-4 font-semibold">Track ID</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDtes.slice().reverse().map(dte => (
                  <tr key={dte.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${dte.type === 'Factura Electrónica' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-slate-800">{dte.type}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono font-medium">Nº {dte.folio}</td>
                    <td className="p-4 text-slate-500">{dte.date}</td>
                    <td className="p-4 font-bold text-slate-800 text-right">${dte.amount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wide ${
                        dte.status === 'Aceptado SII' ? 'bg-green-100 text-green-700 border border-green-200' :
                        dte.status === 'Rechazado SII' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {dte.status === 'Aceptado SII' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {dte.status === 'Rechazado SII' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {dte.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-500 text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">{dte.trackId}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-slate-400 hover:text-blue-600 p-1.5 rounded bg-white border border-slate-200 hover:border-blue-200 shadow-sm transition-all" title="Ver PDF">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-slate-400 hover:text-emerald-600 p-1.5 rounded bg-white border border-slate-200 hover:border-emerald-200 shadow-sm transition-all" title="Descargar XML">
                          <FileCode2 className="h-4 w-4" />
                        </button>
                        <button className="text-slate-400 hover:text-purple-600 p-1.5 rounded bg-white border border-slate-200 hover:border-purple-200 shadow-sm transition-all" title="Descargar PDF">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDtes.length === 0 && (
              <div className="text-center py-16 text-slate-500 flex flex-col items-center bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">No hay DTEs emitidos aún.</p>
                <p className="text-sm mt-1 text-slate-400">Genera ventas y emite la boleta o factura desde el módulo de Ventas.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SII;