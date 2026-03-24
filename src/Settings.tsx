import React, { useState } from 'react';
import { useStore } from './store';
import { Settings as SettingsIcon, Save, Globe, Palette, Percent, Mail, Upload, Image as ImageIcon } from 'lucide-react';

function Settings() {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    alert('Configuración actualizada. Los cambios se aplicaron en todo el sistema.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <SettingsIcon className="h-8 w-8 text-gray-800" />
        <h1 className="text-2xl font-bold text-gray-800">Configuración Multi-Tenant</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Marca Blanca y Facturación</h2>
          <p className="text-sm text-gray-500 mt-1">
            Personaliza la apariencia y el comportamiento del ERP para tu empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Información General */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center border-b pb-2">
                <Globe className="h-4 w-4 mr-2 text-gray-400" />
                Información de la Empresa
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa</label>
                <div className="flex items-center space-x-4">
                  {formData.logo ? (
                    <div className="relative h-16 w-16 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                      <img src={formData.logo} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-gray-50 rounded-lg border border-gray-200 border-dashed flex items-center justify-center text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                    <span className="flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Subir logo</span>
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: null })}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Comercial</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Dominio o Subdominio SaaS</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Apariencia y Contabilidad */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center border-b pb-2">
                <Palette className="h-4 w-4 mr-2 text-gray-400" />
                Personalización
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">Color Primario (Marca Blanca)</label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-10 w-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div className="pt-2">
                <h3 className="font-medium text-gray-900 flex items-center border-b pb-2 mb-4">
                  <Percent className="h-4 w-4 mr-2 text-gray-400" />
                  Reglas Fiscales
                </h3>
                <label className="block text-sm font-medium text-gray-700">Tasa de Impuesto (IVA) %</label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">Este valor se usará para calcular automáticamente cotizaciones y ventas.</p>
              </div>
            </div>

            {/* Integraciones */}
            <div className="md:col-span-2 space-y-4 pt-4 border-t">
              <h3 className="font-medium text-gray-900 flex items-center border-b pb-2">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                Integraciones y Webhooks
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Resend API Key (Para envío de cotizaciones)</label>
                <input
                  type="password"
                  value={formData.resendApiKey}
                  onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
                  placeholder="re_..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 text-white px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <Save size={18} />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;