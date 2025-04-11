import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskNotification } from '../schemas/notification.schema';

@Injectable()
export class NotificationRepository extends Repository<TaskNotification> {
  constructor(
    @InjectRepository(TaskNotification)
    private readonly notificationRepository: Repository<TaskNotification>,
  ) {
    super(
      notificationRepository.target,
      notificationRepository.manager,
      notificationRepository.queryRunner,
    );
  }
}
