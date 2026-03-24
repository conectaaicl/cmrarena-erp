import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateSaleDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, tenantId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const taxRate = Number(tenant.taxRate);

    // Validate and enrich items
    let subtotal = 0;
    const enrichedItems = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findFirst({
          where: { id: item.productId, tenantId, isActive: true },
        });
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
          );
        }
        const itemSubtotal = item.quantity * item.unitPrice;
        subtotal += itemSubtotal;
        return { ...item, subtotal: itemSubtotal, product };
      }),
    );

    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + taxAmount;

    // Sequential number
    const lastSale = await this.prisma.sale.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' },
    });
    const number = (lastSale?.number || 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          tenantId,
          number,
          clientId: dto.clientId,
          quotationId: dto.quotationId,
          createdById: userId,
          subtotal,
          taxAmount,
          total,
          taxRate,
          paymentMethod: dto.paymentMethod,
          paymentStatus: dto.paymentStatus || 'PENDIENTE',
          notes: dto.notes,
          items: {
            create: enrichedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              description: item.description,
            })),
          },
        },
        include: {
          client: true,
          items: { include: { product: true } },
        },
      });

      // Deduct stock
      for (const item of enrichedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'SALIDA',
            quantity: item.quantity,
            reason: `Venta #${number}`,
            referenceId: sale.id,
          },
        });

        // Check low stock
        const updatedProduct = await tx.product.findUnique({ where: { id: item.productId } });
        if (updatedProduct.stock <= updatedProduct.minStock) {
          await this.notifications.create(tenantId, {
            type: 'STOCK_CRITICO',
            title: 'Stock crítico',
            body: `${updatedProduct.name}: ${updatedProduct.stock} unidades restantes`,
            link: '/inventory',
            payload: { productId: item.productId },
          });
        }
      }

      // Update client status
      await tx.client.update({
        where: { id: dto.clientId },
        data: { status: 'VENTA_CERRADA' },
      });

      // Notify payment received
      await this.notifications.create(tenantId, {
        type: 'PAGO_RECIBIDO',
        title: 'Nueva venta registrada',
        body: `Venta #${number} por $${Math.round(total).toLocaleString('es-CL')} - ${client.name}`,
        link: '/sales',
        payload: { saleId: sale.id },
      });

      return sale;
    });
  }

  async findAll(tenantId: string, search?: string) {
    return this.prisma.sale.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(search && { client: { name: { contains: search, mode: 'insensitive' } } }),
      },
      include: {
        client: { select: { id: true, name: true, rut: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true, dtes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        client: true,
        items: { include: { product: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        dtes: true,
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async updatePaymentStatus(tenantId: string, id: string, paymentStatus: string) {
    const sale = await this.findOne(tenantId, id);
    const updated = await this.prisma.sale.update({
      where: { id },
      data: { paymentStatus: paymentStatus as any },
    });

    if (paymentStatus === 'PAGADO') {
      await this.notifications.create(tenantId, {
        type: 'PAGO_RECIBIDO',
        title: 'Pago confirmado',
        body: `Venta #${sale.number} marcada como pagada`,
        link: '/sales',
      });
    }

    return updated;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.sale.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
