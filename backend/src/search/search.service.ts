import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(tenantId: string, q: string) {
    if (!q || q.trim().length < 2) return { clients: [], products: [], quotations: [] };
    const term = q.trim();

    const [clients, products, quotations] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { rut: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, rut: true, email: true, status: true },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: {
          tenantId,
          deletedAt: null,
          isActive: true,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { sku: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, sku: true, category: true, price: true, stock: true },
        take: 5,
      }),
      this.prisma.quotation.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { client: { name: { contains: term, mode: 'insensitive' } } },
            { notes: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, number: true, total: true, status: true, date: true,
          client: { select: { name: true } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { clients, products, quotations };
  }
}
