import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  userId?: string;
  payload?: any;
}

@Injectable()
export class NotificationsService {
  private gateway: any; // Set by gateway after init

  constructor(private prisma: PrismaService) {}

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async create(tenantId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        link: dto.link,
        payload: dto.payload,
      },
    });

    // Emit via WebSocket
    if (this.gateway) {
      this.gateway.emitToTenant(tenantId, 'notification', notification);
    }

    return notification;
  }

  async findAll(tenantId: string, userId?: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        ...(userId && { OR: [{ userId }, { userId: null }] }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(tenantId: string, userId: string) {
    return this.prisma.notification.count({
      where: {
        tenantId,
        isRead: false,
        OR: [{ userId }, { userId: null }],
      },
    });
  }

  async markAsRead(tenantId: string, id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, isRead: false, OR: [{ userId }, { userId: null }] },
      data: { isRead: true },
    });
  }
}
