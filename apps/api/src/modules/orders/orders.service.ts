import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  AddOrderItemInput,
  CancelOrderItemInput,
  OrderDto,
  PayOrderInput,
} from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import { deductInventoryForSale, reverseInventoryForSale } from "../inventory/inventory.helpers";
import { resolveApplicablePromotion } from "../promotions/promotions.helpers";
import { computeCashChange } from "../../lib/billing";
import { recomputeOrderTotals } from "./orders.helpers";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(orderId: string): Promise<OrderDto> {
    const order = await this.loadOrder(orderId);
    return toDto(order);
  }

  async createQuickSale(actor: AuthenticatedUser, idempotencyKey: string): Promise<OrderDto> {
    const existingOpen = await this.prisma.order.findFirst({
      where: { kind: "QUICK_SALE", status: "OPEN", openedById: actor.userId },
      orderBy: { createdAt: "desc" },
    });
    if (existingOpen) return this.getById(existingOpen.id);

    try {
      const created = await this.prisma.order.create({
        data: { kind: "QUICK_SALE", openedById: actor.userId, creationKey: idempotencyKey },
      });
      await recordAudit(this.prisma, { action: "ORDER_OPEN_QUICK_SALE", entityType: "Order", entityId: created.id, userId: actor.userId });
      return this.getById(created.id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const existing = await this.prisma.order.findUnique({ where: { creationKey: idempotencyKey } });
        if (existing) return this.getById(existing.id);
      }
      throw err;
    }
  }

  async addItem(orderId: string, input: AddOrderItemInput, actor: AuthenticatedUser): Promise<OrderDto> {
    await this.prisma.$transaction(async (tx) => {
      const existingByKey = await tx.orderItem.findUnique({
        where: { orderId_idempotencyKey: { orderId, idempotencyKey: input.idempotencyKey } },
      });
      if (existingByKey) return;

      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Orden no encontrada.");
      if (order.status !== "OPEN") {
        throw new ApiException(409, ERROR_CODES.ORDER_NOT_OPEN, "La orden ya no está abierta.");
      }

      const product = await tx.product.findUnique({ where: { id: input.productId } });
      if (!product || !product.active) {
        throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Producto no disponible.");
      }

      const now = new Date();
      const promotion = await resolveApplicablePromotion(tx, {
        productId: product.id,
        categoryId: product.categoryId,
        basePriceCents: product.priceCents,
        at: now,
      });

      const appliedPriceCents = promotion?.appliedPriceCents ?? product.priceCents;
      const discountCents = promotion?.discountCents ?? 0;

      const item = await tx.orderItem.create({
        data: {
          orderId,
          productId: product.id,
          productNameSnapshot: product.name,
          basePriceCents: product.priceCents,
          appliedPriceCents,
          discountCents,
          promotionId: promotion?.promotionId ?? null,
          promotionNameSnapshot: promotion?.promotionName ?? null,
          quantity: input.quantity,
          totalCents: appliedPriceCents * input.quantity,
          note: input.note ?? null,
          addedById: actor.userId,
          idempotencyKey: input.idempotencyKey,
        },
      });

      if (product.tracksInventory) {
        await deductInventoryForSale(tx, {
          productId: product.id,
          quantity: product.stockDeductPerSale * input.quantity,
          orderId,
          orderItemId: item.id,
          userId: actor.userId,
          allowNegative: false,
        });
      }

      await recomputeOrderTotals(tx, orderId);
    });

    return this.getById(orderId);
  }

  async updateItemQuantity(orderId: string, itemId: string, quantity: number, actor: AuthenticatedUser): Promise<OrderDto> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Orden no encontrada.");
      if (order.status !== "OPEN") {
        throw new ApiException(409, ERROR_CODES.ORDER_NOT_OPEN, "La orden ya no está abierta.");
      }

      const item = await tx.orderItem.findUnique({ where: { id: itemId }, include: { product: true } });
      if (!item || item.orderId !== orderId || item.cancelledAt) {
        throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Renglón no encontrado.");
      }

      const delta = quantity - item.quantity;
      if (delta !== 0 && item.product.tracksInventory) {
        const deltaStock = item.product.stockDeductPerSale * delta;
        if (deltaStock > 0) {
          await deductInventoryForSale(tx, {
            productId: item.productId,
            quantity: deltaStock,
            orderId,
            orderItemId: item.id,
            userId: actor.userId,
            allowNegative: false,
          });
        } else if (deltaStock < 0) {
          await reverseInventoryForSale(tx, {
            productId: item.productId,
            quantity: -deltaStock,
            orderId,
            orderItemId: item.id,
            userId: actor.userId,
          });
        }
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: { quantity, totalCents: item.appliedPriceCents * quantity },
      });

      await recomputeOrderTotals(tx, orderId);
    });

    return this.getById(orderId);
  }

  async cancelItem(orderId: string, itemId: string, input: CancelOrderItemInput, actor: AuthenticatedUser): Promise<OrderDto> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Orden no encontrada.");
      if (order.status !== "OPEN") {
        throw new ApiException(409, ERROR_CODES.ORDER_NOT_OPEN, "La orden ya no está abierta.");
      }

      const item = await tx.orderItem.findUnique({ where: { id: itemId }, include: { product: true } });
      if (!item || item.orderId !== orderId || item.cancelledAt) {
        throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Renglón no encontrado.");
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: { cancelledAt: new Date(), cancelledById: actor.userId, cancelReason: input.reason },
      });

      if (item.product.tracksInventory) {
        await reverseInventoryForSale(tx, {
          productId: item.productId,
          quantity: item.product.stockDeductPerSale * item.quantity,
          orderId,
          orderItemId: item.id,
          userId: actor.userId,
        });
      }

      await recomputeOrderTotals(tx, orderId);
      await recordAudit(tx, { action: "ORDER_ITEM_CANCEL", entityType: "OrderItem", entityId: itemId, userId: actor.userId, metadata: { reason: input.reason } });
    });

    return this.getById(orderId);
  }

  async pay(orderId: string, input: PayOrderInput, actor: AuthenticatedUser): Promise<{ order: OrderDto; changeCents: number }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const existingPayment = await tx.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existingPayment) {
        return { orderId: existingPayment.orderId, changeCents: existingPayment.changeCents };
      }

      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Orden no encontrada.");
      if (order.status !== "OPEN") {
        throw new ApiException(409, ERROR_CODES.PAYMENT_ALREADY_PROCESSED, "La orden ya fue procesada.");
      }

      const activeBilliard = await tx.billiardSession.findFirst({ where: { orderId, status: { in: ["ACTIVE", "PAUSED"] } } });
      if (activeBilliard) {
        throw new ApiException(409, ERROR_CODES.BILLIARD_ALREADY_ACTIVE, "Debes finalizar o cancelar el billar antes de cobrar.");
      }

      const openShift = await tx.cashShift.findFirst({ where: { status: "OPEN" }, orderBy: { openedAt: "desc" } });
      if (!openShift) {
        throw new ApiException(409, ERROR_CODES.CASH_SHIFT_NOT_OPEN, "No hay un turno de caja abierto.");
      }

      const paymentsTotal = input.payments.reduce((sum, p) => sum + p.amountCents, 0);
      if (paymentsTotal < order.totalCents) {
        throw new ApiException(400, ERROR_CODES.VALIDATION_ERROR, "El importe pagado es menor al total de la orden.");
      }

      const cashPayment = input.payments.find((p) => p.method === "CASH");
      let changeCents = 0;
      if (cashPayment) {
        const received = cashPayment.receivedCents ?? cashPayment.amountCents;
        if (received < cashPayment.amountCents) {
          throw new ApiException(400, ERROR_CODES.VALIDATION_ERROR, "El monto recibido en efectivo es menor al requerido.");
        }
        changeCents = computeCashChange(received, cashPayment.amountCents);
      } else if (paymentsTotal > order.totalCents) {
        throw new ApiException(400, ERROR_CODES.VALIDATION_ERROR, "El importe pagado excede el total sin un método en efectivo.");
      }

      await tx.payment.create({
        data: {
          orderId,
          totalCents: order.totalCents,
          changeCents,
          idempotencyKey: input.idempotencyKey,
          registeredById: actor.userId,
          shiftId: openShift.id,
          details: {
            create: input.payments.map((p) => ({
              method: p.method,
              amountCents: p.amountCents,
              receivedCents: p.receivedCents ?? null,
            })),
          },
        },
      });

      await tx.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: new Date() } });
      await recordAudit(tx, { action: "ORDER_PAY", entityType: "Order", entityId: orderId, userId: actor.userId, metadata: { totalCents: order.totalCents } });

      return { orderId, changeCents };
    });

    const order = await this.getById(result.orderId);
    return { order, changeCents: result.changeCents };
  }

  async cancelOrder(orderId: string, reason: string, actor: AuthenticatedUser): Promise<OrderDto> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: { where: { cancelledAt: null } } } });
      if (!order) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Orden no encontrada.");
      if (order.status !== "OPEN") {
        throw new ApiException(409, ERROR_CODES.ORDER_NOT_OPEN, "Solo se pueden cancelar órdenes abiertas.");
      }

      const activeBilliard = await tx.billiardSession.findFirst({ where: { orderId, status: { in: ["ACTIVE", "PAUSED"] } } });
      if (activeBilliard) {
        throw new ApiException(409, ERROR_CODES.BILLIARD_ALREADY_ACTIVE, "Debes finalizar o cancelar el billar antes de cancelar la orden.");
      }

      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product?.tracksInventory) {
          await reverseInventoryForSale(tx, {
            productId: item.productId,
            quantity: product.stockDeductPerSale * item.quantity,
            orderId,
            orderItemId: item.id,
            userId: actor.userId,
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason, cancelledById: actor.userId },
      });
      await recordAudit(tx, { action: "ORDER_CANCEL", entityType: "Order", entityId: orderId, userId: actor.userId, metadata: { reason } });
    });

    return this.getById(orderId);
  }

  private async loadOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        openedBy: true,
        items: { include: { addedBy: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Orden no encontrada.");
    }
    return order;
  }
}

function toDto(order: Prisma.OrderGetPayload<{ include: { table: true; openedBy: true; items: { include: { addedBy: true } } } }>): OrderDto {
  return {
    id: order.id,
    kind: order.kind,
    status: order.status,
    tableId: order.tableId,
    tableName: order.table?.name ?? null,
    openedByName: order.openedBy.fullName,
    openedAt: order.openedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      basePriceCents: item.basePriceCents,
      appliedPriceCents: item.appliedPriceCents,
      discountCents: item.discountCents,
      promotionId: item.promotionId,
      promotionNameSnapshot: item.promotionNameSnapshot,
      quantity: item.quantity,
      totalCents: item.totalCents,
      note: item.note,
      addedByName: item.addedBy.fullName,
      createdAt: item.createdAt.toISOString(),
      cancelledAt: item.cancelledAt?.toISOString() ?? null,
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    billiardChargeCents: order.billiardChargeCents,
    totalCents: order.totalCents,
    version: order.version,
    cancelReason: order.cancelReason,
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}
