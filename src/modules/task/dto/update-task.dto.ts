import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  editedByAdminId?: string;

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
