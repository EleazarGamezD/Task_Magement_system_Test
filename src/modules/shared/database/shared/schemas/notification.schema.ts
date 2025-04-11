import { NotificationType } from '@core/enums/notifications';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.schema';
import { User } from './user.schema';

@Entity()
@Index(['destinationUserId', 'type'])
export class TaskNotification {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'ID of the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({ type: 'uuid' })
  @ApiProperty({
    description: 'ID of the user who should receive this notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  destinationUserId: string;

  @Column({ type: 'uuid', nullable: true })
  @ApiProperty({
    description: 'ID of the related task, if any',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  taskId?: string;

  @Column({ type: 'enum', enum: NotificationType })
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.NEW_TASK,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({
    description: 'Title of the notification',
    example: 'You have a new task',
  })
  title: string;

  @Column({ type: 'text' })
  @ApiProperty({
    description: 'Message content of the notification',
    example: 'A new task "Complete documentation" has been assigned to you',
  })
  message: string;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  read: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @ApiProperty({
    description: 'When the notification was created',
    example: '2024-04-10T00:00:00.000Z',
  })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinationUserId' })
  destination: User;

  @ManyToOne(() => Task, (task) => task.notifications, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}
