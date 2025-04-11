import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './shared/database/database.module';
import { NotificationModule } from './shared/notification/notification.module';
import { SharedModule } from './shared/shared.module';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    TaskModule,
    NotificationModule,
    NotificationModule,
    SharedModule,
  ],
  exports: [
    DatabaseModule,
    AuthModule,
    TaskModule,
    NotificationModule,
    NotificationModule,
    SharedModule,
  ],
})
export class CommonModule {}
