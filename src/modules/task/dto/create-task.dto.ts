import { TaskStatus } from '@enums/task.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Title of the task',
    example: 'My Task',
    required: true,
  })
  title: string;

  @IsOptional()
  @ApiProperty({
    description: 'Description of the task',
    example: 'This is a task description',
    required: true,
  })
  description?: string;

  @IsEnum(TaskStatus)
  @ApiProperty({
    description: 'Status of the task',
    enum: TaskStatus,
    example: TaskStatus.TODO,
    required: true,
  })
  status: TaskStatus;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Due date of the task in ISO format',
    example: '2023-12-31T23:59:59.999Z',
    required: false,
  })
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    // Handle single string value
    if (typeof value === 'string') {
      return [value];
    }
    // Handle array of strings
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  })
  @ApiProperty({
    description: 'Array of file attachments for the task',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  attachments?: string[];
}
