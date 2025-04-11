import { IPaginate } from '@core/interfaces/paginate.interface';
import { CreateTaskDto } from '@modules/task/dto/create-task.dto';
import { UpdateTaskDto } from '@modules/task/dto/update-task.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../schemas/task.schema';

@Injectable()
export class TaskRepository extends Repository<Task> {
  private readonly logger = new Logger(TaskRepository.name);

  constructor(
    @InjectRepository(Task)
    taskRepository: Repository<Task>,
  ) {
    super(
      taskRepository.target,
      taskRepository.manager,
      taskRepository.queryRunner,
    );
  }

  /**
   * Creates a new task
   *
   * @param createTaskDto - Data to create a task
   * @returns Created task
   */
  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    this.logger.log('Creating task');
    const task = this.create(createTaskDto);
    return await this.save(task);
  }

  /**
   * Finds all tasks with pagination
   *
   * @param pagination - Pagination parameters
   * @returns Tasks and total count
   */
  async findAllWithPagination(
    { page = 1, limit = 10 }: IPaginate,
    userId?: string,
  ): Promise<{ tasks: Task[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('task');

    if (userId) {
      queryBuilder.where('task.userId = :userId', { userId });
    }

    // Add pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    queryBuilder.orderBy('task.createdAt', 'DESC');

    // Execute query
    const [tasks, total] = await queryBuilder.getManyAndCount();

    return { tasks, total };
  }

  /**
   * Finds a task by ID
   *
   * @param id - Task ID
   * @returns Found task or null
   */
  async findTaskById(id: string): Promise<Task | null> {
    this.logger.log(`Finding task with id ${id}`);
    return await this.findOne({ where: { id } });
  }

  /**
   * Updates a task
   *
   * @param id - Task ID
   * @param updateTaskDto - Data to update
   * @returns Number of affected rows
   */
  async updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<number> {
    this.logger.log(`Updating task with id ${id}`);
    const result = await this.update(id, updateTaskDto);
    return result.affected || 0;
  }

  /**
   * Removes a task
   *
   * @param id - Task ID
   * @returns Number of affected rows
   */
  async removeTask(id: string): Promise<number> {
    this.logger.log(`Removing task with id ${id}`);
    const result = await this.delete(id);
    return result.affected || 0;
  }
}
