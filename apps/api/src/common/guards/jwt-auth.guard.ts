import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ERROR_CODES } from "@barapp/contracts";
import { roleHasPermission, type PermissionKey, type RoleName } from "@barapp/config";
import { ApiException } from "../errors/api-exception";
import { verifyAccessToken } from "../../lib/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../types/auth-user";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";

declare module "express" {
  interface Request {
    authUser?: AuthenticatedUser;
  }
}

/**
 * Autentica el access token y, si el handler declara @RequirePermission,
 * valida el rol en el mismo paso. Debe ser un solo guard: separarlo en dos
 * (auth + permisos) rompe el orden de ejecución porque los guards globales
 * corren antes que los guards a nivel de controlador.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "No autenticado.");
    }

    let payload: { sub: string };
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "Sesión expirada o inválida.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "Usuario inactivo o inexistente.");
    }

    req.authUser = { userId: user.id, username: user.username, role: user.role as RoleName };

    const permission = this.reflector.getAllAndOverride<PermissionKey | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (permission && !roleHasPermission(req.authUser.role, permission)) {
      throw new ApiException(403, ERROR_CODES.FORBIDDEN, "No tienes permiso para esta acción.");
    }

    return true;
  }
}
