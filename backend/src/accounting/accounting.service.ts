import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CHART_OF_ACCOUNTS = [
  { code: '1101', name: 'Caja', type: 'ASSET', subtype: 'Cash' },
  { code: '1102', name: 'Banco', type: 'ASSET', subtype: 'Bank' },
  { code: '1103', name: 'Fondo Fijo', type: 'ASSET', subtype: 'Cash' },
  { code: '1201', name: 'Cuentas por Cobrar', type: 'ASSET', subtype: 'AccountsReceivable' },
  { code: '1202', name: 'Documentos por Cobrar', type: 'ASSET', subtype: 'AccountsReceivable' },
  { code: '1301', name: 'Inventario / Existencias', type: 'ASSET', subtype: 'Inventory' },
  { code: '1401', name: 'IVA Crédito Fiscal', type: 'ASSET', subtype: 'Tax' },
  { code: '1501', name: 'Activo Fijo Bruto', type: 'ASSET', subtype: 'FixedAsset' },
  { code: '2101', name: 'Cuentas por Pagar', type: 'LIABILITY', subtype: 'AccountsPayable' },
  { code: '2102', name: 'Documentos por Pagar', type: 'LIABILITY', subtype: 'AccountsPayable' },
  { code: '2201', name: 'IVA Débito Fiscal', type: 'LIABILITY', subtype: 'Tax' },
  { code: '2301', name: 'Provisiones', type: 'LIABILITY', subtype: 'Accrued' },
  { code: '2401', name: 'Préstamos Bancarios', type: 'LIABILITY', subtype: 'LongTermDebt' },
  { code: '3101', name: 'Capital Social', type: 'EQUITY', subtype: 'Capital' },
  { code: '3201', name: 'Utilidades Retenidas', type: 'EQUITY', subtype: 'RetainedEarnings' },
  { code: '3301', name: 'Resultado del Ejercicio', type: 'EQUITY', subtype: 'CurrentEarnings' },
  { code: '4101', name: 'Ingresos por Ventas', type: 'REVENUE', subtype: 'Sales' },
  { code: '4102', name: 'Ingresos por Instalación', type: 'REVENUE', subtype: 'Services' },
  { code: '4103', name: 'Otros Ingresos', type: 'REVENUE', subtype: 'Other' },
  { code: '5101', name: 'Costo de Ventas', type: 'EXPENSE', subtype: 'COGS' },
  { code: '5201', name: 'Gastos de Administración', type: 'EXPENSE', subtype: 'Admin' },
  { code: '5202', name: 'Gastos de Ventas', type: 'EXPENSE', subtype: 'Sales' },
  { code: '5301', name: 'Gastos Financieros', type: 'EXPENSE', subtype: 'Financial' },
  { code: '5401', name: 'Depreciación', type: 'EXPENSE', subtype: 'Depreciation' },
];

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async seedChartOfAccounts(tenantId: string) {
    const existing = await this.prisma.account.count({ where: { tenantId } });
    if (existing > 0) return { message: 'Plan de cuentas ya inicializado', count: existing };
    await this.prisma.account.createMany({
      data: CHART_OF_ACCOUNTS.map(a => ({ ...a, tenantId, isSystem: true, type: a.type as any })),
      skipDuplicates: true,
    });
    return { message: 'Plan de cuentas IFRS Chile inicializado', count: CHART_OF_ACCOUNTS.length };
  }

  async ensureChartExists(tenantId: string) {
    const count = await this.prisma.account.count({ where: { tenantId } });
    if (count === 0) await this.seedChartOfAccounts(tenantId);
  }

  private async getAccount(tenantId: string, code: string) {
    const acc = await this.prisma.account.findUnique({ where: { tenantId_code: { tenantId, code } } });
    if (!acc) throw new NotFoundException(`Cuenta ${code} no encontrada. Inicializa el plan de cuentas primero.`);
    return acc;
  }

  async createSaleJournalEntry(tenantId: string, sale: any) {
    await this.ensureChartExists(tenantId);
    const [ar, revenue, installation, iva] = await Promise.all([
      this.getAccount(tenantId, '1201'),
      this.getAccount(tenantId, '4101'),
      this.getAccount(tenantId, '4102'),
      this.getAccount(tenantId, '2201'),
    ]);
    const subtotal = Number(sale.subtotal);
    const taxAmount = Number(sale.taxAmount);
    const installCost = Number(sale.installationCost ?? 0);
    const total = Number(sale.total);
    const revenueBase = subtotal - installCost;

    const lines: any[] = [
      { accountId: ar.id, debit: total, credit: 0, description: `AR — Venta #${sale.number}` },
      { accountId: revenue.id, debit: 0, credit: revenueBase, description: `Ingresos venta #${sale.number}` },
      { accountId: iva.id, debit: 0, credit: taxAmount, description: `IVA débito venta #${sale.number}` },
    ];
    if (installCost > 0) {
      lines.push({ accountId: installation.id, debit: 0, credit: installCost, description: `Instalación venta #${sale.number}` });
    }

    return this.prisma.journalEntry.create({
      data: {
        tenantId, saleId: sale.id,
        reference: `SALE-${String(sale.number).padStart(4, '0')}`,
        description: `Venta #${sale.number} — ${sale.client?.name ?? ''}`,
        lines: { create: lines },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  async createPaymentJournalEntry(tenantId: string, sale: any) {
    await this.ensureChartExists(tenantId);
    const [bank, ar] = await Promise.all([
      this.getAccount(tenantId, '1102'),
      this.getAccount(tenantId, '1201'),
    ]);
    const total = Number(sale.total);
    return this.prisma.journalEntry.create({
      data: {
        tenantId, saleId: sale.id,
        reference: `PMT-${String(sale.number).padStart(4, '0')}`,
        description: `Pago recibido venta #${sale.number} — ${sale.client?.name ?? ''}`,
        lines: {
          create: [
            { accountId: bank.id, debit: total, credit: 0, description: 'Cobro recibido' },
            { accountId: ar.id, debit: 0, credit: total, description: 'Cancelación AR' },
          ],
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  async getAccounts(tenantId: string) {
    return this.prisma.account.findMany({ where: { tenantId, isActive: true }, orderBy: { code: 'asc' } });
  }

  async getGeneralLedger(tenantId: string, from?: string, to?: string) {
    return this.prisma.journalEntry.findMany({
      where: {
        tenantId, deletedAt: null,
        ...(from || to ? { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
      },
      include: { lines: { include: { account: { select: { code: true, name: true, type: true } } } } },
      orderBy: { date: 'desc' },
    });
  }

  async getBalanceSheet(tenantId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { tenantId, isActive: true },
      include: { journalLines: { select: { debit: true, credit: true } } },
      orderBy: { code: 'asc' },
    });
    const calc = (acc: any) => {
      const d = acc.journalLines.reduce((s: number, l: any) => s + Number(l.debit), 0);
      const c = acc.journalLines.reduce((s: number, l: any) => s + Number(l.credit), 0);
      return ['ASSET', 'EXPENSE'].includes(acc.type) ? d - c : c - d;
    };
    const byType: Record<string, any[]> = { ASSET: [], LIABILITY: [], EQUITY: [], REVENUE: [], EXPENSE: [] };
    const totals: Record<string, number> = { ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0 };
    for (const acc of accounts) {
      const balance = calc(acc);
      if (balance === 0) continue;
      byType[acc.type].push({ code: acc.code, name: acc.name, balance });
      totals[acc.type] += balance;
    }
    return {
      assets: { accounts: byType.ASSET, total: totals.ASSET },
      liabilities: { accounts: byType.LIABILITY, total: totals.LIABILITY },
      equity: { accounts: byType.EQUITY, total: totals.EQUITY },
      totalLiabilitiesAndEquity: totals.LIABILITY + totals.EQUITY,
    };
  }

  async getIncomeStatement(tenantId: string, from?: string, to?: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        tenantId, deletedAt: null,
        ...(from || to ? { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
      },
      include: { lines: { include: { account: { select: { code: true, name: true, type: true } } } } },
    });
    const revenue: Record<string, { name: string; amount: number }> = {};
    const expenses: Record<string, { name: string; amount: number }> = {};
    for (const entry of entries) {
      for (const line of entry.lines) {
        const { code, name, type } = line.account;
        if (type === 'REVENUE') {
          if (!revenue[code]) revenue[code] = { name, amount: 0 };
          revenue[code].amount += Number(line.credit) - Number(line.debit);
        }
        if (type === 'EXPENSE') {
          if (!expenses[code]) expenses[code] = { name, amount: 0 };
          expenses[code].amount += Number(line.debit) - Number(line.credit);
        }
      }
    }
    const totalRevenue = Object.values(revenue).reduce((s, v) => s + v.amount, 0);
    const totalExpenses = Object.values(expenses).reduce((s, v) => s + v.amount, 0);
    return {
      revenue: Object.entries(revenue).map(([code, v]) => ({ code, ...v })),
      expenses: Object.entries(expenses).map(([code, v]) => ({ code, ...v })),
      totalRevenue, totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    };
  }

  async getARAgingReport(tenantId: string) {
    const sales = await this.prisma.sale.findMany({
      where: { tenantId, deletedAt: null, paymentStatus: { in: ['PENDIENTE', 'PARCIAL'] } },
      include: { client: { select: { id: true, name: true, rut: true } } },
      orderBy: { date: 'asc' },
    });
    const now = new Date();
    const buckets = { current: 0, days30: 0, days60: 0, days90plus: 0 };
    const items = sales.map(s => {
      const days = Math.floor((now.getTime() - new Date(s.date).getTime()) / 86400000);
      const amount = Number(s.total);
      let bucket: string;
      if (days <= 30) { bucket = 'current'; buckets.current += amount; }
      else if (days <= 60) { bucket = '30-60'; buckets.days30 += amount; }
      else if (days <= 90) { bucket = '60-90'; buckets.days60 += amount; }
      else { bucket = '90+'; buckets.days90plus += amount; }
      return { saleId: s.id, saleNumber: s.number, client: s.client, amount, date: s.date, daysPastDue: days, bucket };
    });
    return { items, totals: buckets, grandTotal: sales.reduce((s, sale) => s + Number(sale.total), 0) };
  }

  async createManualEntry(tenantId: string, dto: any) {
    const totalDebit = dto.lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
    const totalCredit = dto.lines.reduce((s: number, l: any) => s + Number(l.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error('Asiento desbalanceado (débitos ≠ créditos)');
    return this.prisma.journalEntry.create({
      data: {
        tenantId,
        date: dto.date ? new Date(dto.date) : new Date(),
        description: dto.description,
        reference: dto.reference,
        lines: { create: dto.lines },
      },
      include: { lines: { include: { account: true } } },
    });
  }
}
