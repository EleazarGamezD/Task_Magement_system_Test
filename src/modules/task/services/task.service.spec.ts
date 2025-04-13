import { ImageDto } from '@core/common/dto/image/image.dto';
import { CustomException } from '@core/exceptions-custom/custom-exception';
import { IPaginate } from '@core/interfaces/paginate.interface';
import { BucketFolders } from '@enums/bucket-folders';
import { PermissionsEnum } from '@enums/permissions.enums';
import { TaskStatus } from '@enums/task.enum';
import { ValidRoles } from '@enums/valid-roles';
import { TaskHistoricRepository } from '@modules/shared/database/shared/repositories/task-historic.repository';
import { TaskRepository } from '@modules/shared/database/shared/repositories/task.repository';
import { Task } from '@modules/shared/database/shared/schemas/task.schema';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { FileService } from '@modules/shared/files/file.service';
import { NotificationService } from '@modules/shared/notification/service/notification.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let taskService: TaskService;
  let taskRepository: TaskRepository;
  let taskHistoricRepository: TaskHistoricRepository;
  let fileService: FileService;
  let notificationService: NotificationService;

  // Mock de usuario para pruebas
  const mockUser: User = {
    id: 'test-user-id',
    userName: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: [ValidRoles.USER],
    permissions: [],
    isActive: true,
    password: 'hashedPassword',
    profilePhoto: '',
    tasks: [],
    notifications: [],
    normalizeEmail: jest.fn(),
    comparePassword: jest.fn(),
    assignDefaultPermissions: jest.fn(),
    updatePermissionsOnRoleChange: jest.fn(),
  } as User;

  // Mock de admin para pruebas
  const mockAdmin: User = {
    id: 'test-admin-id',
    userName: 'testadmin',
    email: 'admin@example.com',
    firstName: 'Test',
    lastName: 'Admin',
    roles: [ValidRoles.ADMIN],
    permissions: [
      PermissionsEnum.READ_ALL_TASK,
      PermissionsEnum.UPDATE_ALL_TASK,
      PermissionsEnum.DELETE_ALL_TASK,
    ],
    isActive: true,
    password: 'hashedPassword',
    profilePhoto: '',
    tasks: [],
    notifications: [],
    normalizeEmail: jest.fn(),
    comparePassword: jest.fn(),
    assignDefaultPermissions: jest.fn(),
    updatePermissionsOnRoleChange: jest.fn(),
  } as User;

  // Mock de tarea para pruebas
  const mockTask: Task = {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'This is a test task',
    status: TaskStatus.TODO,
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task;

  // Mock de FileService
  const mockFileService = {
    saveMultipleImagesToMinio: jest
      .fn()
      .mockResolvedValue({ urls: ['url1', 'url2'] }),
    getImageUrl: jest
      .fn()
      .mockImplementation((filename) => `https://example.com/${filename}`),
    deleteImages: jest.fn().mockResolvedValue(undefined),
  };

  // Mock de TaskRepository
  const mockTaskRepository = {
    createTask: jest.fn().mockResolvedValue(mockTask),
    findAllWithPagination: jest
      .fn()
      .mockResolvedValue({ tasks: [mockTask], total: 1 }),
    findTaskById: jest.fn().mockResolvedValue(mockTask),
    updateTask: jest.fn().mockResolvedValue(1),
    removeTask: jest.fn().mockResolvedValue(1),
    findOne: jest.fn().mockResolvedValue(mockTask),
  };

  // Mock de TaskHistoricRepository
  const mockTaskHistoricRepository = {
    save: jest.fn().mockResolvedValue({}),
  };

  // Mock de NotificationService
  const mockNotificationService = {
    notifyNewTask: jest.fn().mockResolvedValue(undefined),
    notifyTaskUpdate: jest.fn().mockResolvedValue(undefined),
    notifyTaskDeletion: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: FileService, useValue: mockFileService },
        { provide: TaskRepository, useValue: mockTaskRepository },
        {
          provide: TaskHistoricRepository,
          useValue: mockTaskHistoricRepository,
        },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    taskService = module.get<TaskService>(TaskService);
    taskRepository = module.get<TaskRepository>(TaskRepository);
    taskHistoricRepository = module.get<TaskHistoricRepository>(
      TaskHistoricRepository,
    );
    fileService = module.get<FileService>(FileService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear una tarea correctamente', async () => {
      // Preparar datos de prueba
      const createTaskDto: CreateTaskDto = {
        title: 'Nueva Tarea',
        description: 'Descripción de la tarea',
        status: TaskStatus.TODO,
      };
      const attachments: ImageDto[] = [
        { file: 'base64data', extension: 'jpg' },
      ];

      // Ejecutar método
      const result = await taskService.create(
        mockUser,
        createTaskDto,
        attachments,
      );

      // Verificar resultado
      expect(fileService.saveMultipleImagesToMinio).toHaveBeenCalledWith(
        attachments,
        BucketFolders.TASK_ATTACHMENTS,
      );
      expect(taskRepository.createTask).toHaveBeenCalledWith({
        ...createTaskDto,
        userId: mockUser.id,
        attachments: ['url1', 'url2'],
      });
      expect(notificationService.notifyNewTask).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
    });

    it('debería crear una tarea sin adjuntos', async () => {
      // Preparar datos de prueba
      const createTaskDto: CreateTaskDto = {
        title: 'Nueva Tarea',
        description: 'Descripción de la tarea',
        status: TaskStatus.TODO,
      };
      const attachments = [];

      // Ejecutar método
      await taskService.create(mockUser, createTaskDto, attachments);

      // Verificar resultado
      expect(fileService.saveMultipleImagesToMinio).not.toHaveBeenCalled();
      expect(taskRepository.createTask).toHaveBeenCalledWith({
        ...createTaskDto,
        userId: mockUser.id,
        attachments: [],
      });
    });
  });

  describe('findAll', () => {
    it('debería obtener todas las tareas para un administrador', async () => {
      // Preparar datos de prueba
      const pagination: IPaginate = { page: 1, limit: 10 };

      // Ejecutar método
      const result = await taskService.findAll(mockAdmin, pagination);

      // Verificar resultado
      expect(taskRepository.findAllWithPagination).toHaveBeenCalledWith(
        pagination,
      );
      expect(result).toEqual({ tasks: [mockTask], total: 1 });
    });

    it('debería obtener solo tareas propias para un usuario regular', async () => {
      // Preparar datos de prueba
      const pagination: IPaginate = { page: 1, limit: 10 };

      // Ejecutar método
      await taskService.findAll(mockUser, pagination);

      // Verificar resultado
      expect(taskRepository.findAllWithPagination).toHaveBeenCalledWith(
        pagination,
        mockUser.id,
      );
    });
  });

  describe('findOne', () => {
    it('debería encontrar una tarea por ID', async () => {
      // Ejecutar método
      const result = await taskService.findOne('test-task-id');

      // Verificar resultado
      expect(taskRepository.findTaskById).toHaveBeenCalledWith('test-task-id');
      expect(result).toEqual(mockTask);
    });

    it('debería lanzar una excepción si la tarea no existe', async () => {
      // Preparar mock para simular tarea no encontrada
      jest.spyOn(taskRepository, 'findTaskById').mockResolvedValueOnce(null);

      // Verificar que se lanza la excepción
      await expect(taskService.findOne('non-existent-id')).rejects.toThrow(
        CustomException,
      );
    });

    it('debería procesar URLs de adjuntos si existen', async () => {
      // Preparar mock con tarea que tiene adjuntos
      const taskWithAttachments = {
        ...mockTask,
        attachments: ['file1.jpg', 'file2.jpg'],
      };
      jest
        .spyOn(taskRepository, 'findTaskById')
        .mockResolvedValueOnce(taskWithAttachments);

      // Ejecutar método
      const result = await taskService.findOne('test-task-id');

      // Verificar resultado
      expect(fileService.getImageUrl).toHaveBeenCalledTimes(2);
      expect(result.attachments).toEqual([
        'https://example.com/file1.jpg',
        'https://example.com/file2.jpg',
      ]);
    });
  });

  describe('update', () => {
    it('debería actualizar una tarea correctamente', async () => {
      // Preparar datos de prueba
      const updateTaskDto: UpdateTaskDto = {
        title: 'Tarea Actualizada',
        status: TaskStatus.IN_PROGRESS,
      };
      const attachments: ImageDto[] = [
        { file: 'base64data', extension: 'jpg' },
      ];

      // Ejecutar método
      const result = await taskService.update(
        mockUser,
        'test-task-id',
        updateTaskDto,
        attachments,
      );

      // Verificar resultado
      expect(taskRepository.updateTask).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining(updateTaskDto),
      );
      expect(notificationService.notifyTaskUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('debería lanzar excepción si el usuario no tiene permisos para actualizar', async () => {
      // Preparar datos con otro usuario como propietario
      const taskOwnedByOther = {
        ...mockTask,
        userId: 'other-user-id',
      };
      jest
        .spyOn(taskRepository, 'findOne')
        .mockResolvedValueOnce(taskOwnedByOther);

      // Preparar datos de prueba
      const updateTaskDto: UpdateTaskDto = {
        title: 'Tarea Actualizada',
      };

      // Verificar que se lanza la excepción
      await expect(
        taskService.update(mockUser, 'test-task-id', updateTaskDto, []),
      ).rejects.toThrow(CustomException);
    });

    it('debería permitir a un admin actualizar cualquier tarea', async () => {
      // Preparar datos con otro usuario como propietario
      const taskOwnedByOther = {
        ...mockTask,
        userId: 'other-user-id',
      };
      jest
        .spyOn(taskRepository, 'findOne')
        .mockResolvedValueOnce(taskOwnedByOther);

      // Preparar datos de prueba
      const updateTaskDto: UpdateTaskDto = {
        title: 'Tarea Actualizada por Admin',
      };

      // Ejecutar método con usuario admin
      await taskService.update(mockAdmin, 'test-task-id', updateTaskDto, []);

      // Verificar que se actualizó y se creó historial de edición
      expect(taskRepository.updateTask).toHaveBeenCalled();
      expect(taskHistoricRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debería eliminar una tarea correctamente', async () => {
      // Ejecutar método
      const result = await taskService.remove('test-task-id');

      // Verificar resultado
      expect(taskRepository.removeTask).toHaveBeenCalledWith('test-task-id');
      expect(notificationService.notifyTaskDeletion).toHaveBeenCalled();
      expect(result).toEqual({ message: expect.any(String) });
    });

    it('debería eliminar los archivos adjuntos al eliminar una tarea', async () => {
      // Preparar mock con tarea que tiene adjuntos
      const taskWithAttachments = {
        ...mockTask,
        attachments: ['file1.jpg', 'file2.jpg'],
      };
      jest
        .spyOn(taskRepository, 'findOne')
        .mockResolvedValueOnce(taskWithAttachments);

      // Ejecutar método
      await taskService.remove('test-task-id');

      // Verificar resultado
      expect(fileService.deleteImages).toHaveBeenCalledWith(
        ['file1.jpg', 'file2.jpg'],
        BucketFolders.TASK_ATTACHMENTS,
      );
    });

    it('debería lanzar excepción si la tarea no existe', async () => {
      // Preparar mock para simular tarea no eliminada
      jest.spyOn(taskRepository, 'removeTask').mockResolvedValueOnce(0);

      // Verificar que se lanza la excepción
      await expect(taskService.remove('non-existent-id')).rejects.toThrow(
        CustomException,
      );
    });
  });
});
