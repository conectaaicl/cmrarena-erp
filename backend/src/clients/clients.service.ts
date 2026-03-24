import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { cleanRut, formatRut, validateRut } from '../common/utils/rut.util';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClientDto) {
    if (!validateRut(dto.rut)) {
      throw new BadRequestException('RUT inválido');
    }
    const rutClean = cleanRut(dto.rut);
    const rut = formatRut(dto.rut);

    return this.prisma.client.create({
      data: { ...dto, tenantId, rut, rutClean },
    });
  }

  async findAll(tenantId: string, search?: string) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { rut: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: { select: { quotations: true, sales: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: { include: { product: true } } },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        dtes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(tenantId, id);
    const data: any = { ...dto };
    if (dto.rut) {
      if (!validateRut(dto.rut)) throw new BadRequestException('RUT inválido');
      data.rut = formatRut(dto.rut);
      data.rutClean = cleanRut(dto.rut);
    }
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTimeline(tenantId: string, clientId: string) {
    await this.findOne(tenantId, clientId);
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId, entityId: clientId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return logs;
  }
}
