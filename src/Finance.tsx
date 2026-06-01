import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? '';

function fmtCLP(n: number) {
  const abs = Math.abs(Math.round(n));
  const str = '$' + abs.toLocaleString('es-CL');
  return n < 0 ? `(${str})` : str;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + '18', color, borderRadius: 20,
      padding: '2px 10px', fontSize: 11, fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

// ─── Seed Banner ─────────────────────────────────────────────────────────────

function SeedBanner({ onSeed }: { onSeed: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderRadius: 12, padding: '16px 20px', marginBottom: 24,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Plan de Cuentas no inicializado</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
          Inicializa el plan de cuentas IFRS Chile para comenzar con la contabilidad
        </div>
      </div>
      <button onClick={onSeed} style={{
        background: '#fff', color: '#6366f1', border: 'none', borderRadius: 8,
        padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
      }}>
        Inicializar →
      </button>
    </div>
  );
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────

function BalanceSheet({ data }: { data: any }) {
  if (!data) return <div style={{ color: '#9ca3af', padding: 20 }}>Sin datos</div>;

  const Section = ({ title, items, color }: { title: string; items: any[]; color: string }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      {items.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
          <span style={{ color: '#374151' }}>{item.code} — {item.name}</span>
          <span style={{ fontWeight: 600, color: '#111' }}>{fmtCLP(Number(item.balance))}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 800, fontSize: 13 }}>
        <span style={{ color }}>Total {title}</span>
        <span style={{ color }}>{fmtCLP(items.reduce((s: number, i: any) => s + Number(i.balance), 0))}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#111', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e5e7eb' }}>ACTIVOS</div>
        <Section title="Activo Corriente" items={data.assets?.filter((a: any) => a.subtype === 'CURRENT') ?? []} color="#059669" />
        <Section title="Activo No Corriente" items={data.assets?.filter((a: any) => a.subtype !== 'CURRENT') ?? []} color="#0d9488" />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#111', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e5e7eb' }}>PASIVOS Y PATRIMONIO</div>
        <Section title="Pasivos" items={data.liabilities ?? []} color="#ef4444" />
        <Section title="Patrimonio" items={data.equity ?? []} color="#6366f1" />
      </div>
    </div>
  );
}

// ─── Income Statement ─────────────────────────────────────────────────────────

function IncomeStatement({ data }: { data: any }) {
  if (!data) return <div style={{ color: '#9ca3af', padding: 20 }}>Sin datos</div>;

  const revenue = data.revenue ?? [];
  const expenses = data.expenses ?? [];
  const totalRevenue = revenue.reduce((s: number, i: any) => s + Number(i.total), 0);
  const totalExpenses = expenses.reduce((s: number, i: any) => s + Number(i.total), 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Revenue */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Ingresos</div>
        {revenue.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
            <span style={{ color: '#374151' }}>{item.name}</span>
            <span style={{ fontWeight: 600, color: '#059669' }}>{fmtCLP(Number(item.total))}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 800, fontSize: 14, borderTop: '2px solid #e5e7eb', marginTop: 4 }}>
          <span>Total Ingresos</span>
          <span style={{ color: '#059669' }}>{fmtCLP(totalRevenue)}</span>
        </div>
      </div>

      {/* Expenses */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Gastos</div>
        {expenses.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
            <span style={{ color: '#374151' }}>{item.name}</span>
            <span style={{ fontWeight: 600, color: '#ef4444' }}>{fmtCLP(Number(item.total))}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 800, fontSize: 14, borderTop: '2px solid #e5e7eb', marginTop: 4 }}>
          <span>Total Gastos</span>
          <span style={{ color: '#ef4444' }}>{fmtCLP(totalExpenses)}</span>
        </div>
      </div>

      {/* Net Income */}
      <div style={{
        background: netIncome >= 0 ? '#ecfdf5' : '#fef2f2',
        border: `2px solid ${netIncome >= 0 ? '#6ee7b7' : '#fca5a5'}`,
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#111' }}>
          {netIncome >= 0 ? '✅' : '⚠️'} Resultado del Período
        </span>
        <span style={{ fontWeight: 900, fontSize: 22, color: netIncome >= 0 ? '#059669' : '#ef4444' }}>
          {fmtCLP(netIncome)}
        </span>
      </div>
    </div>
  );
}

// ─── General Ledger ───────────────────────────────────────────────────────────

function GeneralLedger({ data }: { data: any[] }) {
  const [filter, setFilter] = useState('');
  const filtered = (data ?? []).filter(e =>
    !filter || e.description?.toLowerCase().includes(filter.toLowerCase()) || e.reference?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="Buscar por descripción o referencia..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            width: '100%', maxWidth: 360, padding: '8px 12px', borderRadius: 8,
            border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📒</div>
          <div>Sin asientos contables registrados</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Los asientos se crean automáticamente con cada venta y cobro</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {filtered.map((entry: any) => (
            <div key={entry.id} style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              {/* Entry header */}
              <div style={{ background: '#f9fafb', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{entry.description}</span>
                  {entry.reference && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>#{entry.reference}</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(entry.date)}</span>
                  <Badge label={entry.isPosted ? 'Contabilizado' : 'Borrador'} color={entry.isPosted ? '#059669' : '#f59e0b'} />
                </div>
              </div>
              {/* Lines */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '6px 14px', color: '#9ca3af', fontWeight: 600, fontSize: 11 }}>Cuenta</th>
                    <th style={{ textAlign: 'right', padding: '6px 14px', color: '#9ca3af', fontWeight: 600, fontSize: 11 }}>Débito</th>
                    <th style={{ textAlign: 'right', padding: '6px 14px', color: '#9ca3af', fontWeight: 600, fontSize: 11 }}>Crédito</th>
                  </tr>
                </thead>
                <tbody>
                  {(entry.lines ?? []).map((line: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '7px 14px', color: '#374151' }}>
                        {line.account?.code} — {line.account?.name}
                      </td>
                      <td style={{ padding: '7px 14px', textAlign: 'right', color: Number(line.debit) > 0 ? '#111' : '#d1d5db', fontWeight: Number(line.debit) > 0 ? 600 : 400 }}>
                        {Number(line.debit) > 0 ? fmtCLP(Number(line.debit)) : '—'}
                      </td>
                      <td style={{ padding: '7px 14px', textAlign: 'right', color: Number(line.credit) > 0 ? '#111' : '#d1d5db', fontWeight: Number(line.credit) > 0 ? 600 : 400 }}>
                        {Number(line.credit) > 0 ? fmtCLP(Number(line.credit)) : '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <td style={{ padding: '7px 14px', fontWeight: 700, fontSize: 13 }}>TOTALES</td>
                    <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 800, color: '#111' }}>
                      {fmtCLP((entry.lines ?? []).reduce((s: number, l: any) => s + Number(l.debit), 0))}
                    </td>
                    <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 800, color: '#111' }}>
                      {fmtCLP((entry.lines ?? []).reduce((s: number, l: any) => s + Number(l.credit), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AR Aging ─────────────────────────────────────────────────────────────────

function ARAgingReport({ data }: { data: any }) {
  if (!data) return <div style={{ color: '#9ca3af', padding: 20 }}>Sin datos</div>;

  const buckets = [
    { key: 'current', label: 'Al día', color: '#10b981' },
    { key: 'days_30', label: '1–30 días', color: '#f59e0b' },
    { key: 'days_60', label: '31–60 días', color: '#ef4444' },
    { key: 'days_90', label: '61–90 días', color: '#b91c1c' },
    { key: 'over_90', label: '+90 días', color: '#7f1d1d' },
  ];

  const total = buckets.reduce((s, b) => s + Number((data.summary ?? {})[b.key] ?? 0), 0);

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {buckets.map(b => {
          const amount = Number((data.summary ?? {})[b.key] ?? 0);
          const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
          return (
            <div key={b.key} style={{
              flex: '1 1 140px', background: '#fff', border: `2px solid ${b.color}30`,
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.label}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: amount > 0 ? b.color : '#d1d5db', margin: '6px 0' }}>
                {fmtCLP(amount)}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{pct}% del total</div>
              {/* Mini progress bar */}
              <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: '#f3f4f6' }}>
                <div style={{ height: '100%', borderRadius: 2, background: b.color, width: `${pct}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail table */}
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 10 }}>Detalle de Cuentas por Cobrar</div>
      {(data.items ?? []).length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: 30 }}>Sin cuentas por cobrar pendientes 🎉</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              {['Cliente', 'Factura', 'Fecha', 'Días', 'Monto', 'Estado'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.items ?? []).map((item: any, i: number) => {
              const days = item.daysOverdue ?? 0;
              const color = days === 0 ? '#10b981' : days <= 30 ? '#f59e0b' : days <= 60 ? '#ef4444' : '#7f1d1d';
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111' }}>{item.clientName}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>#{item.reference}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{fmtDate(item.date)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color, fontWeight: 700 }}>{days === 0 ? 'Vigente' : `${days}d`}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#111' }}>{fmtCLP(Number(item.amount))}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge label={item.paymentStatus} color={color} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Chart of Accounts ────────────────────────────────────────────────────────

function ChartOfAccounts({ data }: { data: any[] }) {
  const typeColor: Record<string, string> = {
    ASSET: '#059669', LIABILITY: '#ef4444', EQUITY: '#6366f1',
    REVENUE: '#0ea5e9', EXPENSE: '#f59e0b',
  };
  const typeLabel: Record<string, string> = {
    ASSET: 'Activo', LIABILITY: 'Pasivo', EQUITY: 'Patrimonio',
    REVENUE: 'Ingreso', EXPENSE: 'Gasto',
  };

  const grouped = (data ?? []).reduce((acc: Record<string, any[]>, a: any) => {
    acc[a.type] = acc[a.type] ?? [];
    acc[a.type].push(a);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([type, accounts]) => (
        <div key={type} style={{ marginBottom: 20 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: typeColor[type] ?? '#111',
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
            paddingBottom: 6, borderBottom: `2px solid ${typeColor[type]}30`,
          }}>
            {typeLabel[type] ?? type} ({accounts.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {accounts.map((a: any) => (
              <div key={a.id} style={{
                background: '#f9fafb', borderRadius: 8, padding: '8px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 12, color: typeColor[type], marginRight: 8 }}>{a.code}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{a.name}</span>
                </div>
                {!a.isActive && <Badge label="Inactiva" color="#9ca3af" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Finance Page ────────────────────────────────────────────────────────

const TABS = [
  { id: 'ledger',    label: '📒 Libro Diario'    },
  { id: 'balance',   label: '⚖️ Balance General'  },
  { id: 'income',    label: '📈 Estado de Resultados' },
  { id: 'aging',     label: '🕐 Cuentas por Cobrar' },
  { id: 'accounts',  label: '📋 Plan de Cuentas'  },
];

export default function Finance() {
  const [tab, setTab] = useState('ledger');
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(true);

  // Data state
  const [ledger, setLedger] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [income, setIncome] = useState<any>(null);
  const [aging, setAging] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ledgerRes, balanceRes, incomeRes, agingRes, accountsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/accounting/ledger`, { headers }),
        fetch(`${API_URL}/api/v1/accounting/balance-sheet`, { headers }),
        fetch(`${API_URL}/api/v1/accounting/income-statement`, { headers }),
        fetch(`${API_URL}/api/v1/accounting/ar-aging`, { headers }),
        fetch(`${API_URL}/api/v1/accounting/accounts`, { headers }),
      ]);

      if (accountsRes.status === 200) {
        const accountsData = await accountsRes.json();
        if (accountsData.length === 0) setSeeded(false);
        else setSeeded(true);
        setAccounts(accountsData);
      }

      if (ledgerRes.status === 200) setLedger(await ledgerRes.json());
      if (balanceRes.status === 200) setBalance(await balanceRes.json());
      if (incomeRes.status === 200) setIncome(await incomeRes.json());
      if (agingRes.status === 200) setAging(await agingRes.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSeed = async () => {
    setLoading(true);
    await fetch(`${API_URL}/api/v1/accounting/seed`, { method: 'POST', headers });
    await fetchData();
  };

  return (
    <div style={{ padding: '24px', minHeight: '100%', background: '#f8f9fb' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>
          Finanzas
        </h1>
        <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Contabilidad IFRS · Doble entrada · Partida doble automática
        </div>
      </div>

      {/* Seed banner */}
      {!seeded && <SeedBanner onSeed={handleSeed} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb', overflowX: 'auto', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'none',
              fontWeight: tab === t.id ? 700 : 400, fontSize: 13,
              color: tab === t.id ? '#6366f1' : '#6b7280',
              borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
              marginBottom: -2, whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}

        <button
          onClick={fetchData}
          style={{
            marginLeft: 'auto', padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', cursor: 'pointer', fontSize: 12, color: '#6b7280',
            fontWeight: 600, flexShrink: 0, alignSelf: 'center',
          }}
        >
          {loading ? '⟳' : '↻'} Actualizar
        </button>
      </div>

      {/* Content */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            Cargando datos contables...
          </div>
        ) : (
          <>
            {tab === 'ledger'   && <GeneralLedger data={ledger} />}
            {tab === 'balance'  && <BalanceSheet data={balance} />}
            {tab === 'income'   && <IncomeStatement data={income} />}
            {tab === 'aging'    && <ARAgingReport data={aging} />}
            {tab === 'accounts' && <ChartOfAccounts data={accounts} />}
          </>
        )}
      </div>
    </div>
  );
}
