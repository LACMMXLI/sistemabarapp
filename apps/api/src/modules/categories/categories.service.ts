import { Injectable } from "@nestjs/common";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeInactive: boolean): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return categories.map(toDto);
  }

  async create(input: CreateCategoryInput, actor: AuthenticatedUser): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        name: input.name,
        color: input.color ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder,
      },
    });
    await recordAudit(this.prisma, {
      action: "CATEGORY_CREATE",
      entityType: "Category",
      entityId: category.id,
      userId: actor.userId,
    });
    return toDto(category);
  }

  async update(id: string, input: UpdateCategoryInput, actor: AuthenticatedUser): Promise<Category> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Categoría no encontrada.");
    }
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        color: input.color,
        icon: input.icon,
        sortOrder: input.sortOrder,
        active: input.active,
      },
    });
    await recordAudit(this.prisma, {
      action: "CATEGORY_UPDATE",
      entityType: "Category",
      entityId: category.id,
      userId: actor.userId,
      metadata: { changedFields: Object.keys(input) },
    });
    return toDto(category);
  }
}

function toDto(category: {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    sortOrder: category.sortOrder,
    active: category.active,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
