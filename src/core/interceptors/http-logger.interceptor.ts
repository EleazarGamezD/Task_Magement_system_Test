import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP-LOGGER');

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl, ip, body } = request;

    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(`[START] ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // Only log body for POST/PUT/PATCH requests and when not empty
    if (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      Object.keys(body || {}).length > 0
    ) {
      // Don't log sensitive fields like passwords
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.verbose(`Request body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.log(
            `[END] ${method} ${originalUrl} - ${response.statusCode} - ${duration}ms`,
          );

          // Log response data for debugging (optional)
          if (process.env.NODE_ENV === 'development') {
            this.logger.verbose(
              `Response body: ${this.truncateResponse(data)}`,
            );
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.error(
            `[ERROR] ${method} ${originalUrl} - ${error.status || 500} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanitizeBody(body: any): any {
    if (!body) return {};

    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    const result = { ...body };

    for (const field of sensitiveFields) {
      if (field in result) {
        result[field] = '******';
      }
    }

    return result;
  }
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  private truncateResponse(data: any): string {
    const str = JSON.stringify(data);
    return str.length > 1000 ? `${str.substring(0, 1000)}... (truncated)` : str;
  }
}
