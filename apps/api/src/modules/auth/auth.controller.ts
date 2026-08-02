import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { loginRequestSchema, type LoginResponse, type UserPublic } from "@barapp/contracts";
import { getEnv } from "../../lib/env";
import { getClientIp } from "../../lib/rate-limit";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";

const REFRESH_COOKIE_NAME = "refreshToken";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
    const env = getEnv();
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      domain: env.COOKIE_DOMAIN,
      expires: expiresAt,
      path: "/api/auth",
    });
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    const input = loginRequestSchema.parse(body);
    const rateLimitKey = `login:${getClientIp(req)}:${input.username}`;
    const result = await this.authService.login(input.username, input.password, rateLimitKey);
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
      user: toPublicUser(result.user),
    };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    const result = await this.authService.refresh(raw);
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
      user: toPublicUser(result.user),
    };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(raw);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() authUser: AuthUserParam): Promise<{ user: UserPublic }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: authUser.userId } });
    return {
      user: toPublicUser(user),
    };
  }
}

function toPublicUser(user: { id: string; username: string; fullName: string; role: string; active: boolean }): UserPublic {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role as UserPublic["role"],
    active: user.active,
  };
}
