import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { PartialType } from '@nestjs/swagger';

class UpdateTaskDto extends PartialType(CreateTaskDto) {}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        tenantId,
        createdById: userId,
        title: dto.title,
        description: dto.description,
        clientId: dto.clientId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? 'PENDIENTE',
        priority: dto.priority ?? 'MEDIA',
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(tenantId: string, status?: string, clientId?: string) {
    return this.prisma.task.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status: status as any }),
        ...(clientId && { clientId }),
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(tenantId, id);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.clientId !== undefined && { clientId: dto.clientId || null }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findOne(tenantId: string, id: string) {
    const t = await this.prisma.task.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!t) throw new NotFoundException('Tarea no encontrada');
    return t;
  }
}
