import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";
import { ERROR_CODES } from "@barapp/contracts";
import { ApiException } from "../errors/api-exception";

/**
 * Formato uniforme de error en toda la API. Nunca expone stack traces ni
 * mensajes internos al cliente.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ApiException) {
      const body = exception.getResponse() as { code: string; message: string; details?: unknown };
      res.status(exception.getStatus()).json({ error: body });
      return;
    }

    if (exception instanceof ZodError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Datos inválidos.",
          details: { issues: exception.issues },
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message = typeof response === "string" ? response : (response as { message?: string }).message ?? exception.message;
      res.status(status).json({
        error: {
          code: status === 404 ? ERROR_CODES.NOT_FOUND : status === 401 ? ERROR_CODES.UNAUTHORIZED : status === 403 ? ERROR_CODES.FORBIDDEN : ERROR_CODES.VALIDATION_ERROR,
          message: Array.isArray(message) ? message.join(", ") : message,
        },
      });
      return;
    }

    this.logger.error("Unhandled error", exception instanceof Error ? exception.stack : String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "Error interno del servidor.",
      },
    });
  }
}
