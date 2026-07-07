import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      const statusCode = exception.getStatus();
      if (typeof responseBody === 'string') {
        return { statusCode, message: responseBody, error: exception.name };
      }
      const body = responseBody as Record<string, unknown>;
      return {
        statusCode,
        message: (body.message as string | string[]) ?? exception.message,
        error: (body.error as string) ?? exception.name,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Registro duplicado: ${(exception.meta?.target as string[] | undefined)?.join(', ') ?? 'campo único'}.`,
          error: 'Conflict',
        };
      }
      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado.',
          error: 'Not Found',
        };
      }
      if (exception.code === 'P2003') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referência inválida: verifique os IDs relacionados informados.',
          error: 'Bad Request',
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor.',
      error: 'Internal Server Error',
    };
  }
}
