import { LuxonDatePipe } from '@core/pipes/luxon-date.pipe';
import { SharedModule } from '@modules/shared/shared.module';
import { Module } from '@nestjs/common';
import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';

@Module({
  imports: [SharedModule],
  controllers: [TaskController],
  providers: [TaskService, LuxonDatePipe],
  exports: [TaskService],
})
export class TaskModule {}
