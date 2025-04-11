import { TaskNotification } from '@modules/shared/database/shared/schemas/notification.schema';

export interface NotificationEventData {
  count?: number;
  notification?: TaskNotification;
  notifications?: TaskNotification[];
  success?: boolean;
  error?: string;
}
