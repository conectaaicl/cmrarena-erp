import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaProyectoDto, UpdateCaProyectoDto } from './dto/ca-proyecto.dto';

@Injectable()
export class CaProyectosService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string, estado?: string, tipo?: string) {
    return this.prisma.caProyecto.findMany({
      where: {
        tenantId,
        ...(estado ? { estado: estado as any } : {}),
        ...(tipo ? { tipo: tipo as any } : {}),
      },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(tenantId: string, id: string) {
    return this.prisma.caProyecto.findFirst({
      where: { tenantId, id },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true, email: true, telefono: true } },
      },
    });
  }

  create(tenantId: string, dto: CreateCaProyectoDto) {
    return this.prisma.caProyecto.create({
      data: { tenantId, ...dto },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true, email: true } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCaProyectoDto) {
    const found = await this.prisma.caProyecto.findFirst({ where: { tenantId, id } });
    if (!found) throw new NotFoundException('Proyecto no encontrado');
    return this.prisma.caProyecto.update({
      where: { id },
      data: dto,
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true, email: true } },
      },
    });
  }

  async cambiarEstado(tenantId: string, id: string, estado: string) {
    const found = await this.prisma.caProyecto.findFirst({ where: { tenantId, id } });
    if (!found) throw new NotFoundException('Proyecto no encontrado');
    return this.prisma.caProyecto.update({
      where: { id },
      data: { estado: estado as any },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const found = await this.prisma.caProyecto.findFirst({ where: { tenantId, id } });
    if (!found) throw new NotFoundException('Proyecto no encontrado');
    return this.prisma.caProyecto.delete({ where: { id } });
  }
}
