import { HttpException } from "@nestjs/common";
import type { ErrorCode } from "@barapp/contracts";

export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}
