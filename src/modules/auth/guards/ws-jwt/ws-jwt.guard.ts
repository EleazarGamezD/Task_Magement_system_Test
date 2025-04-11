import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();

    // If we already validated in handleConnection
    if (client.data.userId) {
      return true;
    }

    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new WsException('Unauthorized - No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwtSecret'),
      });

      client.data.userId = payload.sub;
      return true;
    } catch (error) {
      throw new WsException('Unauthorized - Invalid token');
    }
  }
}
