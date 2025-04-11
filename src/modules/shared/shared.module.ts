import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseModule } from './database/database.module';
import { NotificationRepository } from './database/shared/repositories/notification.repository';
import { TaskHistoricRepository } from './database/shared/repositories/task-historic.repository';
import { TaskRepository } from './database/shared/repositories/task.repository';
import { TokenRepository } from './database/shared/repositories/token.repository';
import { UserRepository } from './database/shared/repositories/user.repository';
import { FileService } from './files/file.service';
import { NotificationModule } from './notification/notification.module';
import { NotificationService } from './notification/service/notification.service';

const services = [
  FileService,
  JwtService,
  NotificationService,
  // Add new services to will be shared in other modules here
];
const repositories = [
  UserRepository,
  TaskRepository,
  TokenRepository,
  TaskHistoricRepository,
  NotificationRepository,
  // Add new repositories to will be shared in other modules here
];

@Module({
  imports: [DatabaseModule, NotificationModule, ConfigModule],
  exports: [
    ...repositories, // Export the repositories to be used in other modules
    ...services,
    DatabaseModule, // Export the database module to be used in other modules
    ConfigModule, // Export the config module to be used in other modules
  ],
  providers: [...services, ...repositories], // Register the services and repositories as providers
})
export class SharedModule {}
