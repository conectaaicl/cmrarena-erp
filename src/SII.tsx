import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Upload, FileText, CheckCircle, Search, AlertTriangle, Eye, RefreshCw, Download, FileCode2, Loader2 } from 'lucide-react';
import api from './api/axios';
import toast from 'react-hot-toast';

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

const cardStyle: React.CSSProperties = {
  background: '#161b22',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
};

function SII() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'cert' | 'dtes'>('dtes');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['sii-config'],
    queryFn: () => api.get('/sii/config').then(r => r.data.data ?? r.data),
  });

  const { data: dtesRaw = [], isLoading: dtesLoading } = useQuery({
    queryKey: ['sii-dtes'],
    queryFn: () => api.get('/sii/dtes').then(r => r.data.data ?? r.data),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => api.patch('/sii/config', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sii-config'] });
      toast.success('Configuración SII guardada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar'),
  });

  const handleUploadCert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const password = window.prompt('Ingresa la contraseña del certificado .PFX:');
    if (password === null) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('password', password);

    try {
      await api.post('/sii/certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['sii-config'] });
      toast.success('Certificado digital subido y validado exitosamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir certificado');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const dtes: any[] = Array.isArray(dtesRaw) ? dtesRaw : [];

  const filteredDtes = dtes.filter(dte =>
    String(dte.folio).includes(searchTerm) ||
    (dte.trackId || '').includes(searchTerm) ||
    (dte.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DTE_LABEL: Record<string, string> = {
    BOLETA_ELECTRONICA: 'Boleta Electrónica',
    FACTURA_ELECTRONICA: 'Factura Electrónica',
    NOTA_DE_CREDITO: 'Nota de Crédito',
    NOTA_DE_DEBITO: 'Nota de Débito',
  };

  const DTE_STATUS_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    ENVIADO_SII: 'Enviado SII',
    ACEPTADO_SII: 'Aceptado SII',
    RECHAZADO_SII: 'Rechazado SII',
    ANULADO: 'Anulado',
  };

  const isConfigured = config?.isConfigured;
  const environment = config?.environment === 'PRODUCCION' ? 'Producción' : 'Certificación';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>
            Facturación Electrónica SII
          </h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>
            Ambiente actual:{' '}
            <span style={{ fontWeight: 600, color: environment === 'Producción' ? '#4ade80' : '#fbbf24' }}>
              {configLoading ? '…' : environment}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveTab('dtes')}
            style={{
              padding: '6px 16px', fontSize: 13, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === 'dtes' ? '#161b22' : 'transparent',
              color: activeTab === 'dtes' ? '#f0f6fc' : '#484f58',
            }}
          >
            Historial DTE
          </button>
          <button
            onClick={() => setActiveTab('cert')}
            style={{
              padding: '6px 16px', fontSize: 13, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === 'cert' ? '#161b22' : 'transparent',
              color: activeTab === 'cert' ? '#f0f6fc' : '#484f58',
            }}
          >
            Certificado & Config
          </button>
        </div>
      </div>

      {activeTab === 'cert' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Certificado */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
              <ShieldCheck size={18} color="#60a5fa" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5' }}>Certificado Digital</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#6e7681', marginBottom: 8 }}>Estado del Certificado</p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                background: isConfigured ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${isConfigured ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {isConfigured
                  ? <CheckCircle size={14} color="#4ade80" />
                  : <AlertTriangle size={14} color="#f87171" />
                }
                <span style={{ fontSize: 12, fontWeight: 600, color: isConfigured ? '#4ade80' : '#f87171' }}>
                  {isConfigured ? 'Instalado y Vigente' : 'No instalado'}
                </span>
              </div>
            </div>

            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#21262d', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
              color: '#cdd9e5', cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
            }}>
              {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
              {uploading ? 'Subiendo...' : 'Subir .PFX'}
              <input type="file" accept=".pfx,.p12" style={{ display: 'none' }} onChange={handleUploadCert} disabled={uploading} />
            </label>

            {config?.certExpiresAt && (
              <p style={{ fontSize: 11, color: '#6e7681', marginTop: 12 }}>
                Vence: {new Date(config.certExpiresAt).toLocaleDateString('es-CL')}
              </p>
            )}
          </div>

          {/* Config SII */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
              <FileText size={18} color="#a78bfa" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5' }}>Configuración SII</span>
            </div>

            {configLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Loader2 size={24} color="#3b82f6" className="animate-spin" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>RUT Empresa (Emisor)</label>
                  <input
                    style={inputStyle}
                    defaultValue={config?.rutEmpresa || ''}
                    placeholder="76.123.456-7"
                    onBlur={(e) => {
                      if (e.target.value !== config?.rutEmpresa) {
                        updateConfigMutation.mutate({ rutEmpresa: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Razón Social</label>
                  <input
                    style={inputStyle}
                    defaultValue={config?.razonSocial || ''}
                    placeholder="Mi Empresa SpA"
                    onBlur={(e) => {
                      if (e.target.value !== config?.razonSocial) {
                        updateConfigMutation.mutate({ razonSocial: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Entorno Operativo</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={config?.environment || 'CERTIFICACION'}
                    onChange={(e) => updateConfigMutation.mutate({ environment: e.target.value })}
                  >
                    <option value="CERTIFICACION">Certificación (Pruebas)</option>
                    <option value="PRODUCCION">Producción (Real)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Último Folio Boleta</label>
                    <input style={{ ...inputStyle, color: '#484f58', fontFamily: 'monospace' }} value={config?.lastBoletaFolio ?? 0} readOnly />
                  </div>
                  <div>
                    <label style={labelStyle}>Último Folio Factura</label>
                    <input style={{ ...inputStyle, color: '#484f58', fontFamily: 'monospace' }} value={config?.lastFacturaFolio ?? 0} readOnly />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dtes' && (
        <div style={cardStyle}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <Search size={14} color="#484f58" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar por Folio, Track ID o Tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
            {!isConfigured && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={12} />
                Certificado pendiente — emisiones simuladas
              </div>
            )}
          </div>

          {dtesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 size={28} color="#3b82f6" className="animate-spin" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Documento', 'Folio', 'Fecha', 'Monto Total', 'Estado SII', 'Track ID', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredDtes].reverse().map(dte => {
                    const statusLabel = DTE_STATUS_LABEL[dte.status] || dte.status;
                    const isAceptado = dte.status === 'ACEPTADO_SII';
                    const isRechazado = dte.status === 'RECHAZADO_SII';
                    const statusColor = isAceptado ? '#4ade80' : isRechazado ? '#f87171' : '#fbbf24';
                    const statusBg = isAceptado ? 'rgba(34,197,94,0.1)' : isRechazado ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)';

                    return (
                      <tr key={dte.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ padding: 6, borderRadius: 6, background: dte.type === 'FACTURA_ELECTRONICA' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)' }}>
                              <FileText size={14} color={dte.type === 'FACTURA_ELECTRONICA' ? '#a78bfa' : '#60a5fa'} />
                            </div>
                            <span style={{ fontWeight: 500, color: '#cdd9e5' }}>{DTE_LABEL[dte.type] || dte.type}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#8b949e' }}>Nº {dte.folio}</td>
                        <td style={{ padding: '12px 14px', color: '#6e7681', fontSize: 12 }}>
                          {new Date(dte.date || dte.createdAt).toLocaleDateString('es-CL')}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f0f6fc' }}>
                          ${Number(dte.amount).toLocaleString('es-CL')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            color: statusColor, background: statusBg,
                          }}>
                            {isAceptado && <CheckCircle size={10} />}
                            {isRechazado && <AlertTriangle size={10} />}
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {dte.trackId
                            ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6e7681', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>{dte.trackId}</span>
                            : <span style={{ color: '#484f58', fontSize: 11 }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {dte.pdfUrl && (
                              <a href={dte.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#6e7681', padding: 4 }} title="Ver PDF">
                                <Eye size={14} />
                              </a>
                            )}
                            {dte.xmlContent && (
                              <button
                                onClick={() => {
                                  const blob = new Blob([dte.xmlContent], { type: 'application/xml' });
                                  const a = document.createElement('a');
                                  a.href = URL.createObjectURL(blob);
                                  a.download = `DTE_${dte.folio}.xml`;
                                  a.click();
                                }}
                                style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer', padding: 4 }}
                                title="Descargar XML"
                              >
                                <FileCode2 size={14} />
                              </button>
                            )}
                            {dte.pdfUrl && (
                              <a href={dte.pdfUrl} download style={{ color: '#6e7681', padding: 4 }} title="Descargar PDF">
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredDtes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#484f58' }}>
                  <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>No hay DTEs emitidos aún.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Genera ventas y emite la boleta o factura desde el módulo de Ventas.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SII;
