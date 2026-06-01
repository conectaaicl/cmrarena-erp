import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const NEXT_ACTIONS: Record<string, { action: string; urgency: string }> = {
  NUEVO: { action: 'Hacer primera llamada de contacto y presentar la empresa', urgency: 'medium' },
  CONTACTADO: { action: 'Enviar cotización personalizada según sus necesidades', urgency: 'high' },
  COTIZACION_ENVIADA: { action: 'Hacer seguimiento telefónico — han pasado más de 3 días', urgency: 'high' },
  SEGUIMIENTO: { action: 'Programar reunión de cierre — resolver objeciones pendientes', urgency: 'high' },
  APROBADO: { action: 'Confirmar condiciones, emitir factura y coordinar instalación', urgency: 'high' },
  VENTA_CERRADA: { action: 'Solicitar referido y encuesta de satisfacción', urgency: 'low' },
  PERDIDO: { action: 'Registrar motivo de pérdida y planificar recontacto en 90 días', urgency: 'low' },
};

@Injectable()
export class AiService {
  private groqKey: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.groqKey = this.config.get('GROQ_API_KEY', '');
  }

  private async callGroq(system: string, user: string, maxTokens = 400): Promise<string> {
    if (!this.groqKey) return '';
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      });
      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content ?? '';
    } catch { return ''; }
  }

  async getNextBestAction(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        quotations: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 },
        sales: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 3 },
        activityNotes: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
    if (!client) return { action: 'Cliente no encontrado', reason: '', urgency: 'low' };

    const fallback = NEXT_ACTIONS[client.status] ?? NEXT_ACTIONS.NUEVO;
    const context = `
Cliente: ${client.name} | RUT: ${client.rut} | Estado pipeline: ${client.status}
Cotizaciones: ${client.quotations.length} (${client.quotations.filter(q => q.status === 'APROBADA').length} aprobadas)
Ventas cerradas: ${client.sales.length}
Última nota: ${client.activityNotes[0]?.content?.slice(0, 100) ?? 'Sin notas'}
Valor pipeline: $${client.quotations.filter(q => ['ENVIADA', 'BORRADOR', 'APROBADA'].includes(q.status)).reduce((s, q) => s + Number(q.total), 0).toLocaleString('es-CL')}
    `.trim();

    const llmText = await this.callGroq(
      'Eres un experto CRM para PyME chilena. Analiza el cliente y sugiere la próxima acción de venta. Responde SOLO JSON: {"action":"...","reason":"...","urgency":"high|medium|low","suggestedMessage":"..."}',
      context,
      300,
    );

    try {
      const m = llmText.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        return { ...parsed, source: 'ai' };
      }
    } catch { /* fall through */ }

    return {
      action: fallback.action,
      reason: `Cliente en etapa ${client.status} con ${client.quotations.length} cotizaciones`,
      urgency: fallback.urgency,
      suggestedMessage: `Hola ${client.name}, te contactamos para dar seguimiento a tu solicitud.`,
      source: 'rules',
    };
  }

  async getCreditRiskScore(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        sales: { where: { deletedAt: null }, orderBy: { date: 'desc' } },
      },
    });
    if (!client) return { score: 0, level: 'BAJO', factors: [] };

    let score = 0;
    const factors: string[] = [];
    const now = new Date();

    const pendingSales = (client.sales as any[]).filter((s: any) => ['PENDIENTE', 'PARCIAL'].includes(s.paymentStatus));
    const paidSales = (client.sales as any[]).filter((s: any) => s.paymentStatus === 'PAGADO');

    // Pending payments > 30 days
    const oldPending = pendingSales.filter((s: any) => {
      const days = (now.getTime() - new Date(s.date).getTime()) / 86400000;
      return days > 30;
    });
    if (oldPending.length > 0) { score += 35; factors.push(`${oldPending.length} cobro(s) vencido(s) > 30 días`); }

    // Pending payments > 60 days
    const veryOldPending = pendingSales.filter((s: any) => {
      const days = (now.getTime() - new Date(s.date).getTime()) / 86400000;
      return days > 60;
    });
    if (veryOldPending.length > 0) { score += 25; factors.push(`${veryOldPending.length} cobro(s) vencido(s) > 60 días`); }

    // Multiple pending
    if (pendingSales.length >= 3) { score += 15; factors.push('3+ ventas con cobro pendiente'); }

    // Payment method CHEQUE
    const cheques = pendingSales.filter((s: any) => s.paymentMethod === 'CHEQUE');
    if (cheques.length > 0) { score += 10; factors.push('Pago en cheque pendiente'); }

    // No recent sales
    const lastSale = (client.sales as any[])[0];
    if (!lastSale || (now.getTime() - new Date(lastSale.date).getTime()) / 86400000 > 180) {
      score += 10; factors.push('Sin actividad en +6 meses');
    }

    // Good history reduces risk
    if (paidSales.length >= 5) { score -= 20; factors.push('Buen historial de pagos (bonus -20)'); }
    else if (paidSales.length >= 2) { score -= 10; factors.push('Historial de pagos aceptable (bonus -10)'); }

    score = Math.min(100, Math.max(0, score));
    const level = score <= 25 ? 'BAJO' : score <= 50 ? 'MEDIO' : score <= 75 ? 'ALTO' : 'CRITICO';

    return { score, level, factors, clientId, clientName: client.name };
  }

  async generateNarrativeReport(tenantId: string, type: string, period: string) {
    const now = new Date();
    const from = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === 'quarter'
        ? new Date(now.getFullYear(), now.getMonth() - 3, 1)
        : new Date(now.getFullYear(), 0, 1);

    const [salesStats, clientCount, quotStats] = await Promise.all([
      this.prisma.sale.aggregate({ where: { tenantId, deletedAt: null, date: { gte: from } }, _sum: { total: true }, _count: { id: true } }),
      this.prisma.client.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.quotation.aggregate({ where: { tenantId, deletedAt: null, date: { gte: from } }, _count: { id: true } }),
    ]);

    const data = {
      period,
      totalRevenue: Number(salesStats._sum.total || 0),
      totalSales: salesStats._count.id,
      activeClients: clientCount,
      quotationsIssued: quotStats._count.id,
    };

    const context = `Período: ${period}. Ventas: ${data.totalSales} ventas por $${data.totalRevenue.toLocaleString('es-CL')}. Clientes activos: ${data.activeClients}. Cotizaciones emitidas: ${data.quotationsIssued}.`;

    const llmText = await this.callGroq(
      'Eres analista de negocios para PyME chilena. Genera un reporte ejecutivo narrativo en español, 3-4 párrafos, con análisis de resultados, tendencias y recomendaciones. Usa formato profesional.',
      context,
      600,
    );

    const fallbackNarrative = `Durante el período de ${period}, la empresa registró ${data.totalSales} ventas por un total de $${data.totalRevenue.toLocaleString('es-CL')}. Se emitieron ${data.quotationsIssued} cotizaciones y se mantienen ${data.activeClients} clientes activos en el sistema. Para mejorar los resultados, se recomienda hacer seguimiento oportuno de las cotizaciones pendientes y fortalecer la cartera de clientes con actividad reciente.`;

    return { narrative: llmText || fallbackNarrative, data, source: llmText ? 'ai' : 'template' };
  }
}
