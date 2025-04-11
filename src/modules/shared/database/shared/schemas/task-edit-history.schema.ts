import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.schema';
import { User } from './user.schema';

@Entity()
export class TaskEditHistory {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'ID of the edit record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    description: 'ID of the task that was edited',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  taskId: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    description: 'ID of the admin who made the edit',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  adminId: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Description of changes made',
    example: 'Updated status from TODO to IN_PROGRESS',
    required: false,
  })
  changeDescription?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @ApiProperty({
    description: 'When the edit was made',
    example: '2024-04-10T00:00:00.000Z',
  })
  editedAt: Date;

  // Relations
  @ManyToOne(() => Task, (task) => task.editHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminId' })
  admin: User;
}
