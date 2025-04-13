import { LuxonDatePipe } from '@core/pipes/luxon-date.pipe';
import { TaskStatus } from '@enums/task.enum';
import { ValidRoles } from '@enums/valid-roles';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskService } from '../services/task.service';
import { TaskController } from './task.controller';

describe('TaskController', () => {
  let taskController: TaskController;
  let taskService: TaskService;

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

  const mockTask = {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'This is a test task',
    status: TaskStatus.TODO,
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaskService = {
    create: jest.fn().mockResolvedValue(mockTask),
    findAll: jest.fn().mockResolvedValue({ tasks: [mockTask], total: 1 }),
    findOne: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    remove: jest
      .fn()
      .mockResolvedValue({ message: 'Task deleted successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        LuxonDatePipe,
      ],
    }).compile();

    taskController = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
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
      const files = [
        {
          fieldname: 'attachments',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 4,
        },
      ] as Express.Multer.File[];

      // Ejecutar método
      const result = await taskController.create(
        mockUser,
        createTaskDto,
        files,
      );

      // Verificar resultado
      expect(taskService.create).toHaveBeenCalledWith(
        mockUser,
        createTaskDto,
        expect.any(Array),
      );
      expect(result).toEqual(mockTask);
    });

    it('debería crear una tarea sin archivos adjuntos', async () => {
      // Preparar datos de prueba
      const createTaskDto: CreateTaskDto = {
        title: 'Nueva Tarea',
        description: 'Descripción de la tarea',
        status: TaskStatus.TODO,
      };

      // Ejecutar método sin archivos
      await taskController.create(mockUser, createTaskDto);

      // Verificar resultado
      expect(taskService.create).toHaveBeenCalledWith(
        mockUser,
        createTaskDto,
        [],
      );
    });
  });

  describe('findAll', () => {
    it('debería obtener todas las tareas con paginación', async () => {
      // Preparar datos de prueba
      const pagination = { page: 1, limit: 10 };

      // Ejecutar método
      const result = await taskController.findAll(mockUser, pagination);

      // Verificar resultado
      expect(taskService.findAll).toHaveBeenCalledWith(mockUser, pagination);
      expect(result).toEqual({ tasks: [mockTask], total: 1 });
    });
  });

  describe('findOne', () => {
    it('debería obtener una tarea por ID', async () => {
      // Ejecutar método
      const result = await taskController.findOne('test-task-id');

      // Verificar resultado
      expect(taskService.findOne).toHaveBeenCalledWith('test-task-id');
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    it('debería actualizar una tarea correctamente', async () => {
      // Preparar datos de prueba
      const updateTaskDto: UpdateTaskDto = {
        title: 'Tarea Actualizada',
        status: TaskStatus.IN_PROGRESS,
      };
      const files = [
        {
          fieldname: 'attachments',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 4,
        },
      ] as Express.Multer.File[];

      // Ejecutar método
      const result = await taskController.update(
        'test-task-id',
        mockUser,
        updateTaskDto,
        files,
      );

      // Verificar resultado
      expect(taskService.update).toHaveBeenCalledWith(
        mockUser,
        'test-task-id',
        updateTaskDto,
        expect.any(Array),
      );
      expect(result).toEqual(mockTask);
    });

    it('debería actualizar una tarea sin archivos adjuntos', async () => {
      // Preparar datos de prueba
      const updateTaskDto: UpdateTaskDto = {
        title: 'Tarea Actualizada',
      };

      // Ejecutar método sin archivos
      await taskController.update('test-task-id', mockUser, updateTaskDto);

      // Verificar resultado
      expect(taskService.update).toHaveBeenCalledWith(
        mockUser,
        'test-task-id',
        updateTaskDto,
        [],
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar una tarea correctamente', async () => {
      // Ejecutar método
      const result = await taskController.remove('test-task-id');

      // Verificar resultado
      expect(taskService.remove).toHaveBeenCalledWith('test-task-id');
      expect(result).toEqual({ message: 'Task deleted successfully' });
    });
  });
});
