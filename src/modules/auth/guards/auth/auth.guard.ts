import { IConfiguration } from '@core/config/IConfig/configuration';
import {
  INVALID_TOKEN,
  TOKEN_NOT_FOUND,
} from '@core/constants/messages/user/user.messages';
import { JwtPayload } from '@core/interfaces/jwt-payload.interface';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRepository } from '../../../shared/database/shared/repositories/user.repository';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtConstants: IConfiguration['jwtSecret'];

  constructor(
    private readonly configService: ConfigService,
    private jwtService: JwtService,
    private userRepository: UserRepository,
  ) {
    this.jwtConstants =
      this.configService.get<IConfiguration['jwtSecret']>('jwtSecret');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(TOKEN_NOT_FOUND);
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtConstants,
      });

      // Add user ID to request
      request['userId'] = payload.sub;

      // Optional: load full user object if needed
      const user = await this.userRepository.findOneById(payload.sub);
      request['user'] = user;

      return true;
    } catch (err) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
