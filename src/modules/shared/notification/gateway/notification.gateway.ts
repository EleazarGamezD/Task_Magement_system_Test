import { NotificationEventData } from '@core/interfaces/notification.interface';
import { NotificationType } from '@enums/notifications';
import { ValidRoles } from '@enums/valid-roles';
import { WsJwtGuard } from '@modules/auth/guards/ws-jwt/ws-jwt.guard';
import {
  forwardRef,
  Inject,
  Logger,
  OnModuleInit,
  UseGuards,
} from '@nestjs/common';
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
  private userRolesMap = new Map<string, string[]>(); // Track user roles
  private static instance: NotificationGateway;
  private isServerInitialized = false;
  private static isServerReady = false;
  private checkInterval: NodeJS.Timeout | null = null;

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {
    NotificationGateway.instance = this;

    // Check server initialization status periodically
    this.checkInterval = setInterval(() => {
      if (this.server && !this.isServerInitialized) {
        this.isServerInitialized = true;
        NotificationGateway.isServerReady = true;
        this.logger.log('Socket.io server detected as initialized');
        clearInterval(this.checkInterval as NodeJS.Timeout);
      }
    }, 100);
  }

  static getInstance(): NotificationGateway {
    return NotificationGateway.instance;
  }

  static isReady(): boolean {
    return NotificationGateway.isServerReady;
  }

  onModuleInit() {
    this.logger.log('NotificationGateway module initialized');
  }

  afterInit() {
    this.isServerInitialized = true;
    NotificationGateway.isServerReady = true;
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

      // Inicializar estructura de datos del usuario
      client.data.user = {
        id: userId,
        roles: [], // Inicialmente vacío, lo llenaremos desde el repositorio
      };

      // También mantener userId para compatibilidad con código existente
      client.data.userId = userId;

      // Store socket connection for this user
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, []);
      }

      const userSockets = this.userSocketMap.get(userId);
      if (userSockets) {
        userSockets.push(client.id);
      }

      // Obtener roles del usuario desde el repositorio
      const user = await this.notificationService.getUserWithRoles(userId);
      if (user && user.roles) {
        // Actualizar la estructura completa del usuario
        client.data.user.roles = user.roles;

        // También actualizar el mapa de roles para uso en notificaciones
        this.userRolesMap.set(userId, user.roles);
      }

      this.logger.log(
        `Client connected: ${client.id} for user ${userId} with roles: ${client.data.user.roles.join(', ')}`,
      );

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
        this.userRolesMap.delete(userId);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Send notification to specific user and admins
  sendToUser(userId: string, event: string, data: NotificationEventData) {
    // Skip if server not initialized
    /*     if (!this.server || !this.isServerInitialized || !NotificationGateway.isServerReady) {
          this.logger.warn(`Socket.io server not ready, can't send ${event} to user ${userId}`);
          return;
        } */

    // Send to the specific user if connected
    this.sendToSpecificUser(userId, event, data);

    // Send to all admins (except if the target user is already an admin)
    this.sendToAllAdmins(userId, event, data);
  }

  // Helper to send to a specific user
  private sendToSpecificUser(
    userId: string,
    event: string,
    data: NotificationEventData,
  ) {
    if (this.userSocketMap.has(userId)) {
      const socketIds = this.userSocketMap.get(userId);
      if (socketIds && socketIds.length > 0) {
        const notificationData = {
          ...data,
          _sourceEvent: event,
          timestamp: new Date().toISOString(),
        };

        for (const socketId of socketIds) {
          try {
            this.server.to(socketId).emit('notification', notificationData);
            if (data.notificationType) {
              this.server
                .to(socketId)
                .emit(data.notificationType, notificationData);
            }
          } catch (error) {
            this.logger.error(
              `Error sending to socket ${socketId}: ${error.message}`,
            );
          }
        }
      }
    }
  }

  // Helper to send to all admins
  private sendToAllAdmins(
    excludeUserId: string | null,
    event: string,
    data: NotificationEventData,
  ) {
    for (const [userId, roles] of this.userRolesMap.entries()) {
      // Skip if this is the excluded user or not an admin
      if (
        (excludeUserId && userId === excludeUserId) ||
        !roles.includes(ValidRoles.ADMIN)
      ) {
        continue;
      }

      this.sendToSpecificUser(userId, event, data);
    }
  }

  // Implement message handlers with proper type safety
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markNotificationRead')
  async handleMarkNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkNotificationReadDto,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      const notification = await this.notificationService.markAsRead(
        userId,
        data,
      );
      const unreadCount = await this.notificationService.getUnreadCount(userId);

      // Send updated unread count
      client.emit('unreadCount', { count: unreadCount });

      return { success: true, notification };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('getNotifications')
  async handleGetNotifications(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      const notifications =
        await this.notificationService.findAllForUser(userId);
      return { success: true, notifications };
    } catch (error) {
      this.logger.error(`Error fetching notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('subscribeToNotifications')
  async handleSubscribeToNotifications(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      // Log this subscription
      this.logger.log(
        `User ${userId} subscribed to notifications with socket ${client.id}`,
      );

      // Send current unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });

      return { success: true, message: 'Subscribed to notifications' };
    } catch (error) {
      this.logger.error(`Error subscribing to notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  sendNotification(
    event: string,
    data: NotificationEventData,
    userId?: string,
  ) {
    /*    if (!this.server || !this.isServerInitialized || !NotificationGateway.isServerReady) {
         this.logger.warn(`Socket.io server not ready, can't send ${event}`);
         return;
       }
    */
    // CASO 1: Nueva notificación de usuario - solo notificar a admins
    if (data.notificationType === NotificationType.NEW_USER) {
      this.logger.log(`Sending NEW_USER notification to all admins`);
      this.sendToAllAdmins(null, event, data);
      return;
    }

    // CASO 2: Otras notificaciones - enviar al destinatario y a admins
    if (userId) {
      // Enviar al usuario específico destinatario
      this.logger.log(
        `Sending ${data.notificationType} notification to user ${userId}`,
      );
      this.sendToSpecificUser(userId, event, data);

      // Enviar a todos los admins (excepto al usuario si ya es admin)
      this.logger.log(
        `Sending ${data.notificationType} notification to admins`,
      );
      this.sendToAllAdmins(userId, event, data);
    } else {
      this.logger.warn(
        `No userId provided for notification type ${data.notificationType}`,
      );
    }
  }
}
