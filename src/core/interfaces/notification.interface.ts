import { TaskNotification } from '@modules/shared/database/shared/schemas/notification.schema';

export interface NotificationEventData {
  userId?: string;
  taskId?: string;
  type?: string;
  notificationType?: string;
  notificationTitle?: string;
  notificationId?: string;
  notificationMessage?: string;
  timestamp?: string;
  count?: number;
  notification?: TaskNotification;
  notifications?: TaskNotification[];
  success?: boolean;
  error?: string;
}
