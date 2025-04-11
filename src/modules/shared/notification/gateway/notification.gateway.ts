import { NotificationEventData } from '@core/interfaces/notification.interface';
import { WsJwtGuard } from '@modules/auth/guards/ws-jwt/ws-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  CreateNotificationDto,
  MarkNotificationReadDto,
} from '../dto/create-notification.dto';
import { NotificationService } from '../service/notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);
  private userSocketMap = new Map<string, string[]>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Notification WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn('Client attempted to connect without token');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwtSecret'),
      });

      const userId = payload.sub;

      // Store socket connection for this user
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, []);
      }

      const userSockets = this.userSocketMap.get(userId);
      if (userSockets) {
        userSockets.push(client.id);
      }
      client.data.userId = userId;

      this.logger.log(`Client connected: ${client.id} for user ${userId}`);

      // Send unread count to the client
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });
    } catch (error) {
      this.logger.error(`Error in connection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSocketMap.has(userId)) {
      const userSockets = this.userSocketMap.get(userId);
      if (userSockets) {
        const index = userSockets.indexOf(client.id);

        if (index !== -1) {
          userSockets.splice(index, 1);
        }
      }

      if (userSockets && userSockets.length === 0) {
        this.userSocketMap.delete(userId);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: NotificationEventData) {
    if (this.userSocketMap.has(userId)) {
      const socketIds = this.userSocketMap.get(userId);

      if (socketIds) {
        for (const socketId of socketIds) {
          this.server.to(socketId).emit(event, data);
        }
      }

      this.logger.log(
        `Sent ${event} to user ${userId} via ${socketIds?.length || 0} connections`,
      );
    }
  }

  // Broadcast notification about task event to all users
  broadcastTaskNotification(notification: CreateNotificationDto) {
    // Emit to everyone
    this.server.emit('taskNotification', notification);
    this.logger.log(`Broadcasted task notification to all connected clients`);
  }

  // Mark notification as read
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markNotificationRead')
  async markAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkNotificationReadDto,
  ) {
    try {
      const userId = client.data.userId;
      const notification = await this.notificationService.markAsRead(
        userId,
        data,
      );

      // Send updated unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.sendToUser(userId, 'unreadCount', { count: unreadCount });

      return { success: true, notification };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('getNotifications')
  async getNotifications(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      const notifications =
        await this.notificationService.findAllForUser(userId);
      return { success: true, notifications };
    } catch (error) {
      this.logger.error(`Error getting notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
