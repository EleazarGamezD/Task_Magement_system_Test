import { ValidRoles } from '@enums/valid-roles';
import { UserRepository } from '@modules/shared/database/shared/repositories/user.repository';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from '../dto/auth-user-dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let configService: ConfigService;

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

  const mockUserRepository = {
    findOne: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'jwtSecret') return 'test-secret';
      if (key === 'jwtExpiresIn') return '1h';
      if (key === 'jwtRefreshSecret') return 'refresh-secret';
      if (key === 'jwtRefreshExpiresIn') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería iniciar sesión correctamente con credenciales válidas', async () => {
      // Mock para findOne que devuelve un usuario
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      // Mock para bcrypt.compare que devuelve true (contraseña correcta)
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Datos de prueba
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Ejecutar método
      const result = await authService.login(loginDto);

      // Verificaciones
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'test-jwt-token',
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
      });
    });

    it('debería lanzar UnauthorizedException si no se encuentra el usuario', async () => {
      // Mock para findOne que devuelve null (usuario no encontrado)
      mockUserRepository.findOne.mockResolvedValue(null);

      // Datos de prueba
      const loginDto: LoginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Verificar que lanza la excepción correcta
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      // Mock para findOne que devuelve un usuario
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      // Mock para bcrypt.compare que devuelve false (contraseña incorrecta)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Datos de prueba
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Verificar que lanza la excepción correcta
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario correctamente', async () => {
      // Mock para findOne que devuelve null (no hay usuarios existentes con ese email/username)
      mockUserRepository.findOne.mockResolvedValue(null);
      // Mock para bcrypt.hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      // Mock para create y save
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Datos de prueba
      const registerDto: CreateUserDto = {
        email: 'newuser@example.com',
        userName: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      // Ejecutar método
      const result = await authService.create(registerDto);

      // Verificaciones
      expect(userRepository.findOne).toHaveBeenCalledTimes(2); // Verifica email y username
      expect(bcrypt.hash).toHaveBeenCalledWith(
        registerDto.password,
        expect.any(Number),
      );
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          accessToken: 'test-jwt-token',
        }),
      );
    });

    it('debería lanzar ConflictException si el email ya está en uso', async () => {
      // Mock para findOne que devuelve un usuario (email ya en uso)
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      // Datos de prueba
      const registerDto: CreateUserDto = {
        email: 'test@example.com', // Email ya existente
        userName: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      // Verificar que lanza la excepción correcta
      await expect(authService.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debería lanzar ConflictException si el username ya está en uso', async () => {
      // Mock para findOne que devuelve null para email pero un usuario para username
      mockUserRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      // Datos de prueba
      const registerDto: CreateUserDto = {
        email: 'newuser@example.com',
        userName: 'testuser', // Username ya existente
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      // Verificar que lanza la excepción correcta
      await expect(authService.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateUser', () => {
    it('debería actualizar datos de usuario correctamente', async () => {
      // Mock para findOneById que devuelve un usuario
      mockUserRepository.findOneById.mockResolvedValue(mockUser);
      // Mock para update que devuelve éxito
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Datos de prueba
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      // Ejecutar método
      const result = await authService.updateUser(mockUser, updateUserDto);

      // Verificaciones
      expect(userRepository.findOneById).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining(updateUserDto),
      );
      expect(result).toEqual({ message: expect.any(String) });
    });

    it('debería actualizar la contraseña si se proporciona', async () => {
      // Mock para findOneById que devuelve un usuario
      mockUserRepository.findOneById.mockResolvedValue(mockUser);
      // Mock para update que devuelve éxito
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      // Mock para bcrypt.hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      // Datos de prueba
      const updateUserDto: UpdateUserDto = {
        password: 'newPassword123',
      };

      // Ejecutar método
      await authService.updateUser(mockUser, updateUserDto);

      // Verificaciones
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updateUserDto.password,
        expect.any(Number),
      );
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ password: 'newHashedPassword' }),
      );
    });
  });
});
