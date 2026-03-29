import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, Upload, FileText, CheckCircle, Search, AlertTriangle,
  Eye, RefreshCw, Download, FileCode2, Loader2, Receipt, BookOpen,
  ChevronRight, Hash, BarChart3, Info,
} from 'lucide-react';
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
const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: '#fbbf24',
  ENVIADO_SII: '#60a5fa',
  ACEPTADO_SII: '#4ade80',
  RECHAZADO_SII: '#f87171',
  ANULADO: '#6e7681',
};
const STATUS_BG: Record<string, string> = {
  PENDIENTE: 'rgba(251,191,36,0.1)',
  ENVIADO_SII: 'rgba(59,130,246,0.1)',
  ACEPTADO_SII: 'rgba(34,197,94,0.1)',
  RECHAZADO_SII: 'rgba(239,68,68,0.1)',
  ANULADO: 'rgba(110,118,129,0.1)',
};

const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL');

function SII() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'emitir' | 'historial' | 'caf' | 'config'>('emitir');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingCAF, setUploadingCAF] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedType, setSelectedType] = useState<'BOLETA_ELECTRONICA' | 'FACTURA_ELECTRONICA'>('BOLETA_ELECTRONICA');
  const [emitConfirm, setEmitConfirm] = useState<any>(null);
  const [xmlModal, setXmlModal] = useState<string | null>(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['sii-config'],
    queryFn: () => api.get('/sii/config').then(r => r.data.data ?? r.data),
  });
  const { data: dtesRaw = [], isLoading: dtesLoading } = useQuery({
    queryKey: ['sii-dtes'],
    queryFn: () => api.get('/sii/dtes').then(r => r.data.data ?? r.data),
  });
  const { data: pendingSales = [] } = useQuery({
    queryKey: ['sii-pending-sales'],
    queryFn: () => api.get('/sii/dtes/pending-sales').then(r => r.data.data ?? r.data),
    enabled: activeTab === 'emitir',
  });
  const { data: cafs = [] } = useQuery({
    queryKey: ['sii-cafs'],
    queryFn: () => api.get('/sii/cafs').then(r => r.data.data ?? r.data),
    enabled: activeTab === 'caf',
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => api.patch('/sii/config', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sii-config'] }); toast.success('Configuración SII guardada'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar'),
  });

  const emitMutation = useMutation({
    mutationFn: ({ saleId, type }: { saleId: string; type: string }) =>
      api.post('/sii/dtes/emit', { saleId, type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sii-dtes'] });
      qc.invalidateQueries({ queryKey: ['sii-pending-sales'] });
      qc.invalidateQueries({ queryKey: ['sii-config'] });
      setEmitConfirm(null);
      setSelectedSaleId('');
      toast.success('DTE generado y guardado como Pendiente');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al generar DTE'),
  });

  const handleUploadCert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const password = window.prompt('Ingresa la contraseña del certificado .PFX:');
    if (password === null) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('certificate', file);
    fd.append('password', password);
    try {
      await api.post('/sii/certificate', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['sii-config'] });
      toast.success('Certificado digital cargado correctamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir certificado');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const handleUploadCAF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCAF(true);
    const fd = new FormData();
    fd.append('caf', file);
    try {
      const res = await api.post('/sii/caf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['sii-cafs'] });
      const d = res.data.data ?? res.data;
      toast.success(`CAF cargado: ${DTE_LABEL[d.dteType]} Folios ${d.fromFolio}–${d.toFolio} (${d.foliosDisponibles} disponibles)`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir CAF');
    } finally { setUploadingCAF(false); e.target.value = ''; }
  };

  const dtes: any[] = Array.isArray(dtesRaw) ? dtesRaw : [];
  const sales: any[] = Array.isArray(pendingSales) ? pendingSales : [];
  const cafList: any[] = Array.isArray(cafs) ? cafs : [];

  const filteredDtes = dtes.filter(dte =>
    String(dte.folio).includes(searchTerm) ||
    (dte.trackId || '').includes(searchTerm) ||
    (dte.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dte.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isConfigured = config?.isConfigured;
  const environment = config?.environment === 'PRODUCCION' ? 'Producción' : 'Certificación';

  const selectedSale = sales.find(s => s.id === selectedSaleId);

  const TABS = [
    { id: 'emitir', label: 'Emitir DTE', icon: Receipt },
    { id: 'historial', label: 'Historial', icon: BookOpen },
    { id: 'caf', label: 'CAF / Folios', icon: Hash },
    { id: 'config', label: 'Certificado & Config', icon: ShieldCheck },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>
            Facturación Electrónica SII
          </h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>
            Ambiente:{' '}
            <span style={{ fontWeight: 600, color: environment === 'Producción' ? '#4ade80' : '#fbbf24' }}>
              {configLoading ? '…' : environment}
            </span>
            {!isConfigured && <span style={{ marginLeft: 10, color: '#f87171', fontSize: 12 }}>· Certificado pendiente</span>}
          </p>
        </div>

        {/* Pending SII notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 12, color: '#fbbf24', maxWidth: 380 }}>
          <Info size={14} style={{ flexShrink: 0 }} />
          <span>Envío real al SII pendiente — DTEs se generan y guardan como <b>Pendiente</b> hasta tramitar CAF y certificado de producción.</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', gap: 2, width: 'fit-content' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', fontSize: 13, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer',
              background: activeTab === id ? '#161b22' : 'transparent',
              color: activeTab === id ? '#f0f6fc' : '#484f58',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: EMITIR DTE ── */}
      {activeTab === 'emitir' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>

          {/* Sale list */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Ventas sin DTE emitido</p>
              <p style={{ fontSize: 11, color: '#484f58', marginTop: 3 }}>{sales.length} ventas pendientes</p>
            </div>
            {sales.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#484f58' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Todas las ventas tienen DTE</p>
              </div>
            ) : (
              <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                {sales.map(sale => (
                  <div key={sale.id}
                    onClick={() => setSelectedSaleId(sale.id === selectedSaleId ? '' : sale.id)}
                    style={{
                      padding: '12px 18px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      background: selectedSaleId === sale.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                      borderLeft: selectedSaleId === sale.id ? '3px solid #3b82f6' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (selectedSaleId !== sale.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (selectedSaleId !== sale.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc', margin: 0 }}>
                          Venta #{String(sale.number).padStart(4, '0')}
                        </p>
                        <p style={{ fontSize: 11, color: '#6e7681', marginTop: 2 }}>
                          {sale.client?.name} · {formatDate(sale.date)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc', margin: 0 }}>
                          {formatCLP(Number(sale.total))}
                        </p>
                        {selectedSaleId === sale.id && (
                          <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>SELECCIONADA</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emit form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5', marginBottom: 18 }}>
                Generar DTE
              </p>

              {!selectedSaleId ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#484f58' }}>
                  <ChevronRight size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p style={{ fontSize: 12 }}>Selecciona una venta de la lista</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Selected sale summary */}
                  <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <p style={{ fontSize: 12, color: '#8b949e', margin: '0 0 4px' }}>Venta seleccionada</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc', margin: 0 }}>
                      #{String(selectedSale?.number).padStart(4, '0')} · {selectedSale?.client?.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#60a5fa', marginTop: 2 }}>
                      {formatCLP(Number(selectedSale?.total))}
                    </p>
                  </div>

                  <div>
                    <label style={labelStyle}>Tipo de Documento</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={selectedType}
                      onChange={e => setSelectedType(e.target.value as any)}
                    >
                      <option value="BOLETA_ELECTRONICA">Boleta Electrónica (Tipo 39)</option>
                      <option value="FACTURA_ELECTRONICA">Factura Electrónica (Tipo 33)</option>
                    </select>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: 11, color: '#fbbf24', lineHeight: 1.5 }}>
                    El DTE se guardará como <b>Pendiente</b>. El envío al SII se habilitará una vez tramitados el CAF y el certificado digital en producción.
                  </div>

                  <button
                    onClick={() => setEmitConfirm({ saleId: selectedSaleId, type: selectedType, sale: selectedSale })}
                    disabled={emitMutation.isPending}
                    style={{
                      padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      opacity: emitMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {emitMutation.isPending ? 'Generando…' : 'Generar DTE'}
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <BarChart3 size={15} color="#8b5cf6" />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Resumen DTEs</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(DTE_STATUS_LABEL).map(([status, label]) => {
                  const count = dtes.filter(d => d.status === status).length;
                  return (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6e7681' }}>{label}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                        color: STATUS_COLOR[status] || '#8b949e',
                        background: STATUS_BG[status] || 'rgba(139,148,158,0.1)',
                      }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {activeTab === 'historial' && (
        <div style={cardStyle}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <Search size={14} color="#484f58" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Buscar por Folio, Cliente o Tipo..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <p style={{ fontSize: 12, color: '#484f58', flexShrink: 0 }}>{filteredDtes.length} documentos</p>
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
                    {['Documento', 'Cliente', 'Folio', 'Fecha', 'Neto', 'IVA', 'Total', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDtes.map(dte => (
                    <tr key={dte.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ padding: 6, borderRadius: 6, background: dte.type === 'FACTURA_ELECTRONICA' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)' }}>
                            <FileText size={14} color={dte.type === 'FACTURA_ELECTRONICA' ? '#a78bfa' : '#60a5fa'} />
                          </div>
                          <span style={{ fontWeight: 500, color: '#cdd9e5', whiteSpace: 'nowrap' }}>{DTE_LABEL[dte.type] || dte.type}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <p style={{ fontSize: 12, color: '#cdd9e5', margin: 0 }}>{dte.client?.name}</p>
                        <p style={{ fontSize: 10, color: '#484f58', marginTop: 1 }}>{dte.client?.rut}</p>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#8b949e' }}>Nº {dte.folio}</td>
                      <td style={{ padding: '12px 14px', color: '#6e7681', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {formatDate(dte.date || dte.createdAt)}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#8b949e', fontSize: 12 }}>{formatCLP(Number(dte.netAmount))}</td>
                      <td style={{ padding: '12px 14px', color: '#8b949e', fontSize: 12 }}>{formatCLP(Number(dte.taxAmount))}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f0f6fc' }}>{formatCLP(Number(dte.amount))}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          color: STATUS_COLOR[dte.status] || '#8b949e',
                          background: STATUS_BG[dte.status] || 'rgba(139,148,158,0.1)',
                          whiteSpace: 'nowrap',
                        }}>
                          {dte.status === 'ACEPTADO_SII' && <CheckCircle size={10} />}
                          {dte.status === 'RECHAZADO_SII' && <AlertTriangle size={10} />}
                          {DTE_STATUS_LABEL[dte.status] || dte.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {dte.xmlContent && (
                            <button
                              onClick={() => setXmlModal(dte.xmlContent)}
                              style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer', padding: 4 }}
                              title="Ver XML"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          {dte.xmlContent && (
                            <button
                              onClick={() => {
                                const blob = new Blob([dte.xmlContent], { type: 'application/xml' });
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = `DTE_${dte.type}_${dte.folio}.xml`;
                                a.click();
                              }}
                              style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer', padding: 4 }}
                              title="Descargar XML"
                            >
                              <FileCode2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDtes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#484f58' }}>
                  <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>No hay DTEs emitidos aún.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CAF / FOLIOS ── */}
      {activeTab === 'caf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Upload CAF */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Código de Autorización de Folios (CAF)</p>
                <p style={{ fontSize: 12, color: '#484f58', marginTop: 4 }}>
                  Archivos XML otorgados por el SII que autorizan rangos de folios por tipo de documento.
                </p>
              </div>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#21262d', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
                color: '#cdd9e5', cursor: uploadingCAF ? 'not-allowed' : 'pointer',
                opacity: uploadingCAF ? 0.6 : 1, flexShrink: 0,
              }}>
                {uploadingCAF ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                {uploadingCAF ? 'Procesando...' : 'Subir CAF (.xml)'}
                <input type="file" accept=".xml" style={{ display: 'none' }} onChange={handleUploadCAF} disabled={uploadingCAF} />
              </label>
            </div>

            {/* CAF Table */}
            {cafList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#484f58', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                <Hash size={32} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
                <p style={{ fontSize: 13 }}>No hay CAFs cargados</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Solicita los archivos CAF en el portal del SII (sii.cl) y súbelos aquí.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Tipo DTE', 'Folios', 'Disponibles', 'Usado %', 'Fecha Autorización', 'Vence'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cafList.map((caf: any) => {
                    const isLow = caf.foliosDisponibles < 50;
                    const isEmpty = caf.foliosDisponibles <= 0;
                    return (
                      <tr key={caf.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.12)', fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>
                            {DTE_LABEL[caf.dteType] || caf.dteType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#8b949e', fontSize: 12 }}>
                          {caf.fromFolio.toLocaleString()} – {caf.toFolio.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 700, color: isEmpty ? '#f87171' : isLow ? '#fbbf24' : '#4ade80' }}>
                            {caf.foliosDisponibles.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 11, color: '#484f58' }}> / {caf.foliosTotal.toLocaleString()}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ width: '100%', maxWidth: 120, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${caf.porcentajeUsado}%`, borderRadius: 3, background: caf.porcentajeUsado > 80 ? '#f87171' : caf.porcentajeUsado > 60 ? '#fbbf24' : '#4ade80' }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#484f58' }}>{caf.porcentajeUsado}%</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#6e7681', fontSize: 12 }}>
                          {caf.issuedAt ? formatDate(caf.issuedAt) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#6e7681', fontSize: 12 }}>
                          {caf.expiresAt ? formatDate(caf.expiresAt) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Folio counters */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', marginBottom: 14 }}>Contadores de Folios en Uso</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Boleta Electrónica', value: config?.lastBoletaFolio ?? 0, color: '#60a5fa' },
                { label: 'Factura Electrónica', value: config?.lastFacturaFolio ?? 0, color: '#a78bfa' },
                { label: 'Nota de Crédito', value: config?.lastNCreditoFolio ?? 0, color: '#4ade80' },
                { label: 'Nota de Débito', value: config?.lastNDebitoFolio ?? 0, color: '#fbbf24' },
              ].map(item => (
                <div key={item.label} style={{ padding: '14px 16px', borderRadius: 10, background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, color: '#484f58', fontWeight: 500, margin: '0 0 8px' }}>{item.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: item.color, margin: 0, fontFamily: 'monospace' }}>
                    {configLoading ? '…' : item.value.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 10, color: '#484f58', marginTop: 4 }}>Último folio usado</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CONFIG ── */}
      {activeTab === 'config' && (
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
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
                background: isConfigured ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${isConfigured ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {isConfigured ? <CheckCircle size={14} color="#4ade80" /> : <AlertTriangle size={14} color="#f87171" />}
                <span style={{ fontSize: 12, fontWeight: 600, color: isConfigured ? '#4ade80' : '#f87171' }}>
                  {isConfigured ? 'Instalado y Vigente' : 'No instalado'}
                </span>
              </div>
            </div>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#21262d', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
              color: '#cdd9e5', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1,
            }}>
              {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
              {uploading ? 'Subiendo...' : 'Subir .PFX'}
              <input type="file" accept=".pfx,.p12" style={{ display: 'none' }} onChange={handleUploadCert} disabled={uploading} />
            </label>
            {config?.certExpiresAt && (
              <p style={{ fontSize: 11, color: '#6e7681', marginTop: 12 }}>
                Vence: {formatDate(config.certExpiresAt)}
              </p>
            )}
          </div>

          {/* Config SII */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
              <FileText size={18} color="#a78bfa" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5' }}>Datos del Emisor</span>
            </div>
            {configLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Loader2 size={24} color="#3b82f6" className="animate-spin" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'rutEmpresa', label: 'RUT Empresa (Emisor)', placeholder: '76.123.456-7' },
                  { key: 'razonSocial', label: 'Razón Social', placeholder: 'Mi Empresa SpA' },
                  { key: 'giroComercial', label: 'Giro Comercial', placeholder: 'Comercio al por menor' },
                  { key: 'direccion', label: 'Dirección', placeholder: 'Av. Principal 123' },
                  { key: 'comuna', label: 'Comuna', placeholder: 'Santiago' },
                  { key: 'resolutionNumber', label: 'N° Resolución SII', placeholder: '123456' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      style={inputStyle}
                      defaultValue={config?.[key] || ''}
                      placeholder={placeholder}
                      onBlur={e => {
                        if (e.target.value !== (config?.[key] || '')) {
                          updateConfigMutation.mutate({ [key]: e.target.value });
                        }
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Entorno Operativo</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={config?.environment || 'CERTIFICACION'}
                    onChange={e => updateConfigMutation.mutate({ environment: e.target.value })}
                  >
                    <option value="CERTIFICACION">Certificación (Pruebas)</option>
                    <option value="PRODUCCION">Producción (Real)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONFIRM EMIT MODAL ── */}
      {emitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#161b22', borderRadius: 14, padding: 28, width: 400, border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#f0f6fc', margin: '0 0 8px' }}>Confirmar Emisión DTE</p>
            <p style={{ fontSize: 13, color: '#6e7681', marginBottom: 20 }}>
              Se generará el XML del {DTE_LABEL[emitConfirm.type]} para la venta:
            </p>
            <div style={{ padding: '12px 16px', borderRadius: 8, background: '#0d1117', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>
                Venta #{String(emitConfirm.sale?.number).padStart(4, '0')}
              </p>
              <p style={{ fontSize: 12, color: '#6e7681', marginTop: 4 }}>{emitConfirm.sale?.client?.name}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginTop: 6 }}>
                {formatCLP(Number(emitConfirm.sale?.total))}
              </p>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: 11, color: '#fbbf24', marginBottom: 20 }}>
              El DTE quedará en estado <b>Pendiente</b> hasta tramitar el envío con el SII.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setEmitConfirm(null)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8b949e', fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => emitMutation.mutate({ saleId: emitConfirm.saleId, type: emitConfirm.type })}
                disabled={emitMutation.isPending}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {emitMutation.isPending ? 'Generando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── XML VIEWER MODAL ── */}
      {xmlModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#161b22', borderRadius: 14, padding: 24, width: '100%', maxWidth: 720, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Contenido XML del DTE</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { const blob = new Blob([xmlModal], { type: 'application/xml' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'DTE.xml'; a.click(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: '#21262d', color: '#cdd9e5', fontSize: 12, cursor: 'pointer' }}
                >
                  <Download size={13} /> Descargar
                </button>
                <button onClick={() => setXmlModal(null)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>
                  Cerrar
                </button>
              </div>
            </div>
            <pre style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11, color: '#8b949e', background: '#0d1117', borderRadius: 8, padding: 16, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {xmlModal}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default SII;
