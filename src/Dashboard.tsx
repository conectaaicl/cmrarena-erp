import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, FileText, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';

const PAYMENT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

function KPICard({ title, value, subtitle, icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const primaryColor = user?.tenant?.primaryColor || '#3b82f6';

  const { data: kpis, isLoading, refetch } = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => api.get('/analytics/kpis?period=month').then((r) => r.data.data),
  });

  const { data: chartData } = useQuery({
    queryKey: ['analytics', 'chart'],
    queryFn: () => api.get('/analytics/sales-chart?months=6').then((r) => r.data.data),
  });

  const { data: topClients } = useQuery({
    queryKey: ['analytics', 'top-clients'],
    queryFn: () => api.get('/analytics/top-clients').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {user?.tenant?.logoUrl && (
            <img src={user.tenant.logoUrl} alt={user.tenant.name} className="h-10 object-contain mb-2"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Resumen del mes actual · {user?.tenant?.name}</p>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition" title="Actualizar">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard title="Ventas del Mes" value={formatCLP(kpis?.totalRevenue || 0)} subtitle={`${kpis?.totalSales || 0} transacciones`} icon={<TrendingUp className="w-6 h-6 text-blue-600" />} color="bg-blue-50" />
        <KPICard title="Clientes Activos" value={kpis?.activeClients || 0} subtitle="Sin clientes perdidos" icon={<Users className="w-6 h-6 text-green-600" />} color="bg-green-50" />
        <KPICard title="Pagos Pendientes" value={formatCLP(kpis?.pendingAmount || 0)} subtitle={`${kpis?.pendingCount || 0} ventas por cobrar`} icon={<Clock className="w-6 h-6 text-orange-500" />} color="bg-orange-50" />
        <KPICard title="Cotizaciones Emitidas" value={kpis?.quotationsIssued || 0} subtitle="Este mes" icon={<FileText className="w-6 h-6 text-purple-600" />} color="bg-purple-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Evolución de Ventas (6 meses)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: any) => [formatCLP(Number(v)), 'Ventas']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Area type="monotone" dataKey="revenue" stroke={primaryColor} fill="url(#grad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Métodos de Pago</h2>
          {kpis?.paymentMethods?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={kpis.paymentMethods} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={70}>
                  {kpis.paymentMethods.map((_: any, i: number) => (
                    <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCLP(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Sin datos aún</div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Clientes</h2>
          <div className="space-y-3">
            {(topClients || []).slice(0, 5).map((c: any, i: number) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{Number(c.salescount)} ventas</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-700">{formatCLP(Number(c.totalrevenue))}</span>
              </div>
            ))}
            {(!topClients || topClients.length === 0) && <p className="text-sm text-slate-400 text-center py-4">Sin ventas registradas aún</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-slate-800">Stock Crítico</h2>
          </div>
          <div className="space-y-3">
            {(kpis?.stockAlerts || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">Mínimo: {p.minstock || p.minStock}</p>
                </div>
                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg">{p.stock} uds.</span>
              </div>
            ))}
            {(!kpis?.stockAlerts || kpis.stockAlerts.length === 0) && <p className="text-sm text-green-600 text-center py-4">Todo el inventario en orden</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
