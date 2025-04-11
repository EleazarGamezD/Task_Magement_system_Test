import { IConfiguration } from '@core/config/IConfig/configuration';
import { entities } from '@core/tools/database/utils/data-source';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig =
          (configService.get<IConfiguration['dbConfig']>(
            'dbConfig',
          ) as IConfiguration['dbConfig']) ?? {};
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          ssl: dbConfig.ssl,
          synchronize: false, // IMPORTANT: never use synchronize:true in production
          entities: entities,
          autoLoadEntities: false, // Set to false to avoid auto-loading entities from modules, instead use db:sync command
          logging: dbConfig.logging,
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
