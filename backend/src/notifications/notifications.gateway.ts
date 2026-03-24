import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    // Register gateway in service for cross-module broadcasts
    setTimeout(() => this.notificationsService.setGateway(this), 100);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return client.disconnect();

      const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
      client.data.user = payload;

      // Join tenant room
      await client.join(`tenant:${payload.tenantId}`);
      await client.join(`user:${payload.sub}`);

      client.emit('connected', { message: 'WebSocket conectado', userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Nothing needed
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(client: Socket, notificationId: string) {
    const { tenantId } = client.data.user;
    return this.notificationsService.markAsRead(tenantId, notificationId);
  }

  emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
