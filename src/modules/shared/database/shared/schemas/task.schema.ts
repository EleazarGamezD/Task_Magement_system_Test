import { TaskStatus } from '@enums/task.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskNotification } from './notification.schema';
import { TaskEditHistory } from './task-edit-history.schema';
import { User } from './user.schema';
@Entity()
@Index('task_userId_index', ['userId'])
@Index('task_status_index', ['status'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'ID of the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @ApiProperty({
    description: 'Title of the task',
    example: 'Complete project documentation',
  })
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Description of the task',
    example: 'This is a detailed description of what needs to be done',
    required: false,
  })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  @IsOptional()
  @IsArray()
  @ApiProperty({
    description: 'Array of file paths or URLs for task attachments',
    example: ['file1.pdf', 'image.jpg', 'document.docx'],
    required: false,
    isArray: true,
  })
  attachments?: string[];

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus)
  @ApiProperty({
    description: 'Status of the task',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  @ApiProperty({
    description: 'Due date of the task in ISO format',
    example: '2023-12-31T23:59:59.999Z',
    required: false,
  })
  dueDate?: Date;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    description: 'ID of the user who owns this task',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'ID of the admin who edited this task (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  editedByAdminId?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @ApiProperty({
    description: 'When the task was created',
    example: '2023-12-31T23:59:59.999Z',
  })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  @ApiProperty({
    description: 'When the task was last updated',
    example: '2023-12-31T23:59:59.999Z',
  })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin?: User;

  @OneToMany(() => TaskNotification, (notification) => notification.task, {
    cascade: true,
  })
  notifications?: TaskNotification[];

  @OneToMany(() => TaskEditHistory, (history) => history.task, {
    cascade: true,
  })
  editHistory?: TaskEditHistory[];
}
