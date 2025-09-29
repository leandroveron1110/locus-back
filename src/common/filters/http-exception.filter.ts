import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../dtos/response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let frontMessage: string | string[];
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      frontMessage =
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as any).message || 'Error inesperado';
    } else {
      frontMessage = 'Ocurrió un error inesperado. Intente nuevamente más tarde.';
    }

    // 🔥 Log como lo hace Nest por defecto
    if (exception instanceof HttpException) {
      // Para HttpException, loguea status + mensaje + stack si existe
      const errorResponse = exception.getResponse();
      this.logger.error(
        `${request.method} ${request.url} ${status} — ${JSON.stringify(errorResponse)}`,
        (exception as any).stack,
      );
    } else {
      // Para errores no HTTP, loguea todo el stack
      this.logger.error(
        `${request.method} ${request.url} ${status} — ${exception}`,
        (exception as any)?.stack,
      );
    }

    const responseBody: ApiResponse<null> = {
      data: null,
      error: {
        statusCode: status,
        message: Array.isArray(frontMessage) ? frontMessage.join(', ') : frontMessage,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
      success: false,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(responseBody);
  }
}
