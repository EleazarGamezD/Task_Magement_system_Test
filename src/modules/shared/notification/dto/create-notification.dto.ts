import { NotificationType } from '@core/enums/notifications';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID who should receive the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  destinationUserId: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({
    description: 'Related task ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  taskId?: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.NEW_TASK,
  })
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Title of notification',
    example: 'You have a new task',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message content',
    example: 'A new task has been assigned to you',
  })
  message: string;
}

export class MarkNotificationReadDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Notification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  notificationId: string;
}
