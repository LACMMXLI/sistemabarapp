import { z } from "zod";
import { idempotencyKeySchema } from "./common";

export const orderStatusSchema = z.enum(["OPEN", "PAYMENT_PENDING", "PAID", "CANCELLED", "REFUNDED"]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderKindSchema = z.enum(["QUICK_SALE", "TABLE"]);
export type OrderKind = z.infer<typeof orderKindSchema>;

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productNameSnapshot: z.string(),
  basePriceCents: z.number().int(),
  appliedPriceCents: z.number().int(),
  discountCents: z.number().int(),
  promotionId: z.string().uuid().nullable(),
  promotionNameSnapshot: z.string().nullable(),
  quantity: z.number().int(),
  totalCents: z.number().int(),
  note: z.string().nullable(),
  addedByName: z.string(),
  createdAt: z.string(),
  cancelledAt: z.string().nullable(),
});
export type OrderItemDto = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  id: z.string().uuid(),
  kind: orderKindSchema,
  status: orderStatusSchema,
  tableId: z.string().uuid().nullable(),
  tableName: z.string().nullable(),
  openedByName: z.string(),
  openedAt: z.string(),
  items: z.array(orderItemSchema),
  subtotalCents: z.number().int(),
  discountCents: z.number().int(),
  billiardChargeCents: z.number().int(),
  totalCents: z.number().int(),
  version: z.number().int(),
  cancelReason: z.string().nullable(),
  paidAt: z.string().nullable(),
});
export type OrderDto = z.infer<typeof orderSchema>;

export const addOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999).default(1),
  note: z.string().max(140).optional(),
  idempotencyKey: idempotencyKeySchema,
});
export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>;

export const updateOrderItemQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(999),
});
export type UpdateOrderItemQuantityInput = z.infer<typeof updateOrderItemQuantitySchema>;

export const cancelOrderItemSchema = z.object({
  reason: z.string().min(1).max(200),
});
export type CancelOrderItemInput = z.infer<typeof cancelOrderItemSchema>;

export const paymentMethodSchema = z.enum(["CASH", "CARD", "TRANSFER"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const payOrderSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  payments: z
    .array(
      z.object({
        method: paymentMethodSchema,
        amountCents: z.number().int().min(1),
        receivedCents: z.number().int().min(0).optional(),
      }),
    )
    .min(1),
});
export type PayOrderInput = z.infer<typeof payOrderSchema>;

export const payOrderResponseSchema = z.object({
  order: orderSchema,
  changeCents: z.number().int(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(200),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const createQuickSaleSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
});
export type CreateQuickSaleInput = z.infer<typeof createQuickSaleSchema>;
