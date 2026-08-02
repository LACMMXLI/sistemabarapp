import { createHash, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@barapp/contracts";
import type { RoleName } from "@barapp/config";
import { ApiException } from "../../common/errors/api-exception";
import { PrismaService } from "../../prisma/prisma.service";
import { verifyPassword } from "../../lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { checkRateLimit } from "../../lib/rate-limit";
import { recordAudit } from "../../lib/audit";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface LoginResult {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: { id: string; username: string; fullName: string; role: RoleName; active: boolean };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(username: string, password: string, rateLimitKey: string): Promise<LoginResult> {
    if (!checkRateLimit(rateLimitKey, 8, 60_000)) {
      throw new ApiException(429, ERROR_CODES.RATE_LIMITED, "Demasiados intentos. Intenta de nuevo en un minuto.");
    }

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !user.active) {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "Usuario o contraseña incorrectos.");
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "Usuario o contraseña incorrectos.");
    }

    const role = user.role as RoleName;
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken({
      sub: user.id,
      role,
      username: user.username,
    });

    const tokenId = randomUUID();
    const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = signRefreshToken({
      sub: user.id,
      tokenId,
    });

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      },
    });

    await recordAudit(this.prisma, {
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      userId: user.id,
    });

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      user: { id: user.id, username: user.username, fullName: user.fullName, role, active: user.active },
    };
  }

  async refresh(rawRefreshToken: string): Promise<LoginResult> {
    let payload: { sub: string; tokenId: string };
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "Sesión expirada. Inicia sesión de nuevo.");
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.tokenHash !== hashToken(rawRefreshToken)) {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "Sesión expirada. Inicia sesión de nuevo.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.active) {
      throw new ApiException(401, ERROR_CODES.UNAUTHORIZED, "Usuario inactivo o inexistente.");
    }

    const role = user.role as RoleName;
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken({
      sub: user.id,
      role,
      username: user.username,
    });

    const newTokenId = randomUUID();
    const { token: newRefreshToken, expiresAt: refreshTokenExpiresAt } = signRefreshToken({
      sub: user.id,
      tokenId: newTokenId,
    });

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedBy: newTokenId },
      }),
      this.prisma.refreshToken.create({
        data: {
          id: newTokenId,
          userId: user.id,
          tokenHash: hashToken(newRefreshToken),
          expiresAt: refreshTokenExpiresAt,
        },
      }),
    ]);

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt,
      user: { id: user.id, username: user.username, fullName: user.fullName, role, active: user.active },
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.tokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Token ya inválido: no hay nada que revocar.
    }
  }
}
