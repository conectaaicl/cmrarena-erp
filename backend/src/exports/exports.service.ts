import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportSales(tenantId: string, from?: string, to?: string): Promise<Buffer> {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(from || to ? {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        } : {}),
      },
      include: { client: true, createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ventas');

    ws.columns = [
      { header: 'N° Venta', key: 'number', width: 10 },
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Cliente', key: 'client', width: 30 },
      { header: 'RUT', key: 'rut', width: 15 },
      { header: 'Neto', key: 'subtotal', width: 15 },
      { header: 'IVA', key: 'taxAmount', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Método Pago', key: 'paymentMethod', width: 15 },
      { header: 'Estado Pago', key: 'paymentStatus', width: 15 },
      { header: 'Creado por', key: 'createdBy', width: 20 },
    ];

    // Style header
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    for (const sale of sales) {
      ws.addRow({
        number: `#${String(sale.number).padStart(4, '0')}`,
        date: new Date(sale.date).toLocaleDateString('es-CL'),
        client: sale.client.name,
        rut: sale.client.rut,
        subtotal: Number(sale.subtotal),
        taxAmount: Number(sale.taxAmount),
        total: Number(sale.total),
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        createdBy: `${sale.createdBy.firstName} ${sale.createdBy.lastName}`,
      });
    }

    // Format currency columns
    ['subtotal', 'taxAmount', 'total'].forEach((key) => {
      const col = ws.getColumn(key);
      col.numFmt = '#,##0';
    });

    ws.addRow({});
    const totalRow = ws.addRow({
      client: 'TOTAL',
      total: sales.reduce((acc, s) => acc + Number(s.total), 0),
    });
    totalRow.font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportClients(tenantId: string): Promise<Buffer> {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { sales: true, quotations: true } } },
      orderBy: { name: 'asc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Clientes');

    ws.columns = [
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'RUT', key: 'rut', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Estado', key: 'status', width: 20 },
      { header: 'Ciudad', key: 'city', width: 15 },
      { header: 'Cotizaciones', key: 'quotations', width: 12 },
      { header: 'Ventas', key: 'sales', width: 10 },
      { header: 'Fecha registro', key: 'createdAt', width: 15 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    for (const client of clients) {
      ws.addRow({
        name: client.name,
        rut: client.rut,
        email: client.email || '',
        phone: client.phone || '',
        status: client.status,
        city: client.city || '',
        quotations: client._count.quotations,
        sales: client._count.sales,
        createdAt: new Date(client.createdAt).toLocaleDateString('es-CL'),
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportInventory(tenantId: string): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inventario');

    ws.columns = [
      { header: 'SKU', key: 'sku', width: 12 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Categoría', key: 'category', width: 15 },
      { header: 'Costo', key: 'cost', width: 12 },
      { header: 'Precio', key: 'price', width: 12 },
      { header: 'Margen %', key: 'margin', width: 10 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Stock Mín.', key: 'minStock', width: 10 },
      { header: 'Alerta', key: 'alert', width: 10 },
      { header: 'Unidad', key: 'unit', width: 8 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    for (const p of products) {
      const cost = Number(p.cost);
      const price = Number(p.price);
      const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
      const row = ws.addRow({
        sku: p.sku,
        name: p.name,
        category: p.category,
        cost,
        price,
        margin,
        stock: p.stock,
        minStock: p.minStock,
        alert: p.stock <= p.minStock ? 'CRÍTICO' : 'OK',
        unit: p.unit,
      });

      if (p.stock <= p.minStock) {
        row.getCell('alert').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        row.getCell('stock').font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    }

    ['cost', 'price'].forEach((k) => { ws.getColumn(k).numFmt = '#,##0'; });
    ws.getColumn('margin').numFmt = '0"%"';

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportQuotations(tenantId: string): Promise<Buffer> {
    const quotations = await this.prisma.quotation.findMany({
      where: { tenantId, deletedAt: null },
      include: { client: true, createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cotizaciones');

    ws.columns = [
      { header: 'N° Cotización', key: 'number', width: 14 },
      { header: 'Fecha', key: 'date', width: 12 },
      { header: 'Válida hasta', key: 'validUntil', width: 14 },
      { header: 'Cliente', key: 'client', width: 30 },
      { header: 'RUT', key: 'rut', width: 14 },
      { header: 'Neto', key: 'subtotal', width: 14 },
      { header: 'IVA', key: 'taxAmount', width: 12 },
      { header: 'Instalación', key: 'installationCost', width: 12 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'Estado', key: 'status', width: 16 },
      { header: 'Creado por', key: 'createdBy', width: 20 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    for (const q of quotations) {
      ws.addRow({
        number: `#${String(q.number).padStart(4, '0')}`,
        date: new Date(q.date).toLocaleDateString('es-CL'),
        validUntil: q.validUntil ? new Date(q.validUntil).toLocaleDateString('es-CL') : '—',
        client: q.client.name,
        rut: q.client.rut,
        subtotal: Number(q.subtotal),
        taxAmount: Number(q.taxAmount),
        installationCost: Number(q.installationCost),
        total: Number(q.total),
        status: q.status,
        createdBy: `${q.createdBy.firstName} ${q.createdBy.lastName}`,
      });
    }

    ['subtotal', 'taxAmount', 'installationCost', 'total'].forEach(k => { ws.getColumn(k).numFmt = '#,##0'; });

    ws.addRow({});
    const totalRow = ws.addRow({ client: 'TOTAL', total: quotations.reduce((a, q) => a + Number(q.total), 0) });
    totalRow.font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── PDF helpers ────────────────────────────────────────────────

  private pdfBuffer(fn: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any)({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      fn(doc);
      doc.end();
    });
  }

  private pdfHeader(doc: any, title: string, subtitle: string) {
    doc.rect(0, 0, doc.page.width, 70).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(title, 40, 22);
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text(subtitle, 40, 46);
    doc.fillColor('#1e293b').rect(0, 70, doc.page.width, 2).fill();
    doc.y = 90;
  }

  private pdfTable(doc: any, headers: string[], rows: string[][], colWidths: number[]) {
    const startX = 40;
    const rowH = 20;
    let y = doc.y;

    // Header row
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill('#1e293b');
    let x = startX;
    headers.forEach((h, i) => {
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text(h, x + 4, y + 6, { width: colWidths[i] - 8, lineBreak: false });
      x += colWidths[i];
    });
    y += rowH;

    // Data rows
    rows.forEach((row, ri) => {
      if (y + rowH > doc.page.height - 60) { doc.addPage(); y = 40; }
      if (ri % 2 === 1) doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill('#0f172a');
      x = startX;
      row.forEach((cell, i) => {
        doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica').text(String(cell ?? ''), x + 4, y + 6, { width: colWidths[i] - 8, lineBreak: false });
        x += colWidths[i];
      });
      y += rowH;
    });

    doc.y = y + 8;
  }

  async exportSalesPDF(tenantId: string, from?: string, to?: string): Promise<Buffer> {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId, deletedAt: null,
        ...(from || to ? { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
      },
      include: { client: true },
      orderBy: { date: 'desc' },
    });

    const totalRevenue = sales.reduce((a, s) => a + Number(s.total), 0);
    const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

    return this.pdfBuffer((doc) => {
      this.pdfHeader(doc, 'Reporte de Ventas', `${sales.length} ventas · Total: ${fmt(totalRevenue)} · Generado ${new Date().toLocaleDateString('es-CL')}`);
      this.pdfTable(doc,
        ['N° Venta', 'Fecha', 'Cliente', 'RUT', 'Neto', 'IVA', 'Total', 'Pago', 'Estado'],
        sales.map(s => [
          `#${String(s.number).padStart(4, '0')}`,
          new Date(s.date).toLocaleDateString('es-CL'),
          s.client.name,
          s.client.rut,
          fmt(Number(s.subtotal)),
          fmt(Number(s.taxAmount)),
          fmt(Number(s.total)),
          s.paymentMethod,
          s.paymentStatus,
        ]),
        [55, 60, 120, 70, 65, 55, 65, 65, 60],
      );
    });
  }

  async exportClientsPDF(tenantId: string): Promise<Buffer> {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { sales: true, quotations: true } } },
      orderBy: { name: 'asc' },
    });

    return this.pdfBuffer((doc) => {
      this.pdfHeader(doc, 'Reporte de Clientes', `${clients.length} clientes · Generado ${new Date().toLocaleDateString('es-CL')}`);
      this.pdfTable(doc,
        ['Nombre', 'RUT', 'Email', 'Teléfono', 'Estado', 'Ciudad', 'Cotiz.', 'Ventas'],
        clients.map(c => [
          c.name, c.rut, c.email || '—', c.phone || '—',
          c.status, c.city || '—',
          String(c._count.quotations), String(c._count.sales),
        ]),
        [120, 70, 110, 70, 80, 70, 40, 40],
      );
    });
  }

  async exportInventoryPDF(tenantId: string): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

    return this.pdfBuffer((doc) => {
      this.pdfHeader(doc, 'Reporte de Inventario', `${products.length} productos · Generado ${new Date().toLocaleDateString('es-CL')}`);
      this.pdfTable(doc,
        ['SKU', 'Nombre', 'Categoría', 'Costo', 'Precio', 'Margen%', 'Stock', 'Mín.', 'Alerta'],
        products.map(p => {
          const cost = Number(p.cost), price = Number(p.price);
          const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
          return [p.sku, p.name, p.category, fmt(cost), fmt(price), `${margin}%`, String(p.stock), String(p.minStock), p.stock <= p.minStock ? 'CRÍTICO' : 'OK'];
        }),
        [55, 115, 80, 65, 65, 45, 40, 40, 50],
      );
    });
  }

  async exportQuotationsPDF(tenantId: string): Promise<Buffer> {
    const quotations = await this.prisma.quotation.findMany({
      where: { tenantId, deletedAt: null },
      include: { client: true, createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
    });

    const totalAprobado = quotations.filter(q => q.status === 'APROBADA').reduce((a, q) => a + Number(q.total), 0);
    const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

    return this.pdfBuffer((doc) => {
      this.pdfHeader(doc, 'Reporte de Cotizaciones', `${quotations.length} cotizaciones · Aprobado: ${fmt(totalAprobado)} · Generado ${new Date().toLocaleDateString('es-CL')}`);
      this.pdfTable(doc,
        ['N°', 'Fecha', 'Cliente', 'RUT', 'Neto', 'IVA', 'Total', 'Estado', 'Vendedor'],
        quotations.map(q => [
          `#${String(q.number).padStart(4, '0')}`,
          new Date(q.date).toLocaleDateString('es-CL'),
          q.client.name,
          q.client.rut,
          fmt(Number(q.subtotal)),
          fmt(Number(q.taxAmount)),
          fmt(Number(q.total)),
          q.status,
          `${q.createdBy.firstName} ${q.createdBy.lastName}`,
        ]),
        [40, 55, 110, 65, 60, 50, 60, 65, 80],
      );
    });
  }
}
