import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { DataSourceOptions } from 'typeorm';
dotenv.config();

export const commonDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'true',
  extra: {
    ssl: process.env.STAGE === 'prod' ? { rejectUnauthorized: false } : null,
  },
  synchronize: false, // IMPORTANT: never use synchronize:true in production , in this case for test purposes
  logging: process.env.BD_TYPEORM_LOGGING === 'true',
};

export const typeOrmConfig: TypeOrmModuleOptions = {
  ...commonDataSourceOptions,
  /*
   * Entities will be loaded automatically by the connection.
   * If you want to load entities explicitly, you can specify them here.
   */
  autoLoadEntities: true,
};
