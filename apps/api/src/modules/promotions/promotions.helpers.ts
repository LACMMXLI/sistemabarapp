import type { Prisma, PrismaClient } from "@prisma/client";
import { toBusinessTimeParts } from "../../lib/timezone";

type Tx = PrismaClient | Prisma.TransactionClient;

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  appliedPriceCents: number;
  discountCents: number;
}

/** Precio fijo = discountValue tope al precio base; porcentaje = descuento redondeado. Nunca negativo. */
export function calcAppliedPrice(
  discountType: "FIXED_PRICE" | "PERCENTAGE",
  discountValue: number,
  basePriceCents: number,
): number {
  if (discountType === "FIXED_PRICE") {
    return Math.min(discountValue, basePriceCents);
  }
  return Math.max(0, basePriceCents - Math.round((basePriceCents * discountValue) / 100));
}

/**
 * Evalúa qué promoción activa aplica a un producto en este instante, usando
 * America/Tijuana (nunca la hora del dispositivo). Sin acumulación: si hay
 * varias vigentes, gana la de mayor prioridad; en caso de empate, la que
 * produzca el menor precio.
 */
export async function resolveApplicablePromotion(
  tx: Tx,
  params: { productId: string; categoryId: string; basePriceCents: number; at: Date },
): Promise<AppliedPromotion | null> {
  const { dayOfWeek, timeHHmm } = toBusinessTimeParts(params.at);

  const candidates = await tx.promotion.findMany({
    where: {
      active: true,
      startTime: { lte: timeHHmm },
      endTime: { gte: timeHHmm },
      daysOfWeek: { has: dayOfWeek },
      OR: [
        { startDate: null },
        { startDate: { lte: params.at } },
      ],
      AND: [
        {
          OR: [{ endDate: null }, { endDate: { gte: params.at } }],
        },
        {
          OR: [
            { products: { some: { productId: params.productId } } },
            { categories: { some: { categoryId: params.categoryId } } },
          ],
        },
      ],
    },
  });

  if (candidates.length === 0) return null;

  const evaluated = candidates.map((promo) => {
    const appliedPriceCents = calcAppliedPrice(promo.discountType, promo.discountValue, params.basePriceCents);
    return {
      promotionId: promo.id,
      promotionName: promo.name,
      priority: promo.priority,
      appliedPriceCents,
      discountCents: params.basePriceCents - appliedPriceCents,
    };
  });

  evaluated.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.appliedPriceCents - b.appliedPriceCents;
  });

  const winner = evaluated[0];
  if (!winner) return null;
  return {
    promotionId: winner.promotionId,
    promotionName: winner.promotionName,
    appliedPriceCents: winner.appliedPriceCents,
    discountCents: winner.discountCents,
  };
}
