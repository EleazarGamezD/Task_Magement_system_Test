export type IConfiguration = {
  appName: string | undefined;
  port: number | undefined;
  jwtSecret: string | undefined;
  jwtExpiration: string | undefined;
  jwtRefreshExpiration: string | undefined;
  minio: {
    endPoint: string | undefined;
    port: number | undefined;
    useSSL: boolean | undefined;
    accessKey: string | undefined;
    secretKey: string | undefined;
    region: string | undefined;
    bucket: string | undefined;
  };
  dbConfig: {
    host: string | undefined;
    port: number | undefined;
    username: string | undefined;
    password: string | undefined;
    database: string | undefined;
    ssl: boolean | undefined;
    synchronize: boolean | undefined;
    autoLoadEntities: boolean | undefined;
    logging: boolean | undefined;
  };
};

export default (): IConfiguration => ({
  appName: process.env.APP_NAME,
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION,
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
  minio: {
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || '9001', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_USER,
    secretKey: process.env.MINIO_PASSWORD,
    region: process.env.MINIO_REGION,
    bucket: process.env.MINIO_BUCKET,
  },
  dbConfig: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.STAGE === 'development',
    autoLoadEntities: true,
    logging: process.env.BD_TYPEORM_LOGGING === 'true',
  },
});
