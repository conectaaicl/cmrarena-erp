import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const STAGE_WEIGHTS: Record<string, number> = {
  NUEVO: 5, CONTACTADO: 15, COTIZACION_ENVIADA: 30,
  SEGUIMIENTO: 40, APROBADO: 65, VENTA_CERRADA: 100, PERDIDO: 0,
};

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async calculateScore(tenantId: string, clientId: string): Promise<{
    score: number;
    factors: Record<string, number>;
  }> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        quotations: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 },
        sales: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 },
        activityNotes: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!client) return { score: 0, factors: {} };

    const factors: Record<string, number> = {};
    let score = 0;

    // Pipeline stage base score
    const stageScore = STAGE_WEIGHTS[client.status] ?? 0;
    factors.pipelineStage = stageScore;
    score += stageScore;

    // Has quotations
    if (client.quotations.length > 0) { factors.hasQuotations = 10; score += 10; }

    // Has approved quotations
    const approved = client.quotations.filter(q => q.status === 'APROBADA').length;
    if (approved > 0) { factors.approvedQuotations = 15; score += 15; }

    // Has closed sales
    if (client.sales.length > 0) { factors.hasSales = 20; score += 20; }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = client.activityNotes.filter(n => new Date(n.createdAt) > thirtyDaysAgo).length;
    if (recentActivity > 0) { factors.recentActivity = 10; score += 10; }

    // High deal value
    const totalPipelineValue = client.quotations
      .filter(q => ['BORRADOR', 'ENVIADA', 'APROBADA'].includes(q.status))
      .reduce((s, q) => s + Number(q.total), 0);
    if (totalPipelineValue > 1000000) { factors.highValue = 15; score += 15; }
    else if (totalPipelineValue > 500000) { factors.midValue = 8; score += 8; }

    // Has contact info (email + phone)
    if (client.email && client.phone) { factors.completeProfile = 5; score += 5; }

    // Clamp 0-100
    score = Math.min(100, Math.max(0, Math.round(score)));

    // Save to DB
    await this.prisma.dealScore.upsert({
      where: { clientId },
      update: { score, factors, tenantId },
      create: { clientId, tenantId, score, factors },
    });

    return { score, factors };
  }

  async updateAllScores(tenantId: string) {
    const clients = await this.prisma.client.findMany({ where: { tenantId, deletedAt: null }, select: { id: true } });
    const results = await Promise.all(clients.map(c => this.calculateScore(tenantId, c.id)));
    return { updated: results.length, scores: results };
  }

  async getClientsByScore(tenantId: string) {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        dealScore: true,
        _count: { select: { quotations: true, sales: true } },
        quotations: {
          where: { deletedAt: null, status: { in: ['BORRADOR', 'ENVIADA', 'APROBADA'] } },
          select: { total: true },
        },
        sales: {
          where: { deletedAt: null },
          select: { total: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map(c => ({
      ...c,
      score: c.dealScore?.score ?? 0,
      scoreFactors: c.dealScore?.factors ?? {},
      pipelineValue: c.quotations.reduce((s, q) => s + Number(q.total), 0),
      totalRevenue: c.sales.reduce((s, sale) => s + Number(sale.total), 0),
    }));
  }

  async getPipelineView(tenantId: string) {
    const clients = await this.getClientsByScore(tenantId);
    const stages = ['NUEVO', 'CONTACTADO', 'COTIZACION_ENVIADA', 'SEGUIMIENTO', 'APROBADO', 'VENTA_CERRADA', 'PERDIDO'];
    const pipeline: Record<string, any> = {};

    for (const stage of stages) {
      const stageClients = clients.filter(c => c.status === stage);
      pipeline[stage] = {
        clients: stageClients,
        count: stageClients.length,
        totalValue: stageClients.reduce((s, c) => s + (c as any).pipelineValue, 0),
        probability: STAGE_WEIGHTS[stage],
        weightedValue: stageClients.reduce((s, c) => s + (c as any).pipelineValue * (STAGE_WEIGHTS[stage] / 100), 0),
      };
    }

    const forecastRevenue = stages.reduce((s, stage) => s + pipeline[stage].weightedValue, 0);
    return { pipeline, forecastRevenue };
  }

  async updateClientStatus(tenantId: string, clientId: string, status: string) {
    const client = await this.prisma.client.update({
      where: { id: clientId },
      data: { status: status as any },
    });
    // Recalculate score on status change
    await this.calculateScore(tenantId, clientId);
    return client;
  }
}
