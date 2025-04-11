import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEditHistory } from '../schemas/task-edit-history.schema';

@Injectable()
export class TaskHistoricRepository extends Repository<TaskEditHistory> {
  constructor(
    @InjectRepository(TaskEditHistory)
    taskHistoricRepository: Repository<TaskEditHistory>,
  ) {
    super(
      taskHistoricRepository.target,
      taskHistoricRepository.manager,
      taskHistoricRepository.queryRunner,
    );
  }
}
