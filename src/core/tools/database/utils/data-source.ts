import { commonDataSourceOptions } from '@app/core/config/database/type-orm.config';
import { TaskNotification } from '@modules/shared/database/shared/schemas/notification.schema';
import { RefreshToken } from '@modules/shared/database/shared/schemas/refreshToken.schema';
import { TaskEditHistory } from '@modules/shared/database/shared/schemas/task-edit-history.schema';
import { Task } from '@modules/shared/database/shared/schemas/task.schema';
import { User } from '@modules/shared/database/shared/schemas/user.schema';

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { seedMigrations } from '../seed';
dotenv.config();

export const entities = [
  Task,
  User,
  TaskNotification,
  TaskEditHistory,
  RefreshToken,
  //<Add new entities here>,
];
export const AppDataSource = new DataSource({
  ...commonDataSourceOptions,
  entities: entities,
  migrationsTableName: 'typeorm_migrations',
  migrations: seedMigrations,
});
