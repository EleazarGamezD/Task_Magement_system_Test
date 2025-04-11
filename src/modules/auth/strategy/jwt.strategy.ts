import { IConfiguration } from '@app/core/config/IConfig/configuration';
import {
  TOKEN_NOT_FOUND,
  USER_NOT_ACTIVE,
} from '@app/core/constants/messages/user/user.messages';
import { CustomException } from '@app/core/exceptions-custom/custom-exception';
import { JwtPayload } from '@core/interfaces/jwt-payload.interface';
import { UserRepository } from '@modules/shared/database/shared/repositories/user.repository';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret =
      configService.get<IConfiguration['jwtSecret']>('jwtSecret');
    if (!jwtSecret) {
      throw new Error('JWT secret is not defined in the configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
    });
  }

  /**
   * Validates the payload of the JWT token
   *
   * @param payload - Contains the user id
   *
   * @throws UnauthorizedException if the user is not found
   * @throws CustomException if the user is not active
   *
   * @returns The user entity
   */
  async validate(payload: JwtPayload): Promise<User> {
    const { sub } = payload;

    const user = await this.userRepository.findOneById(sub);

    if (!user) throw new UnauthorizedException(TOKEN_NOT_FOUND);

    if (!user.isActive) {
      throw new CustomException(USER_NOT_ACTIVE);
    }

    return user;
  }
}
