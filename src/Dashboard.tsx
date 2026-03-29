import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import { TrendingUp, Users, Clock, FileText, AlertTriangle, Loader2, RefreshCw, CheckCircle, XCircle, Target } from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div style={{
      background: '#161b22',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: 12, color: '#6e7681', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </p>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {value}
        </p>
        {subtitle && (
          <p style={{ fontSize: 11, color: '#484f58', marginTop: 6 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: '#1c2128',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 12,
  color: '#cdd9e5',
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const accentColor = user?.tenant?.primaryColor || '#3b82f6';

  const { data: kpis, isLoading, refetch } = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => api.get('/analytics/kpis?period=month').then(r => r.data.data),
  });
  const { data: chartData } = useQuery({
    queryKey: ['analytics', 'chart'],
    queryFn: () => api.get('/analytics/sales-chart?months=6').then(r => r.data.data),
  });
  const { data: topClients } = useQuery({
    queryKey: ['analytics', 'top-clients'],
    queryFn: () => api.get('/analytics/top-clients').then(r => r.data.data),
  });
  const { data: quotStats } = useQuery({
    queryKey: ['analytics', 'quotations'],
    queryFn: () => api.get('/analytics/quotations').then(r => r.data.data ?? r.data),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
      <Loader2 className="animate-spin" size={28} color="#3b82f6" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {user?.tenant?.logoUrl && (
            <img src={user.tenant.logoUrl} alt={user.tenant.name}
              style={{ height: 28, objectFit: 'contain', marginBottom: 10, opacity: 0.9 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 4 }}>
            Resumen del mes · {user?.tenant?.name}
          </p>
        </div>
        <button onClick={() => refetch()}
          style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6e7681', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#cdd9e5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6e7681'; }}
          title="Actualizar"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        <KPICard title="Ventas del Mes" value={formatCLP(kpis?.totalRevenue || 0)}
          subtitle={`${kpis?.totalSales || 0} transacciones`}
          icon={TrendingUp} color="#3b82f6" />
        <KPICard title="Clientes Activos" value={kpis?.activeClients || 0}
          subtitle="Clientes con actividad"
          icon={Users} color="#22c55e" />
        <KPICard title="Pagos Pendientes" value={formatCLP(kpis?.pendingAmount || 0)}
          subtitle={`${kpis?.pendingCount || 0} por cobrar`}
          icon={Clock} color="#f59e0b" />
        <KPICard title="Cotizaciones" value={kpis?.quotationsIssued || 0}
          subtitle="Emitidas este mes"
          icon={FileText} color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>

        {/* Area chart */}
        <div style={{
          background: '#161b22', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px 22px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', marginBottom: 18 }}>
            Evolución de Ventas — 6 meses
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData || []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#484f58' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#484f58' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                formatter={(v: any) => [formatCLP(Number(v)), 'Ventas']}
                contentStyle={tooltipStyle}
                cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke={accentColor} fill="url(#grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{
          background: '#161b22', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px 22px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', marginBottom: 18 }}>
            Métodos de Pago
          </p>
          {kpis?.paymentMethods?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={kpis.paymentMethods} dataKey="total" nameKey="method"
                    cx="50%" cy="50%" outerRadius={60} innerRadius={36} strokeWidth={0}>
                    {kpis.paymentMethods.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCLP(Number(v))} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {kpis.paymentMethods.slice(0, 4).map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#6e7681', flex: 1 }}>{m.method}</span>
                    <span style={{ fontSize: 11, color: '#8b949e', fontWeight: 600 }}>{formatCLP(Number(m.total))}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, color: '#484f58', fontSize: 12 }}>
              Sin datos aún
            </div>
          )}
        </div>
      </div>

      {/* Quotation Reports */}
      {quotStats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#8b949e', margin: 0 }}>Reporte de Cotizaciones — 6 meses</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <KPICard title="Total Emitidas" value={quotStats.total} subtitle="Últimos 6 meses" icon={FileText} color="#8b5cf6" />
            <KPICard title="Aprobadas" value={quotStats.approved} subtitle={`Tasa conversión: ${quotStats.conversionRate}%`} icon={CheckCircle} color="#22c55e" />
            <KPICard title="Rechazadas" value={quotStats.rejected} subtitle="Sin conversión" icon={XCircle} color="#ef4444" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Monthly trend chart */}
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 22px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', marginBottom: 18 }}>Evolución Mensual</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={quotStats.monthlyTrend || []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#484f58' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#484f58' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="emitidas" name="Emitidas" fill="#8b5cf666" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aprobadas" name="Aprobadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Top sellers */}
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Target size={15} color="#f59e0b" />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Ranking Vendedores</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(quotStats.topSellers || []).slice(0, 5).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#484f58', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#cdd9e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                      <p style={{ fontSize: 10, color: '#484f58', marginTop: 1 }}>{s.aprobadas}/{s.total} aprobadas</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', flexShrink: 0 }}>${Number(s.monto).toLocaleString('es-CL')}</span>
                  </div>
                ))}
                {(!quotStats.topSellers?.length) && (
                  <p style={{ fontSize: 12, color: '#484f58', textAlign: 'center', padding: '16px 0' }}>Sin datos aún</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Top clients */}
        <div style={{
          background: '#161b22', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px 22px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', marginBottom: 16 }}>Top Clientes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(topClients || []).slice(0, 5).map((c: any, i: number) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#484f58', flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#cdd9e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  <p style={{ fontSize: 10, color: '#484f58', marginTop: 1 }}>{Number(c.salescount)} ventas</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', flexShrink: 0 }}>
                  {formatCLP(Number(c.totalrevenue))}
                </span>
              </div>
            ))}
            {(!topClients || topClients.length === 0) && (
              <p style={{ fontSize: 12, color: '#484f58', textAlign: 'center', padding: '16px 0' }}>
                Sin ventas registradas aún
              </p>
            )}
          </div>
        </div>

        {/* Stock alerts */}
        <div style={{
          background: '#161b22', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={15} color="#f59e0b" />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5', margin: 0 }}>Stock Crítico</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(kpis?.stockAlerts || []).map((p: any) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#cdd9e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 10, color: '#484f58', marginTop: 1 }}>Mín: {p.minstock || p.minStock}</p>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 6,
                  background: 'rgba(248,81,73,0.12)',
                  border: '1px solid rgba(248,81,73,0.2)',
                  fontSize: 11, fontWeight: 700, color: '#f85149', flexShrink: 0, marginLeft: 12,
                }}>
                  {p.stock} uds.
                </span>
              </div>
            ))}
            {(!kpis?.stockAlerts || kpis.stockAlerts.length === 0) && (
              <p style={{ fontSize: 12, color: '#3fb950', textAlign: 'center', padding: '16px 0' }}>
                ✓ Inventario en orden
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
