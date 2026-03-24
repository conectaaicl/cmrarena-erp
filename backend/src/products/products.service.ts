import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, AdjustStockDto } from './dto/create-product.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(tenantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string, search?: string, category?: string, lowStock?: boolean) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
        ...(lowStock && { stock: { lte: this.prisma.product.fields.minStock } }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock(tenantId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM "Product"
      WHERE "tenantId" = ${tenantId}
        AND "isActive" = true
        AND "deletedAt" IS NULL
        AND stock <= "minStock"
      ORDER BY stock ASC
    `;
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async adjustStock(tenantId: string, id: string, dto: AdjustStockDto, userId: string) {
    const product = await this.findOne(tenantId, id);
    const type = dto.quantity > 0 ? 'ENTRADA' : dto.quantity < 0 ? 'SALIDA' : 'AJUSTE';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: { stock: { increment: dto.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          type,
          quantity: Math.abs(dto.quantity),
          reason: dto.reason || 'Ajuste manual',
        },
      });

      // Alert if stock goes below minimum
      if (updated.stock <= updated.minStock) {
        await this.notifications.create(tenantId, {
          type: 'STOCK_CRITICO',
          title: 'Stock crítico',
          body: `${updated.name} tiene solo ${updated.stock} unidades (mínimo: ${updated.minStock})`,
          link: `/inventory`,
          payload: { productId: id },
        });
      }

      return updated;
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async getCategories(tenantId: string) {
    const result = await this.prisma.product.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r) => r.category);
  }
}
