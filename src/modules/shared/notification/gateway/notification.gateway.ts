import {
  NotificationCountData,
  NotificationData,
  NotificationResponse,
  SubscriptionPayload,
} from '@core/interfaces/notification.interface';
import { ValidRoles } from '@enums/valid-roles';
import { forwardRef, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MarkNotificationReadDto } from '../dto/create-notification.dto';
import { NotificationService } from '../service/notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  private readonly logger = new Logger(NotificationGateway.name);
  private userSocketMap = new Map<string, string[]>();
  private userRolesMap = new Map<string, string[]>();
  private static instance: NotificationGateway;
  private static isInitialized = false;

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}
  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');

    // Now the server is available, set the static instance
    NotificationGateway.instance = this;
    NotificationGateway.isInitialized = true;

    this.logger.log('NotificationGateway instance is now ready');

    // Rest of your afterInit logic
    server.on('connection', (socket: Socket) => {
      this.logger.log(`Client connected: ${socket.id}`);
    });

    server.on('disconnect', (socket: Socket) => {
      this.logger.log(`Client disconnected: ${socket.id}`);
    });
  }

  static getInstance(): NotificationGateway {
    if (!NotificationGateway.isInitialized) {
      console.log(
        'Warning: Attempting to get NotificationGateway instance before initialization',
      );
      throw new Error('NotificationGateway instance is not initialized');
    }

    return NotificationGateway.instance;
  }

  onModuleInit() {
    this.logger.log('NotificationGateway module initialized');
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
        secret: this.configService.get<string>('jwtSecret'),
      });

      const userId = payload.sub;

      // Initialize user data structure
      client.data.user = {
        id: userId,
        roles: [],
      };

      client.data.userId = userId;

      // Store socket connection for this user
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, []);
      }

      const userSockets = this.userSocketMap.get(userId);
      if (userSockets) {
        userSockets.push(client.id);
      }

      // Get user roles from repository
      const user = await this.notificationService.getUserWithRoles(userId);
      if (user && user.roles) {
        client.data.user.roles = user.roles;
        this.userRolesMap.set(userId, user.roles);
      }

      this.logger.log(
        `Client connected: ${client.id} for user ${userId} with roles: ${client.data.user.roles.join(', ')}`,
      );

      // Send unread count to the client
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unreadCount', {
        count: unreadCount,
      } as NotificationCountData);
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
        this.userRolesMap.delete(userId);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToNotifications')
  handleSubscribe(
    client: Socket,
    payload: SubscriptionPayload,
  ): NotificationResponse {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      this.logger.log(`User ${userId} subscribed to notifications`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Subscription error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    client: Socket,
    payload: SubscriptionPayload,
  ): Promise<NotificationResponse> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      this.logger.log(`Fetching notifications for user ${userId}`);
      const notifications =
        await this.notificationService.findAllForUser(userId);
      return { success: true, notifications };
    } catch (error) {
      this.logger.error(`Error fetching notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    client: Socket,
    payload: MarkNotificationReadDto,
  ): Promise<NotificationResponse> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      this.logger.log(
        `Marking notification ${payload.notificationId} as read for user ${userId}`,
      );
      const notification = await this.notificationService.markAsRead(
        userId,
        payload,
      );

      // Update unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unreadCount', {
        count: unreadCount,
      } as NotificationCountData);

      return { success: true, notification };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Send notification to a specific user
  sendToUser(userId: string, event: string, data: NotificationData): void {
    if (!this.server) {
      this.logger.error('WebSocket server is not initialized');
      return;
    }

    if (!this.userSocketMap.has(userId)) {
      this.logger.warn(`No active connections for user ${userId}`);
      return;
    }

    const socketIds = this.userSocketMap.get(userId) || [];
    for (const socketId of socketIds) {
      try {
        this.server.to(socketId).emit(event, data);
      } catch (error) {
        this.logger.error(
          `Error emitting to socket ${socketId}: ${error.message}`,
        );
      }
    }
  }

  // Send notification to all users with a specific role
  sendToRole(role: ValidRoles, event: string, data: NotificationData): void {
    for (const [userId, roles] of this.userRolesMap.entries()) {
      if (roles.includes(role)) {
        this.sendToUser(userId, event, data);
      }
    }
  }

  // Send notification to all connected users
  sendToAll(event: string, data: NotificationData): void {
    if (!this.server) {
      this.logger.error('WebSocket server is not initialized');
      return;
    }

    try {
      this.server.emit(event, data);
    } catch (error) {
      this.logger.error(`Error broadcasting event ${event}: ${error.message}`);
    }
  }

  // Main method to send notifications based on type
  sendNotification(
    event: string,
    data: NotificationData,
    specificUserId?: string,
  ): void {
    try {
      // If it's a user notification (like NEW_USER), send only to admins
      if (event === 'userNotification') {
        this.logger.log(
          `Sending admin-only notification: ${data.notificationType}`,
        );
        this.sendToRole(ValidRoles.ADMIN, data.notificationType, data);
        return;
      }

      // For task notifications, send to everyone
      if (event === 'taskNotification') {
        if (specificUserId) {
          // If a specific user is provided, send just to them
          this.logger.log(
            `Sending task notification to specific user: ${specificUserId}`,
          );
          this.sendToUser(specificUserId, data.notificationType, data);
        } else {
          // Otherwise broadcast to all users
          this.logger.log(
            `Broadcasting task notification to all users: ${data.notificationType}`,
          );
          this.sendToAll(data.notificationType, data);
        }

        // Also emit on the general taskNotification channel for backwards compatibility
        if (specificUserId) {
          this.sendToUser(specificUserId, event, data);
        } else {
          this.sendToAll(event, data);
        }

        return;
      }

      // Default behavior - just use the provided event name
      this.logger.log(`Sending generic notification: ${event}`);
      if (specificUserId) {
        this.sendToUser(specificUserId, event, data);
      } else {
        this.sendToAll(event, data);
      }
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }
}
