import { corsConfig } from '@core/config/cors/cors.config';
import { setupSwagger } from '@core/config/swagger/swagger';
import { AllExceptionsFilter } from '@core/exceptions-filters/exception-filter';
import { HttpLoggerInterceptor } from '@core/interceptors/http-logger.interceptor';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger('Task Management System');

  // Use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      disableErrorMessages: false,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Increase the limit to 50mb
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
  if (process.env.NODE_ENV === 'development') {
    app.enableCors();
  } else {
    app.enableCors(corsConfig);
  }

  // Set global prefix
  app.setGlobalPrefix(`api/${process.env.API_VERSION}`);

  // Use global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Use global HTTP logger interceptor
  app.useGlobalInterceptors(new HttpLoggerInterceptor());

  // Configure Swagger
  setupSwagger(app);

  // Swagger JSON endpoint
  app.use('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sky-api-mww-swagger.json',
    );
    res.send(document);
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
