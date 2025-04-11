import { PERMISSION_DENIED } from '@core/constants/messages/permissions/permissions.constants';
import {
  INVALID_TOKEN,
  TOKEN_NOT_FOUND,
} from '@core/constants/messages/user/user.messages';
import { JwtPayload } from '@core/interfaces/jwt-payload.interface';
import { PermissionsEnum } from '@enums/permissions.enums';
import { UserRepository } from '@modules/shared/database/shared/repositories/user.repository';
import { Task } from '@modules/shared/database/shared/schemas/task.schema';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TaskPermissionsGuard implements CanActivate {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
    private userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let user: User;
    const taskId = request.params.id;
    const method = request.method;
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(TOKEN_NOT_FOUND);
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwtSecret'),
      });

      // Find and return user
      const existingUser = await this.userRepository.findOneById(payload.sub);
      if (!existingUser) {
        throw new UnauthorizedException('Invalid user ID');
      }

      user = existingUser;

      request['user'] = user; // Attach user to request for later use
    } catch (err) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }
    // If no user found
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // For methods that don't need a specific task ID (like POST/create or GET all)
    if (!taskId) {
      // For POST/create, check if user has CREATE_OWN_TASK permission
      if (method === 'POST') {
        return this.hasPermission(user, PermissionsEnum.CREATE_OWN_TASK);
      }

      // For GET all, check if user has READ_ALL_TASK permission or READ_OWN_TASK permission
      if (method === 'GET') {
        return (
          this.hasPermission(user, PermissionsEnum.READ_ALL_TASK) ||
          this.hasPermission(user, PermissionsEnum.READ_OWN_TASK)
        );
      }

      return true;
    }

    // For methods that operate on a specific task ID (GET one, PUT, DELETE)
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // User with ALL permissions can do anything
    if (
      this.hasPermission(user, PermissionsEnum.READ_ALL_TASK) &&
      method === 'GET'
    ) {
      return true;
    }

    if (
      this.hasPermission(user, PermissionsEnum.UPDATE_ALL_TASK) &&
      method === 'PUT'
    ) {
      return true;
    }

    if (
      this.hasPermission(user, PermissionsEnum.UPDATE_ALL_TASK) &&
      method === 'PATCH'
    ) {
      return true;
    }

    if (
      this.hasPermission(user, PermissionsEnum.DELETE_ALL_TASK) &&
      method === 'DELETE'
    ) {
      return true;
    }

    // For own task operations, check ownership AND permission
    const isOwner = task.userId === user.id;

    if (isOwner) {
      if (
        method === 'GET' &&
        this.hasPermission(user, PermissionsEnum.READ_OWN_TASK)
      ) {
        return true;
      }

      if (
        method === 'PUT' &&
        this.hasPermission(user, PermissionsEnum.UPDATE_OWN_TASK)
      ) {
        return true;
      }

      if (
        method === 'PATCH' &&
        this.hasPermission(user, PermissionsEnum.UPDATE_OWN_TASK)
      ) {
        return true;
      }

      if (
        method === 'DELETE' &&
        this.hasPermission(user, PermissionsEnum.DELETE_OWN_TASK)
      ) {
        return true;
      }
    }

    throw new ForbiddenException(PERMISSION_DENIED);
  }

  private hasPermission(user: User, permission: PermissionsEnum): boolean {
    return user.permissions?.includes(permission) ?? false;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] =
      (request.headers['authorization'] as string)?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
