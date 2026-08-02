import { Injectable } from "@nestjs/common";
import type { CreatePromotionInput, PromotionDto, UpdatePromotionInput } from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PromotionDto[]> {
    const promotions = await this.prisma.promotion.findMany({
      include: { products: true, categories: true },
      orderBy: { priority: "desc" },
    });
    return promotions.map(toDto);
  }

  async create(input: CreatePromotionInput, actor: AuthenticatedUser): Promise<PromotionDto> {
    if (input.startTime >= input.endTime) {
      throw new ApiException(400, ERROR_CODES.VALIDATION_ERROR, "La hora de inicio debe ser menor a la hora de fin.");
    }
    const promotion = await this.prisma.promotion.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        discountType: input.discountType,
        discountValue: input.discountValue,
        priority: input.priority,
        products: { create: input.productIds.map((productId) => ({ productId })) },
        categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
      },
      include: { products: true, categories: true },
    });
    await recordAudit(this.prisma, { action: "PROMOTION_CREATE", entityType: "Promotion", entityId: promotion.id, userId: actor.userId });
    return toDto(promotion);
  }

  async update(id: string, input: UpdatePromotionInput, actor: AuthenticatedUser): Promise<PromotionDto> {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Promoción no encontrada.");
    }

    const promotion = await this.prisma.$transaction(async (tx) => {
      if (input.productIds) {
        await tx.promotionProduct.deleteMany({ where: { promotionId: id } });
      }
      if (input.categoryIds) {
        await tx.promotionCategory.deleteMany({ where: { promotionId: id } });
      }
      return tx.promotion.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          active: input.active,
          startDate: input.startDate ? new Date(input.startDate) : input.startDate,
          endDate: input.endDate ? new Date(input.endDate) : input.endDate,
          daysOfWeek: input.daysOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          discountType: input.discountType,
          discountValue: input.discountValue,
          priority: input.priority,
          products: input.productIds ? { create: input.productIds.map((productId) => ({ productId })) } : undefined,
          categories: input.categoryIds ? { create: input.categoryIds.map((categoryId) => ({ categoryId })) } : undefined,
        },
        include: { products: true, categories: true },
      });
    });

    await recordAudit(this.prisma, {
      action: "PROMOTION_UPDATE",
      entityType: "Promotion",
      entityId: id,
      userId: actor.userId,
      metadata: { changedFields: Object.keys(input) },
    });
    return toDto(promotion);
  }
}

function toDto(promotion: {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  startDate: Date | null;
  endDate: Date | null;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  discountType: "FIXED_PRICE" | "PERCENTAGE";
  discountValue: number;
  priority: number;
  products: { productId: string }[];
  categories: { categoryId: string }[];
}): PromotionDto {
  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description,
    active: promotion.active,
    startDate: promotion.startDate?.toISOString() ?? null,
    endDate: promotion.endDate?.toISOString() ?? null,
    daysOfWeek: promotion.daysOfWeek,
    startTime: promotion.startTime,
    endTime: promotion.endTime,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    priority: promotion.priority,
    productIds: promotion.products.map((p) => p.productId),
    categoryIds: promotion.categories.map((c) => c.categoryId),
  };
}
