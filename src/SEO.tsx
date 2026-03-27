import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, Search, Zap, DollarSign, RefreshCw, ExternalLink,
  AlertCircle, CheckCircle, Link2, Link2Off,
} from 'lucide-react';
import api from './api/axios';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────
const S = {
  page: { padding: '0 0 40px' } as React.CSSProperties,
  header: { marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 },
  title: { fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.3px' },
  sub: { fontSize: 13, color: '#6e7681', marginTop: 3 },
  card: {
    background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 20,
  } as React.CSSProperties,
  label: { fontSize: 11, color: '#6e7681', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: 6 },
  big: { fontSize: 28, fontWeight: 700, color: '#f0f6fc' },
  small: { fontSize: 12, color: '#8b949e', marginTop: 4 },
  btn: (accent = '#3b82f6', full = false) => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: accent, color: '#fff', fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
    width: full ? '100%' : 'auto', justifyContent: full ? 'center' : undefined,
  } as React.CSSProperties),
  outline: {
    padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer', background: 'transparent', color: '#cdd9e5', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 6,
  } as React.CSSProperties,
  tab: (active: boolean) => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: active ? '#3b82f6' : '#6e7681', fontSize: 13, fontWeight: active ? 600 : 400,
    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    transition: 'all 0.15s',
  } as React.CSSProperties),
  badge: (color: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}22`, color,
  } as React.CSSProperties),
};

function StatCard({ label, value, sub, icon: Icon, color = '#3b82f6' }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={S.label}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={S.big}>{value}</div>
      {sub && <div style={S.small}>{sub}</div>}
    </div>
  );
}

function PositionBadge({ pos }: { pos: number }) {
  const color = pos <= 3 ? '#3fb950' : pos <= 10 ? '#3b82f6' : pos <= 20 ? '#d29922' : '#6e7681';
  const label = pos <= 3 ? 'Top 3' : pos <= 10 ? 'Top 10' : pos <= 20 ? 'Página 2' : 'Página 3+';
  return <span style={S.badge(color)}>{label}</span>;
}

// ── Setup Screen ──────────────────────────────────────────────────
function SetupScreen({ config, onSiteUrl, onConnect }: {
  config: any; onSiteUrl: (url: string) => void; onConnect: () => void;
}) {
  const [url, setUrl] = useState(config?.siteUrl || 'https://terrablinds.cl/');
  return (
    <div style={{ ...S.card, maxWidth: 520, margin: '60px auto', textAlign: 'center', padding: 40 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <TrendingUp size={24} color="#3b82f6" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc', marginBottom: 8 }}>Módulo SEO Intelligence</h2>
      <p style={{ fontSize: 13, color: '#6e7681', marginBottom: 28, lineHeight: 1.6 }}>
        Conecta tu Google Search Console para ver keywords, posiciones y oportunidades de crecimiento en tiempo real.
      </p>

      {!config?.googleConfigured && (
        <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, padding: 14, marginBottom: 20, textAlign: 'left' }}>
          <p style={{ fontSize: 12, color: '#f85149', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={13} /> Google Client ID no configurado en el servidor.
            Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET al .env del backend.
          </p>
        </div>
      )}

      <div style={{ textAlign: 'left', marginBottom: 16 }}>
        <label style={S.label}>URL del sitio en Search Console</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://tusitio.cl/"
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
              background: '#0d1117', color: '#f0f6fc', fontSize: 13,
            }}
          />
          <button style={S.btn()} onClick={() => onSiteUrl(url)}>Guardar</button>
        </div>
        <p style={{ fontSize: 11, color: '#484f58', marginTop: 6 }}>
          Debe coincidir exactamente con la propiedad en Search Console (incluye https:// y /)
        </p>
      </div>

      <button
        style={{ ...S.btn('#3b82f6', true), opacity: config?.googleConfigured ? 1 : 0.4 }}
        onClick={onConnect}
        disabled={!config?.googleConfigured}
      >
        <Link2 size={14} /> Conectar Google Search Console
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function SEO() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'keywords' | 'quickwins' | 'value'>('overview');

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['seo', 'config'],
    queryFn: () => api.get('/seo/config').then(r => r.data.data),
  });

  const { data: overview } = useQuery({
    queryKey: ['seo', 'overview'],
    queryFn: () => api.get('/seo/overview').then(r => r.data.data),
    enabled: config?.connected,
  });

  const { data: keywords } = useQuery({
    queryKey: ['seo', 'keywords'],
    queryFn: () => api.get('/seo/keywords?limit=100').then(r => r.data.data),
    enabled: config?.connected && tab === 'keywords',
  });

  const { data: quickWins } = useQuery({
    queryKey: ['seo', 'quick-wins'],
    queryFn: () => api.get('/seo/quick-wins').then(r => r.data.data),
    enabled: config?.connected && tab === 'quickwins',
  });

  const { data: valCalc } = useQuery({
    queryKey: ['seo', 'value'],
    queryFn: () => api.get('/seo/value').then(r => r.data.data),
    enabled: config?.connected && tab === 'value',
  });

  const syncMut = useMutation({
    mutationFn: () => api.post('/seo/sync').then(r => r.data.data),
    onSuccess: (data) => {
      toast.success(`Sincronizado: ${data.synced} keywords`);
      qc.invalidateQueries({ queryKey: ['seo'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al sincronizar'),
  });

  const setSiteMut = useMutation({
    mutationFn: (siteUrl: string) => api.post('/seo/config/site', { siteUrl }).then(r => r.data),
    onSuccess: () => { toast.success('URL guardada'); qc.invalidateQueries({ queryKey: ['seo', 'config'] }); },
  });

  const disconnectMut = useMutation({
    mutationFn: () => api.delete('/seo/disconnect').then(r => r.data),
    onSuccess: () => { toast.success('Desconectado'); qc.invalidateQueries({ queryKey: ['seo'] }); },
  });

  const handleConnect = async () => {
    const res = await api.get('/seo/auth-url');
    window.location.href = res.data.data.url;
  };

  if (loadingConfig) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#6e7681' }}>Cargando...</div>;
  }

  if (!config?.connected) {
    return (
      <SetupScreen
        config={config}
        onSiteUrl={(url) => setSiteMut.mutate(url)}
        onConnect={handleConnect}
      />
    );
  }

  const pos = overview?.position ? Number(overview.position).toFixed(1) : '—';
  const ctr = overview?.ctr ? `${(overview.ctr * 100).toFixed(1)}%` : '—';

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>SEO Intelligence</h1>
          <p style={S.sub}>
            {config.siteUrl} · {overview?.dateRange ?? 'Últimos 28 días'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.outline} onClick={() => disconnectMut.mutate()}>
            <Link2Off size={14} /> Desconectar
          </button>
          <button
            style={S.btn('#3b82f6')}
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
          >
            <RefreshCw size={14} style={{ animation: syncMut.isPending ? 'spin 1s linear infinite' : 'none' }} />
            {syncMut.isPending ? 'Sincronizando...' : 'Actualizar datos'}
          </button>
        </div>
      </div>

      {/* Last sync notice */}
      {config.lastSync && (
        <div style={{ marginBottom: 20, fontSize: 12, color: '#484f58', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={12} color="#3fb950" />
          Última sync: {new Date(config.lastSync).toLocaleString('es-CL')}
        </div>
      )}

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Clics totales" value={(overview?.clicks ?? 0).toLocaleString('es-CL')} sub="últimos 28 días" icon={TrendingUp} color="#3fb950" />
        <StatCard label="Impresiones" value={(overview?.impressions ?? 0).toLocaleString('es-CL')} sub="veces que apareciste en Google" icon={Search} color="#3b82f6" />
        <StatCard label="CTR promedio" value={ctr} sub="% que hace clic al verte" icon={ExternalLink} color="#d29922" />
        <StatCard label="Posición media" value={pos} sub="puesto promedio en Google" icon={Zap} color="#bc8cff" />
        <StatCard label="Keywords" value={(overview?.keywords ?? 0).toLocaleString('es-CL')} sub="búsquedas únicas detectadas" icon={Search} color="#58a6ff" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
        {[
          { key: 'overview', label: 'Resumen' },
          { key: 'quickwins', label: '⚡ Quick Wins' },
          { key: 'keywords', label: 'Keywords' },
          { key: 'value', label: '💰 Calculadora' },
        ].map(({ key, label }) => (
          <button key={key} style={S.tab(tab === key)} onClick={() => setTab(key as any)}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div style={{ ...S.card }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0f6fc', marginBottom: 16 }}>Resumen del período</h3>
          {!overview ? (
            <p style={{ color: '#6e7681', fontSize: 13 }}>
              Sin datos aún. Haz clic en <strong>Actualizar datos</strong> para sincronizar desde Search Console.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8b949e', fontSize: 13 }}>Período analizado</span>
                <span style={{ color: '#f0f6fc', fontSize: 13, fontWeight: 600 }}>{overview.dateRange?.replace('_', ' → ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8b949e', fontSize: 13 }}>Total de clics orgánicos</span>
                <span style={{ color: '#3fb950', fontSize: 13, fontWeight: 700 }}>{overview.clicks.toLocaleString('es-CL')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8b949e', fontSize: 13 }}>Total impresiones</span>
                <span style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700 }}>{overview.impressions.toLocaleString('es-CL')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8b949e', fontSize: 13 }}>CTR promedio</span>
                <span style={{ color: '#d29922', fontSize: 13, fontWeight: 700 }}>{(overview.ctr * 100).toFixed(2)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ color: '#8b949e', fontSize: 13 }}>Posición media en Google</span>
                <span style={{ color: '#bc8cff', fontSize: 13, fontWeight: 700 }}>#{Number(overview.position).toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Quick Wins */}
      {tab === 'quickwins' && (
        <div style={S.card}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0f6fc', marginBottom: 4 }}>⚡ Quick Wins — Oportunidades inmediatas</h3>
            <p style={{ fontSize: 12, color: '#6e7681' }}>
              Keywords en posición 11-20 con más de 100 impresiones. Optimizar estas páginas puede duplicar tu tráfico rápidamente.
            </p>
          </div>
          {!quickWins?.length ? (
            <p style={{ color: '#6e7681', fontSize: 13 }}>
              {overview ? 'No hay quick wins detectados en este período.' : 'Sincroniza datos primero.'}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Keyword', 'Posición', 'Impresiones', 'Clics', 'CTR', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quickWins.map((kw: any) => (
                  <tr key={kw.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#f0f6fc', maxWidth: 300 }}>{kw.query}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#d29922' }}>#{Number(kw.position).toFixed(1)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#8b949e' }}>{kw.impressions.toLocaleString('es-CL')}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#3fb950' }}>{kw.clicks}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#6e7681' }}>{(kw.ctr * 100).toFixed(1)}%</td>
                    <td style={{ padding: '10px 12px' }}><PositionBadge pos={kw.position} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Keywords */}
      {tab === 'keywords' && (
        <div style={S.card}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0f6fc' }}>Todas las keywords ({keywords?.total ?? 0})</h3>
          </div>
          {!keywords?.data?.length ? (
            <p style={{ color: '#6e7681', fontSize: 13 }}>Sin datos. Sincroniza desde Search Console primero.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Keyword', 'Posición', 'Clics', 'Impresiones', 'CTR', ''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keywords.data.map((kw: any) => (
                    <tr key={kw.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '9px 12px', fontSize: 13, color: '#f0f6fc', maxWidth: 320 }}>{kw.query}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: kw.position <= 10 ? '#3fb950' : kw.position <= 20 ? '#d29922' : '#6e7681' }}>
                          #{Number(kw.position).toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: 13, color: '#3fb950', fontWeight: 600 }}>{kw.clicks}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, color: '#8b949e' }}>{kw.impressions.toLocaleString('es-CL')}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, color: '#6e7681' }}>{(kw.ctr * 100).toFixed(1)}%</td>
                      <td style={{ padding: '9px 12px' }}><PositionBadge pos={kw.position} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Value Calculator */}
      {tab === 'value' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0f6fc', marginBottom: 16 }}>💰 Valor del tráfico orgánico</h3>
            <p style={{ fontSize: 13, color: '#6e7681', marginBottom: 20, lineHeight: 1.6 }}>
              Cuánto costaría obtener el mismo tráfico comprando anuncios en Google Ads.
              Fórmula: <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: 4 }}>Clics × CPC promedio</code>
            </p>
            {valCalc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 16, background: '#0d1117', borderRadius: 8 }}>
                  <div style={S.label}>Clics orgánicos (28 días)</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{(valCalc.clicks ?? 0).toLocaleString('es-CL')}</div>
                </div>
                <div style={{ padding: 16, background: '#0d1117', borderRadius: 8 }}>
                  <div style={S.label}>CPC estimado industria cortinas (CLP)</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#8b949e' }}>${valCalc.estimatedCpcClp}</div>
                </div>
                <div style={{ padding: 20, background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 10 }}>
                  <div style={S.label}>Ahorro mensual equivalente</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#3fb950' }}>
                    ${(valCalc.savedMonthlyClp ?? 0).toLocaleString('es-CL')} CLP
                  </div>
                  <div style={{ fontSize: 12, color: '#6e7681', marginTop: 6 }}>{valCalc.message}</div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6e7681', fontSize: 13 }}>Sincroniza datos primero para ver el cálculo.</p>
            )}
          </div>

          <div style={S.card}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0f6fc', marginBottom: 16 }}>📊 Proyección anual</h3>
            {valCalc?.savedYearlyClp ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 20, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10 }}>
                  <div style={S.label}>Equivalente anual en Google Ads</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
                    ${(valCalc.savedYearlyClp).toLocaleString('es-CL')} CLP
                  </div>
                  <div style={{ fontSize: 12, color: '#6e7681', marginTop: 6 }}>
                    Si pagaras por este mismo tráfico en anuncios
                  </div>
                </div>
                <div style={{ padding: 16, background: '#0d1117', borderRadius: 8 }}>
                  <div style={S.label}>Próximo objetivo</div>
                  <div style={{ fontSize: 14, color: '#f0f6fc', marginTop: 4 }}>
                    Subir keywords de página 2 a página 1 puede multiplicar x10 el tráfico orgánico.
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button style={S.btn()} onClick={() => setTab('quickwins')}>
                      Ver Quick Wins
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6e7681', fontSize: 13 }}>Datos insuficientes para proyección.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
