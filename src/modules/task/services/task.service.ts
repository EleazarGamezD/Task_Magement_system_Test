import { ImageDto } from '@core/common/dto/image/image.dto';
import { CustomException } from '@core/exceptions-custom/custom-exception';
import { IPaginate } from '@core/interfaces/paginate.interface';
import { BucketFolders } from '@enums/bucket-folders';
import { PermissionsEnum } from '@enums/permissions.enums';
import { ValidRoles } from '@enums/valid-roles';
import { TaskHistoricRepository } from '@modules/shared/database/shared/repositories/task-historic.repository';
import { TaskRepository } from '@modules/shared/database/shared/repositories/task.repository';
import { Task } from '@modules/shared/database/shared/schemas/task.schema';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { FileService } from '@modules/shared/files/file.service';
import { NotificationService } from '@modules/shared/notification/service/notification.service';
import { Injectable, Logger } from '@nestjs/common';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TaskService {
  logger = new Logger(TaskService.name);

  constructor(
    private readonly fileService: FileService,
    private readonly taskRepository: TaskRepository,
    private readonly taskEditHistoryRepository: TaskHistoricRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Creates a new task
   *
   * @param createTaskDto - Data to create a task
   * @returns Created task
   */
  async create(
    user: User,
    createTaskDto: CreateTaskDto,
    attachments: ImageDto[],
  ): Promise<Task> {
    this.logger.log('Creating task with data:', createTaskDto);

    let attachmentsUrl: string[] = [];
    if (attachments.length > 0) {
      const folder = BucketFolders.TASK_ATTACHMENTS;
      const { urls } = await this.fileService.saveMultipleImagesToMinio(
        attachments,
        folder,
      );
      attachmentsUrl = urls;
    }

    const taskPayload = {
      ...createTaskDto,
      userId: user.id,
      attachments: attachmentsUrl,
    };
    const task = await this.taskRepository.createTask(taskPayload);

    // Notify users about the new task
    await this.notificationService.notifyNewTask(task);

    return await this.mapAttachmentsToUrls(task);
  }

  /**
   * Finds all tasks with pagination
   *
   * @param pagination - Pagination parameters
   *
   * @returns Tasks and total count
   */
  async findAll(
    user: User,
    pagination: IPaginate,
  ): Promise<{ tasks: Task[]; total: number }> {
    this.logger.log(
      `Finding tasks for user ${user.id} with roles ${user.roles}`,
    );

    const canViewAllTasks = user.permissions?.includes(
      PermissionsEnum.READ_ALL_TASK,
    );
    let tasks: { tasks: Task[]; total: number };
    try {
      if (canViewAllTasks) {
        this.logger.log(
          'User has READ_ALL_TASK permission, returning all tasks',
        );
        tasks = await this.taskRepository.findAllWithPagination(pagination);
      } else {
        this.logger.log('User can only see their own tasks');
        tasks = await this.taskRepository.findAllWithPagination(
          pagination,
          user.id,
        );
      }
      //Map attachments to URLs
      tasks.tasks = await Promise.all(
        tasks.tasks.map(async (task) => {
          const taskWithUrls = await this.mapAttachmentsToUrls(task);
          return taskWithUrls;
        }),
      );
    } catch (error) {
      this.logger.error('Error fetching tasks:', error);
      throw new CustomException('Error fetching tasks');
    }

    return tasks;
  }

  /**
   * Finds a task by ID
   *
   * @param id - Task ID
   *
   * @returns Found task
   *
   * @throws {CustomException} - If task with given id not found
   */
  async findOne(id: string): Promise<Task> {
    this.logger.log(`Finding task with id ${id}`);
    try {
      const task = await this.taskRepository.findTaskById(id);

      if (!task) {
        this.logger.error(`Task with id ${id} not found`);
        throw new CustomException(`Task with id ${id} not found`);
      }
      // Map attachments to URLs
      if (task?.attachments && task.attachments?.length > 0) {
        const taskWithUrls = await this.mapAttachmentsToUrls(task);
        task.attachments = taskWithUrls.attachments;
      }

      return task;
    } catch (error) {
      this.logger.error(`Error finding task with id ${id}: ${error.message}`);
      throw new CustomException(
        `Error finding task with id ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Updates a task
   *
   * @param id - Task ID
   * @param updateTaskDto - Data to update
   *
   * @returns Updated task
   *
   * @throws {CustomException} - If task with given id not found
   * @throws {CustomException} - If any other error occurs when updating task
   */
  async update(
    user: User,
    id: string,
    updateTaskDto: UpdateTaskDto,
    attachments: ImageDto[],
  ): Promise<Task> {
    this.logger.log(`Updating task with id ${id}`);
    try {
      // First, check if the task exists and belongs to the user (for non-admins)
      const taskToUpdate = await this.taskRepository.findOne({
        where: { id },
        select: [
          'id',
          'userId',
          'status',
          'title',
          'description',
          'dueDate',
          'attachments',
        ],
      });

      if (!taskToUpdate) {
        throw new CustomException(`Task with ID ${id} not found`);
      }

      // Check if user has permission to update this task
      const isAdmin =
        user.roles.includes(ValidRoles.ADMIN) ||
        user.permissions.includes(PermissionsEnum.UPDATE_ALL_TASK);

      const isOwner = taskToUpdate.userId === user.id;

      if (!isAdmin && !isOwner) {
        this.logger.error(
          `User ${user.id} attempted to update task ${id} without permission`,
        );
        throw new CustomException(
          'You do not have permission to update this task',
        );
      }

      // IMPORTANT FIX: Always preserve existing attachments if none are provided
      if (taskToUpdate.attachments && taskToUpdate.attachments.length > 0) {
        // If no new attachments provided, keep existing ones
        if (!attachments || attachments.length === 0) {
          updateTaskDto.attachments = taskToUpdate.attachments;
        }
      }

      // Process attachments if provided, appending to existing ones
      if (attachments && attachments.length > 0) {
        const folder = BucketFolders.TASK_ATTACHMENTS;
        const { urls } = await this.fileService.saveMultipleImagesToMinio(
          attachments,
          folder,
        );

        // If the task already has attachments, append the new ones
        // Otherwise, use only the new ones
        if (taskToUpdate.attachments && taskToUpdate.attachments.length > 0) {
          updateTaskDto.attachments = [...taskToUpdate.attachments, ...urls];
        } else {
          updateTaskDto.attachments = urls;
        }
      }

      // Add admin ID to task if updated by admin
      if (isAdmin) {
        updateTaskDto.editedByAdminId = user.id;

        // Generate history record for admin edits
        const changeDescription = this.generateChangeDescription(
          taskToUpdate,
          updateTaskDto,
        );
        await this.createEditHistory(id, user.id, changeDescription);
      }

      // Perform the update
      const affected = await this.taskRepository.updateTask(id, updateTaskDto);

      if (affected === 0) {
        throw new CustomException(`Failed to update task with id ${id}`);
      }

      // Return updated task with attachment URLs processed
      const updatedTask = await this.taskRepository.findTaskById(id);
      if (!updatedTask) {
        throw new CustomException(`Task with id ${id} not found after update`);
      }

      // Notify users about the updated task
      await this.notificationService.notifyTaskUpdate(updatedTask);

      return await this.mapAttachmentsToUrls(updatedTask);
    } catch (error) {
      this.logger.error(`Error updating task with id ${id}: ${error.message}`);
      throw new CustomException(
        `Error updating task with id ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Creates a new edit history record for a task
   *
   * @param taskId - ID of the task being edited
   * @param adminId - ID of the admin making the edit
   * @param changeDescription - Description of the changes made
   *
   * @returns A promise that resolves when the record has been saved
   *
   * @throws {CustomException} - If there is an error saving the record
   */
  private async createEditHistory(
    taskId: string,
    adminId: string,
    changeDescription: string,
  ): Promise<void> {
    const historyRecord = {
      taskId,
      adminId,
      changeDescription,
    };

    await this.taskEditHistoryRepository.save(historyRecord);

    this.logger.log(
      `Created edit history for task ${taskId} by admin ${adminId}`,
    );
  }

  /**
   * Removes a task
   *
   * @param id - Task ID
   *
   * @returns Promise<void>
   *
   * @throws {CustomException} - If task with given id not found
   */
  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Removing task with id ${id}`);
    try {
      const taskToDelete = await this.taskRepository.findOne({
        where: { id },
        select: ['id', 'title', 'attachments'],
      });

      if (!taskToDelete) {
        this.logger.error(`Task with id ${id} not found`);
        throw new CustomException(`Task with id ${id} not found`);
      }

      // Store task title before deletion
      const taskTitle = taskToDelete.title;

      // Delete attachments from MinIO
      if (taskToDelete.attachments && taskToDelete.attachments.length > 0) {
        const folder = BucketFolders.TASK_ATTACHMENTS;
        await this.fileService.deleteImages(taskToDelete.attachments, folder);
      }

      const affected = await this.taskRepository.removeTask(id);

      if (affected === 0) {
        this.logger.error(`Task with id ${id} not found`);
        throw new CustomException(`Task with id ${id} not found`);
      }

      // Notify users about the deleted task
      await this.notificationService.notifyTaskDeletion(id, taskTitle);

      // Return a success message
      return { message: `Task with id ${id} successfully deleted` };
    } catch (error) {
      this.logger.error(`Error removing task with id ${id}: ${error.message}`);
      throw new CustomException(
        `Error removing task with id ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Generates a description of changes made to a task, based on the
   * current task data and the data in the update DTO.
   *
   * @param currentTask - The current state of the task
   * @param updateTaskDto - The data being used to update the task
   *
   * @returns A string description of the changes made
   */
  private generateChangeDescription(
    currentTask: Task,
    updateTaskDto: UpdateTaskDto,
  ): string {
    const changes: string[] = [];

    // Compare fields and track changes
    if (updateTaskDto.status && updateTaskDto.status !== currentTask.status) {
      changes.push(
        `Status changed from ${currentTask.status} to ${updateTaskDto.status}`,
      );
    }

    if (updateTaskDto.title && updateTaskDto.title !== currentTask.title) {
      changes.push(`Title updated`);
    }

    if (
      updateTaskDto.description &&
      updateTaskDto.description !== currentTask.description
    ) {
      changes.push(`Description updated`);
    }

    if (
      updateTaskDto.dueDate &&
      updateTaskDto.dueDate.toString() !== currentTask.dueDate?.toString()
    ) {
      changes.push(`Due date changed`);
    }

    // If no specific changes detected
    if (changes.length === 0) {
      return 'Task updated (no field changes detected)';
    }

    return changes.join(', ');
  }

  /**
   * Converts attachment filenames to full URLs
   *
   * @param task - The task with attachments to be processed
   * @returns The task with attachment URLs updated
   */
  async mapAttachmentsToUrls(task: Task): Promise<Task> {
    if (!task || !task.attachments || task.attachments.length === 0) {
      return task;
    }

    try {
      const attachmentUrls = await Promise.all(
        task.attachments.map((filename) =>
          this.fileService.getImageUrl(filename),
        ),
      );

      task.attachments = attachmentUrls as string[];

      return task;
    } catch (error) {
      this.logger.error(
        `Error mapping attachments to URLs: ${error.message}`,
        error.stack,
      );
      throw new CustomException('Failed to map attachments to URLs');
    }
  }
}
