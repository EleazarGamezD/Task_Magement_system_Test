import { CreateTaskDto } from '@modules/task/dto/create-task.dto';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class LuxonDatePipe implements PipeTransform {
  logger = new Logger(LuxonDatePipe.name);
  transform(value: CreateTaskDto, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    const date = DateTime.fromISO(value.dueDate ?? '');
    if (!date.isValid) {
      throw new BadRequestException(
        'Invalid date format. Expected format: YYYY-MM-DDTHH:mm:ss.sssZ',
      );
    }
    value.dueDate = date.toFormat('yyyy-MM-dd HH:mm:ss');
    this.logger.log('luxon date', date);
    return value;
  }
}
