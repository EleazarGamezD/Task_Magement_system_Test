import { NotificationType } from '@enums/notifications';
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
export interface SubscriptionPayload {
  userId?: string;
}

export interface NotificationResponse {
  success: boolean;
  error?: string;
  notifications?: TaskNotification[];
  notification?: TaskNotification;
}

export interface NotificationData {
  notificationType: NotificationType;
  taskId?: string;
  userId?: string;
  message?: string;
  title?: string;
  data?: Record<string, unknown>;
}

export interface NotificationCountData {
  count: number;
}
