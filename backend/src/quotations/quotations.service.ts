import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuotationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private notifications: NotificationsService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateQuotationDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, tenantId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const taxRate = Number(tenant.taxRate);

    // Calculate totals
    let subtotal = 0;
    const enrichedItems = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findFirst({
          where: { id: item.productId, tenantId },
        });
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        const itemSubtotal = item.quantity * item.unitPrice;
        subtotal += itemSubtotal;
        return { ...item, subtotal: itemSubtotal };
      }),
    );

    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const installationCost = dto.installationCost ?? 0;
    const total = subtotal + taxAmount + installationCost;

    // Sequential number
    const lastQuotation = await this.prisma.quotation.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' },
    });
    const number = (lastQuotation?.number || 0) + 1;

    return this.prisma.quotation.create({
      data: {
        tenantId,
        number,
        clientId: dto.clientId,
        createdById: userId,
        subtotal,
        taxAmount,
        installationCost,
        total,
        taxRate,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        items: {
          create: enrichedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            description: item.description,
            width: item.width,
            height: item.height,
          })),
        },
      },
      include: {
        client: true,
        items: { include: { product: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(tenantId: string, search?: string) {
    return this.prisma.quotation.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(search && { client: { name: { contains: search, mode: 'insensitive' } } }),
      },
      include: {
        client: { select: { id: true, name: true, rut: true, email: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const q = await this.prisma.quotation.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        client: true,
        items: { include: { product: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!q) throw new NotFoundException('Cotización no encontrada');
    return q;
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const q = await this.findOne(tenantId, id);
    return this.prisma.quotation.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async sendByEmail(tenantId: string, id: string) {
    const q = await this.findOne(tenantId, id);
    if (!q.client.email) throw new BadRequestException('El cliente no tiene email registrado');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    await this.email.sendQuotationEmail({
      to: q.client.email,
      clientName: q.client.name,
      quotationNumber: q.number,
      total: Number(q.total),
      companyName: tenant.name,
      validUntil: q.validUntil,
    });

    await this.prisma.quotation.update({
      where: { id },
      data: { status: 'ENVIADA' },
    });

    await this.notifications.create(tenantId, {
      type: 'GENERAL',
      title: 'Cotización enviada',
      body: `Cotización #${q.number} enviada a ${q.client.email}`,
      link: `/quotations`,
    });

    return { message: 'Cotización enviada por email correctamente' };
  }

  async approve(tenantId: string, id: string, userId: string) {
    const q = await this.findOne(tenantId, id);
    if (q.status !== 'ENVIADA' && q.status !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden aprobar cotizaciones en estado Borrador o Enviada');
    }

    await this.prisma.quotation.update({
      where: { id },
      data: { status: 'APROBADA' },
    });

    await this.notifications.create(tenantId, {
      type: 'COTIZACION_APROBADA',
      title: 'Cotización aprobada',
      body: `Cotización #${q.number} aprobada para ${q.client.name}`,
      link: `/quotations`,
    });

    return { message: 'Cotización aprobada', quotation: q };
  }

  async generatePdf(tenantId: string, id: string): Promise<Buffer> {
    const q = await this.findOne(tenantId, id);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(tenant.name, { align: 'left' });
      doc.fontSize(10).font('Helvetica').text(`Cotización N° ${String(q.number).padStart(4, '0')}`, { align: 'right' });
      doc.text(`Fecha: ${new Date(q.date).toLocaleDateString('es-CL')}`, { align: 'right' });
      if (q.validUntil) doc.text(`Válida hasta: ${new Date(q.validUntil).toLocaleDateString('es-CL')}`, { align: 'right' });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Client info
      doc.font('Helvetica-Bold').text('Cliente:');
      doc.font('Helvetica').text(q.client.name);
      doc.text(`RUT: ${q.client.rut}`);
      if (q.client.email) doc.text(`Email: ${q.client.email}`);
      if (q.client.phone) doc.text(`Teléfono: ${q.client.phone}`);

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Items table header
      const cols = { desc: 50, qty: 300, price: 370, total: 460 };
      doc.font('Helvetica-Bold');
      doc.text('Descripción', cols.desc, doc.y);
      doc.text('Cant.', cols.qty, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });
      doc.text('P. Unitario', cols.price, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
      doc.text('Subtotal', cols.total, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      // Items
      doc.font('Helvetica');
      for (const item of q.items) {
        const y = doc.y;
        doc.text(item.description || item.product.name, cols.desc, y, { width: 240 });
        doc.text(Number(item.quantity).toLocaleString('es-CL'), cols.qty, y, { width: 60, align: 'right' });
        doc.text(`$${Number(item.unitPrice).toLocaleString('es-CL')}`, cols.price, y, { width: 80, align: 'right' });
        doc.text(`$${Number(item.subtotal).toLocaleString('es-CL')}`, cols.total, y, { width: 80, align: 'right' });
        doc.moveDown(0.3);
      }

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Totals
      const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
      doc.text(`Neto: ${formatCLP(Number(q.subtotal))}`, { align: 'right' });
      doc.text(`IVA (${Number(q.taxRate)}%): ${formatCLP(Number(q.taxAmount))}`, { align: 'right' });
      doc.font('Helvetica-Bold').fontSize(12).text(`TOTAL: ${formatCLP(Number(q.total))}`, { align: 'right' });

      if (q.notes) {
        doc.moveDown();
        doc.font('Helvetica').fontSize(10).text('Observaciones:', { underline: true });
        doc.text(q.notes);
      }

      // Footer
      doc.fontSize(8).text(
        'Este documento no tiene validez tributaria. Válido solo como cotización comercial.',
        50, doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 },
      );

      doc.end();
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
