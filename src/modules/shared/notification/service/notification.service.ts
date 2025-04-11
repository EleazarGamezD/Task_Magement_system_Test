import { NotificationTitle, NotificationType } from '@core/enums/notifications';
import { CustomException } from '@core/exceptions-custom/custom-exception';
import { ValidRoles } from '@enums/valid-roles';
import { NotificationRepository } from '@modules/shared/database/shared/repositories/notification.repository';
import { TaskRepository } from '@modules/shared/database/shared/repositories/task.repository';
import { UserRepository } from '@modules/shared/database/shared/repositories/user.repository';
import { TaskNotification } from '@modules/shared/database/shared/schemas/notification.schema';
import { Task } from '@modules/shared/database/shared/schemas/task.schema';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { Injectable, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import {
  CreateNotificationDto,
  MarkNotificationReadDto,
} from '../dto/create-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

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
      // Get all users to notify
      const users = await this.userRepository.find();

      // Create notifications for each user
      const notifications = users.map((user) => {
        return this.notificationRepository.create({
          destinationUserId: user.id,
          taskId: task.id,
          type: NotificationType.NEW_TASK,
          title: NotificationTitle.NEW_TASK,
          message: `A new task "${task.title}" has been created`,
          read: false,
        });
      });

      await this.notificationRepository.save(notifications);
      this.logger.log(
        `Created ${notifications.length} notifications for new task ${task.id}`,
      );
    } catch (error) {
      this.logger.error(`Error notifying about new task: ${error.message}`);
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
      // Get all admin users
      const admins = await this.userRepository.find({
        where: { roles: In([ValidRoles.ADMIN]) },
      });

      if (admins.length === 0) {
        this.logger.log('No admins found to notify about new user');
        return;
      }

      // Create notifications for each admin
      const notifications = admins.map((admin) => {
        return this.notificationRepository.create({
          destinationUserId: admin.id,
          type: NotificationType.NEW_USER,
          title: NotificationTitle.NEW_USER,
          message: `New user ${user.firstName} ${user.lastName} (${user.email}) has registered`,
          read: false,
        });
      });

      await this.notificationRepository.save(notifications);
      this.logger.log(
        `Created ${notifications.length} notifications for admins about new user ${user.id}`,
      );
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
}
