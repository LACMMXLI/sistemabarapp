import { Injectable } from "@nestjs/common";
import { ERROR_CODES, type CreateUserInput, type UpdateUserInput, type UserPublic } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { hashPassword } from "../../lib/password";
import { recordAudit } from "../../lib/audit";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<UserPublic[]> {
    const users = await this.prisma.user.findMany({ orderBy: { username: "asc" } });
    return users.map(toPublic);
  }

  async create(input: CreateUserInput, actor: AuthenticatedUser): Promise<UserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { username: input.username } });
    if (existing) {
      throw new ApiException(409, ERROR_CODES.CONFLICT, "Ya existe un usuario con ese nombre.");
    }
    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        fullName: input.fullName,
        role: input.role,
        passwordHash,
      },
    });
    await recordAudit(this.prisma, {
      action: "USER_CREATE",
      entityType: "User",
      entityId: user.id,
      userId: actor.userId,
      metadata: { username: user.username, role: user.role },
    });
    return toPublic(user);
  }

  async update(id: string, input: UpdateUserInput, actor: AuthenticatedUser): Promise<UserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Usuario no encontrado.");
    }

    const isDeactivating = input.active === false && existing.active;
    const isDemotingFromAdmin = input.role !== undefined && input.role !== "ADMIN" && existing.role === "ADMIN" && existing.active;

    if ((isDeactivating || isDemotingFromAdmin) && existing.role === "ADMIN") {
      if (id === actor.userId) {
        throw new ApiException(409, ERROR_CODES.CONFLICT, "No puedes desactivar o quitarte el rol de administrador a ti mismo.");
      }
      const otherActiveAdmins = await this.prisma.user.count({
        where: { role: "ADMIN", active: true, id: { not: id } },
      });
      if (otherActiveAdmins === 0) {
        throw new ApiException(409, ERROR_CODES.CONFLICT, "No puedes dejar el sistema sin al menos un administrador activo.");
      }
    }

    const passwordHash = input.password ? await hashPassword(input.password) : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: input.fullName,
        role: input.role,
        active: input.active,
        passwordHash,
      },
    });
    await recordAudit(this.prisma, {
      action: "USER_UPDATE",
      entityType: "User",
      entityId: user.id,
      userId: actor.userId,
      metadata: { changedFields: Object.keys(input) },
    });
    return toPublic(user);
  }
}

function toPublic(user: { id: string; username: string; fullName: string; role: string; active: boolean }): UserPublic {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role as UserPublic["role"],
    active: user.active,
  };
}
