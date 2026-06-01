import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './dto/delivery.dto';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.delivery.findMany({
      where: { tenantId },
      include: { client: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(tenantId: string, id: string) {
    return this.prisma.delivery.findFirst({
      where: { tenantId, id },
      include: { client: { select: { id: true, name: true, email: true, phone: true } } },
    });
  }

  create(tenantId: string, dto: CreateDeliveryDto) {
    return this.prisma.delivery.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        quotationId: dto.quotationId,
        title: dto.title,
        services: (dto.services as any) ?? [],
        notes: dto.notes,
      },
      include: { client: { select: { id: true, name: true, email: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDeliveryDto) {
    const delivery = await this.prisma.delivery.findFirst({ where: { tenantId, id } });
    if (!delivery) throw new NotFoundException('Entrega no encontrada');
    return this.prisma.delivery.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.services !== undefined && { services: dto.services as any }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { client: { select: { id: true, name: true, email: true } } },
    });
  }

  async toggleStatus(tenantId: string, id: string) {
    const delivery = await this.prisma.delivery.findFirst({ where: { tenantId, id } });
    if (!delivery) throw new NotFoundException('Entrega no encontrada');
    const next = delivery.status === DeliveryStatus.ACTIVO
      ? DeliveryStatus.INACTIVO
      : DeliveryStatus.ACTIVO;
    return this.prisma.delivery.update({
      where: { id },
      data: { status: next },
      include: { client: { select: { id: true, name: true, email: true } } },
    });
  }

  async sendCredentials(tenantId: string, id: string, tenant: any) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { tenantId, id },
      include: { client: true },
    });
    if (!delivery) throw new NotFoundException('Entrega no encontrada');
    if (!delivery.client.email) throw new NotFoundException('El cliente no tiene correo registrado');

    await this.email.sendDeliveryEmail({
      to: delivery.client.email,
      clientName: delivery.client.name,
      title: delivery.title,
      status: delivery.status,
      services: delivery.services as any[],
      notes: delivery.notes,
      tenant,
    });

    return this.prisma.delivery.update({
      where: { id },
      data: { emailSentAt: new Date() },
      include: { client: { select: { id: true, name: true, email: true } } },
    });
  }

  async remove(tenantId: string, id: string) {
    const delivery = await this.prisma.delivery.findFirst({ where: { tenantId, id } });
    if (!delivery) throw new NotFoundException('Entrega no encontrada');
    return this.prisma.delivery.delete({ where: { id } });
  }
}
