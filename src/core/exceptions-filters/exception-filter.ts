import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface HttpExceptionResponse {
  message: string;
  statusCode: number;
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * Handles all exceptions thrown within the application.
   * Converts exceptions to an HTTP response with a JSON payload.
   *
   * @param exception - The exception that was thrown.
   * @param host - The execution context, providing details about the request.
   *
   * This method checks if the exception is an instance of HttpException. If so,
   * it retrieves the HTTP status code from the exception; otherwise, it defaults
   * to 500 (Internal Server Error). The response is then sent with a JSON object
   * containing the status code, a timestamp, the request path, and a message
   * detailing the error or a generic message for non-HTTP exceptions.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as HttpExceptionResponse).message ||
          exception.message
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString() + `UTC`,
      path: request.url,
      message,
    });
  }
}
