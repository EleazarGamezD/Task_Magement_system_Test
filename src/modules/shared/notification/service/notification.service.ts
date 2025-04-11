import { NotificationTitle, NotificationType } from '@core/enums/notifications';
import { CustomException } from '@core/exceptions-custom/custom-exception';
import { NotificationEventData } from '@core/interfaces/notification.interface';
import { ValidRoles } from '@enums/valid-roles';
import { NotificationRepository } from '@modules/shared/database/shared/repositories/notification.repository';
import { UserRepository } from '@modules/shared/database/shared/repositories/user.repository';
import { TaskNotification } from '@modules/shared/database/shared/schemas/notification.schema';
import { Task } from '@modules/shared/database/shared/schemas/task.schema';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { Injectable, Logger } from '@nestjs/common';
import {
  CreateNotificationDto,
  MarkNotificationReadDto,
} from '../dto/create-notification.dto';
import { NotificationGateway } from '../gateway/notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private static instance: NotificationService;

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
  ) {
    NotificationService.instance = this;
  }

  static getInstance(): NotificationService {
    return NotificationService.instance;
  }

  private get notificationGateway(): NotificationGateway {
    return NotificationGateway.getInstance();
  }

  // Create a single notification
  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<TaskNotification> {
    try {
      const notification = this.notificationRepository.create({
        ...createNotificationDto,
        read: false,
      });
      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`);
      throw new CustomException('Failed to create notification');
    }
  }

  // Notify users about a new task
  async notifyNewTask(task: Task): Promise<void> {
    try {
      // Obtener usuario destinatario de la tarea (asumiendo que task tiene un assignedTo)
      const assignedUserId = task.userId;

      // Crear notificación para el usuario asignado
      const userNotification = await this.create({
        destinationUserId: assignedUserId,
        taskId: task.id,
        type: NotificationType.NEW_TASK,
        title: NotificationTitle.NEW_TASK,
        message: `You have been assigned a new task "${task.title}"`,
      });

      // Enviar notificación al usuario y a los admins
      const notificationData: NotificationEventData = {
        userId: assignedUserId,
        taskId: task.id,
        notificationType: NotificationType.NEW_TASK,
        notificationTitle: NotificationTitle.NEW_TASK,
        notificationMessage: `New task "${task.title}" assigned`,
        timestamp: new Date().toISOString(),
        notificationId: userNotification.id,
      };

      this.notificationGateway.sendNotification(
        'taskNotification',
        { ...notificationData, notificationType: NotificationType.NEW_USER },
        assignedUserId,
      );
    } catch (error) {
      this.logger.error(`Error in notifyNewTask: ${error.message}`);
    }
  }

  // Notify users about an updated task
  async notifyTaskUpdate(task: Task): Promise<void> {
    try {
      // Get all users to notify
      const users = await this.userRepository.find();

      // Create notifications for each user
      const notifications = users.map((user) => {
        return this.notificationRepository.create({
          destinationUserId: user.id,
          taskId: task.id,
          type: NotificationType.UPDATE_TASK,
          title: NotificationTitle.UPDATE_TASK,
          message: `Task "${task.title}" has been updated`,
          read: false,
        });
      });

      await this.notificationRepository.save(notifications);

      // Send WebSocket notification to each user
      for (const user of users) {
        const notificationDto: CreateNotificationDto = {
          destinationUserId: user.id,
          taskId: task.id,
          type: NotificationType.UPDATE_TASK,
          title: NotificationTitle.UPDATE_TASK,
          message: `Task "${task.title}" has been updated`,
        };
        this.notificationGateway.sendToUser(user.id, 'taskNotification', {
          ...notificationDto,
          notificationType: NotificationType.UPDATE_TASK,
        });
      }

      this.logger.log(
        `Created ${notifications.length} notifications for updated task ${task.id}`,
      );
    } catch (error) {
      this.logger.error(`Error notifying about task update: ${error.message}`);
    }
  }

  // Notify users about a deleted task
  async notifyTaskDeletion(taskId: string, taskTitle: string): Promise<void> {
    try {
      // Get all users to notify
      const users = await this.userRepository.find();

      // Create notifications for each user
      const notifications = users.map((user) => {
        return this.notificationRepository.create({
          destinationUserId: user.id,
          type: NotificationType.DELETE_TASK,
          title: NotificationTitle.DELETE_TASK,
          message: `Task "${taskTitle}" has been deleted`,
          read: false,
        });
      });

      await this.notificationRepository.save(notifications);

      // Send WebSocket notification to each user
      for (const user of users) {
        const notificationDto: CreateNotificationDto = {
          destinationUserId: user.id,
          type: NotificationType.DELETE_TASK,
          title: NotificationTitle.DELETE_TASK,
          message: `Task "${taskTitle}" has been deleted`,
        };
        this.notificationGateway.sendToUser(user.id, 'taskNotification', {
          ...notificationDto,
          notificationType: NotificationType.UPDATE_TASK,
        });
      }

      this.logger.log(
        `Created ${notifications.length} notifications for deleted task ${taskId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error notifying about task deletion: ${error.message}`,
      );
    }
  }

  // Notify admins about a new user
  async notifyNewUser(user: User): Promise<void> {
    try {
      // Obtener todos los admins
      const admins = await this.getAdminUsers();

      // Crear notificaciones para cada admin
      for (const admin of admins) {
        const notification = await this.create({
          destinationUserId: admin.id,
          type: NotificationType.NEW_USER,
          title: NotificationTitle.NEW_USER,
          message: `New user ${user.firstName} ${user.lastName} (${user.email}) registered`,
        });

        const notificationData: NotificationEventData = {
          userId: user.id, // ID del nuevo usuario
          notificationType: NotificationType.NEW_USER,
          notificationTitle: NotificationTitle.NEW_USER,
          notificationMessage: `New user ${user.firstName} ${user.lastName} registered`,
          timestamp: new Date().toISOString(),
          notificationId: notification.id,
        };

        // Enviar solo a admins (no se especifica userId ya que es solo para admins)
        this.notificationGateway.sendNotification('userNotification', {
          ...notificationData,
          notificationType: NotificationType.NEW_USER,
        });
      }
    } catch (error) {
      this.logger.error(`Error notifying about new user: ${error.message}`);
    }
  }

  // Mark a notification as read
  async markAsRead(
    userId: string,
    dto: MarkNotificationReadDto,
  ): Promise<TaskNotification> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: {
          id: dto.notificationId,
          destinationUserId: userId,
        },
      });

      if (!notification) {
        throw new CustomException(
          'Notification not found or you do not have permission to mark it as read',
        );
      }

      notification.read = true;
      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      throw new CustomException('Failed to mark notification as read');
    }
  }

  // Get all notifications for a user
  async findAllForUser(userId: string): Promise<TaskNotification[]> {
    try {
      return await this.notificationRepository.find({
        where: { destinationUserId: userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching notifications for user ${userId}: ${error.message}`,
      );
      throw new CustomException('Failed to fetch notifications');
    }
  }

  // Get unread notifications count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationRepository.count({
        where: {
          destinationUserId: userId,
          read: false,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error counting unread notifications: ${error.message}`,
      );
      throw new CustomException('Failed to count unread notifications');
    }
  }

  // Get all admin users
  async getAdminUsers(): Promise<User[]> {
    try {
      // Use ANY instead of the containment operator
      return await this.userRepository
        .createQueryBuilder('user')
        .where(':role = ANY(user.roles)', { role: ValidRoles.ADMIN })
        .getMany();
    } catch (error) {
      this.logger.error(`Error fetching admin users: ${error.message}`);
      return [];
    }
  }

  // Add this method to your NotificationService class
  async getUserWithRoles(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'roles'],
      });
    } catch (error) {
      this.logger.error(`Error fetching user roles: ${error.message}`);
      return null;
    }
  }
}
