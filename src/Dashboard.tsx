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
const formatCLP = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');

const CARD = { background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 } as React.CSSProperties;

const KPI_DEF = [
  { key: 'revenue', title: 'Ventas del Mes',    icon: TrendingUp, color: '#8b5cf6', grad: 'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(99,102,241,0.06))' },
  { key: 'clients', title: 'Clientes Activos',   icon: Users,      color: '#10b981', grad: 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.06))'  },
  { key: 'pending', title: 'Pagos Pendientes',   icon: Clock,      color: '#f59e0b', grad: 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(217,119,6,0.06))'  },
  { key: 'quotes',  title: 'Cotizaciones',        icon: FileText,   color: '#ef4444', grad: 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(220,38,38,0.06))'   },
];

function KPICard({ title, value, subtitle, icon: Icon, color, grad }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; grad: string;
}) {
  return (
    <div style={{ position: 'relative', borderRadius: 16, padding: '20px 22px', overflow: 'hidden', background: grad, border: '1px solid ' + color + '22' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: color, filter: 'blur(28px)', opacity: 0.18, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ padding: 8, borderRadius: 10, background: color + '20' }}>
          <Icon size={17} color={color} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: color + '15', color, border: '1px solid ' + color + '30' }}>LIVE</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

const tooltipStyle = { background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#e2e8f0' };

export default function Dashboard() {
  const { user } = useAuthStore();

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos dias' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.firstName || 'Usuario';
  const initials = (user?.firstName?.charAt(0) ?? '') + (user?.lastName?.charAt(0) ?? '');

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
      <Loader2 className="animate-spin" size={28} color="#8b5cf6" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Hero header */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '20px 24px', background: 'linear-gradient(135deg,#0f0f24 0%,#0d0d1f 60%,#0a0a18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 240, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,#7c3aed,transparent)', filter: 'blur(40px)', opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,#10b981,transparent)', filter: 'blur(40px)', opacity: 0.08, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 24px rgba(124,58,237,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>{greeting}, {firstName}</p>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                {user?.tenant?.name || 'ERP ConectaAI'}
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, fontWeight: 500, color: '#34d399' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Sistema activo
            </div>
            <button onClick={() => refetch()}
              style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}
              title="Actualizar"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
        <KPICard title={KPI_DEF[0].title} value={formatCLP(kpis?.totalRevenue || 0)}
          subtitle={(kpis?.totalSales || 0) + ' transacciones'}
          icon={KPI_DEF[0].icon} color={KPI_DEF[0].color} grad={KPI_DEF[0].grad} />
        <KPICard title={KPI_DEF[1].title} value={kpis?.activeClients || 0}
          subtitle="Con actividad reciente"
          icon={KPI_DEF[1].icon} color={KPI_DEF[1].color} grad={KPI_DEF[1].grad} />
        <KPICard title={KPI_DEF[2].title} value={formatCLP(kpis?.pendingAmount || 0)}
          subtitle={(kpis?.pendingCount || 0) + ' por cobrar'}
          icon={KPI_DEF[2].icon} color={KPI_DEF[2].color} grad={KPI_DEF[2].grad} />
        <KPICard title={KPI_DEF[3].title} value={kpis?.quotationsIssued || 0}
          subtitle="Emitidas este mes"
          icon={KPI_DEF[3].icon} color={KPI_DEF[3].color} grad={KPI_DEF[3].grad} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        <div style={{ ...CARD, padding: '20px 22px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 18 }}>Evolución de Ventas — 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData || []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v: any) => [formatCLP(Number(v)), 'Ventas']} contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...CARD, padding: '20px 22px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 18 }}>Metodos de Pago</p>
          {kpis?.paymentMethods?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={kpis.paymentMethods} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={60} innerRadius={36} strokeWidth={0}>
                    {kpis.paymentMethods.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCLP(Number(v))} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {kpis.paymentMethods.slice(0, 4).map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#475569', flex: 1 }}>{m.method}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{formatCLP(Number(m.total))}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, color: '#334155', fontSize: 12 }}>Sin datos aun</div>
          )}
        </div>
      </div>

      {/* Quotation stats */}
      {quotStats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: 0 }}>Reporte de Cotizaciones — 6 meses</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <KPICard title="Total Emitidas" value={quotStats.total} subtitle="Ultimos 6 meses" icon={FileText} color="#8b5cf6" grad="linear-gradient(135deg,rgba(139,92,246,0.18),rgba(99,102,241,0.06))" />
            <KPICard title="Aprobadas" value={quotStats.approved} subtitle={'Tasa: ' + quotStats.conversionRate + '%'} icon={CheckCircle} color="#10b981" grad="linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.06))" />
            <KPICard title="Rechazadas" value={quotStats.rejected} subtitle="Sin conversion" icon={XCircle} color="#ef4444" grad="linear-gradient(135deg,rgba(239,68,68,0.18),rgba(220,38,38,0.06))" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ ...CARD, padding: '20px 22px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 18 }}>Evolucion Mensual</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={quotStats.monthlyTrend || []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="emitidas" name="Emitidas" fill="#8b5cf666" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aprobadas" name="Aprobadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...CARD, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Target size={14} color="#f59e0b" />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Ranking Vendedores</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(quotStats.topSellers || []).slice(0, 5).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#334155', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                      <p style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>{s.aprobadas}/{s.total} aprobadas</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', flexShrink: 0 }}>${Number(s.monto).toLocaleString('es-CL')}</span>
                  </div>
                ))}
                {!quotStats.topSellers?.length && <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', padding: '16px 0' }}>Sin datos aun</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...CARD, padding: '20px 22px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Top Clientes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(topClients || []).slice(0, 5).map((c: any, i: number) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#334155', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  <p style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>{Number(c.salescount)} ventas</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', flexShrink: 0 }}>{formatCLP(Number(c.totalrevenue))}</span>
              </div>
            ))}
            {(!topClients || topClients.length === 0) && <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', padding: '16px 0' }}>Sin ventas registradas aun</p>}
          </div>
        </div>

        <div style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Stock Critico</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(kpis?.stockAlerts || []).map((p: any) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>Min: {p.minstock || p.minStock}</p>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 7, background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.2)', fontSize: 11, fontWeight: 700, color: '#f87171', flexShrink: 0, marginLeft: 12 }}>
                  {p.stock} uds.
                </span>
              </div>
            ))}
            {(!kpis?.stockAlerts || kpis.stockAlerts.length === 0) && (
              <p style={{ fontSize: 12, color: '#22c55e', textAlign: 'center', padding: '16px 0' }}>Inventario en orden</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
