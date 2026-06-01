import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaClienteDto, UpdateCaClienteDto } from './dto/ca-cliente.dto';

@Injectable()
export class CaClientesService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string, estado?: string) {
    return this.prisma.caCliente.findMany({
      where: { tenantId, ...(estado ? { estado: estado as any } : {}) },
      include: {
        _count: { select: { proyectos: true } },
        proyectos: {
          select: { id: true, estado: true, tipo: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async stats(tenantId: string) {
    const [total, activos, prospectos, proyectosActivos] = await Promise.all([
      this.prisma.caCliente.count({ where: { tenantId } }),
      this.prisma.caCliente.count({ where: { tenantId, estado: 'ACTIVO' } }),
      this.prisma.caCliente.count({ where: { tenantId, estado: 'PROSPECTO' } }),
      this.prisma.caProyecto.count({ where: { tenantId, estado: 'ACTIVO' } }),
    ]);
    return { total, activos, prospectos, proyectosActivos };
  }

  findOne(tenantId: string, id: string) {
    return this.prisma.caCliente.findFirst({
      where: { tenantId, id },
      include: {
        proyectos: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  create(tenantId: string, dto: CreateCaClienteDto) {
    return this.prisma.caCliente.create({
      data: { tenantId, ...dto },
      include: { _count: { select: { proyectos: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCaClienteDto) {
    const found = await this.prisma.caCliente.findFirst({ where: { tenantId, id } });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.caCliente.update({
      where: { id },
      data: dto,
      include: { _count: { select: { proyectos: true } } },
    });
  }

  async remove(tenantId: string, id: string) {
    const found = await this.prisma.caCliente.findFirst({ where: { tenantId, id } });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.caCliente.delete({ where: { id } });
  }
}
