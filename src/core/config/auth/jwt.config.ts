import { IConfiguration } from '@core/config/IConfig/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return {
      secret: configService.get<IConfiguration['jwtSecret']>('jwtSecret'),
      signOptions: {
        expiresIn:
          configService.get<IConfiguration['jwtExpiration']>('jwtExpiration') ||
          '2h',
      },
    };
  },
};
