import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfMonth, endOfMonth, startOfYear, subMonths, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getKPIs(tenantId: string, period: 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    let from: Date;
    if (period === 'month') from = startOfMonth(now);
    else if (period === 'quarter') from = startOfMonth(subMonths(now, 3));
    else from = startOfYear(now);

    const [
      salesStats,
      pendingPayments,
      activeClients,
      quotationsIssued,
      topProducts,
      paymentMethods,
      stockAlerts,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { tenantId, deletedAt: null, date: { gte: from } },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, deletedAt: null, paymentStatus: { in: ['PENDIENTE', 'PARCIAL'] } },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, status: { notIn: ['PERDIDO'] } },
      }),
      this.prisma.quotation.count({
        where: { tenantId, deletedAt: null, date: { gte: from } },
      }),
      this.getTopProducts(tenantId, from),
      this.getPaymentMethodBreakdown(tenantId, from),
      this.prisma.$queryRaw<any[]>`
        SELECT id, name, sku, stock, "minStock" FROM "Product"
        WHERE "tenantId" = ${tenantId} AND "isActive" = true AND "deletedAt" IS NULL
          AND stock <= "minStock"
        ORDER BY stock ASC LIMIT 5
      `,
    ]);

    return {
      totalRevenue: Number(salesStats._sum.total || 0),
      totalSales: salesStats._count.id,
      pendingAmount: Number(pendingPayments._sum.total || 0),
      pendingCount: pendingPayments._count.id,
      activeClients,
      quotationsIssued,
      topProducts,
      paymentMethods,
      stockAlerts,
      period,
    };
  }

  async getSalesChart(tenantId: string, months: number = 6) {
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const from = startOfMonth(date);
      const to = endOfMonth(date);

      const result = await this.prisma.sale.aggregate({
        where: { tenantId, deletedAt: null, date: { gte: from, lte: to } },
        _sum: { total: true },
        _count: { id: true },
      });

      data.push({
        month: format(date, 'MMM yyyy', { locale: undefined }),
        revenue: Number(result._sum.total || 0),
        count: result._count.id,
      });
    }

    return data;
  }

  async getTopClients(tenantId: string, limit: number = 10) {
    return this.prisma.$queryRaw<any[]>`
      SELECT
        c.id, c.name, c.rut,
        COUNT(s.id) as "salesCount",
        COALESCE(SUM(s.total), 0) as "totalRevenue"
      FROM "Client" c
      LEFT JOIN "Sale" s ON s."clientId" = c.id AND s."deletedAt" IS NULL
      WHERE c."tenantId" = ${tenantId} AND c."deletedAt" IS NULL
      GROUP BY c.id, c.name, c.rut
      ORDER BY "totalRevenue" DESC
      LIMIT ${limit}
    `;
  }

  private async getTopProducts(tenantId: string, from: Date) {
    return this.prisma.$queryRaw<any[]>`
      SELECT
        p.id, p.name, p.sku,
        COALESCE(SUM(si.quantity), 0) as "totalSold",
        COALESCE(SUM(si.subtotal), 0) as "totalRevenue"
      FROM "Product" p
      LEFT JOIN "SaleItem" si ON si."productId" = p.id
      LEFT JOIN "Sale" s ON s.id = si."saleId" AND s."deletedAt" IS NULL AND s.date >= ${from}
      WHERE p."tenantId" = ${tenantId} AND p."deletedAt" IS NULL
      GROUP BY p.id, p.name, p.sku
      ORDER BY "totalRevenue" DESC
      LIMIT 5
    `;
  }

  private async getPaymentMethodBreakdown(tenantId: string, from: Date) {
    const results = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { tenantId, deletedAt: null, date: { gte: from } },
      _sum: { total: true },
      _count: { id: true },
    });

    return results.map((r) => ({
      method: r.paymentMethod,
      total: Number(r._sum.total || 0),
      count: r._count.id,
    }));
  }
}
