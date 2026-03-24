import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

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
}
