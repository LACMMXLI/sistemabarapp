import { z } from "zod";

export const inventoryMovementTypeSchema = z.enum([
  "INITIAL",
  "PURCHASE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "SALE",
  "SALE_REVERSAL",
]);
export type InventoryMovementType = z.infer<typeof inventoryMovementTypeSchema>;

export const inventoryItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  currentStock: z.number().int(),
  lowStockThreshold: z.number().int(),
  isLow: z.boolean(),
});
export type InventoryItemDto = z.infer<typeof inventoryItemSchema>;

export const inventoryMovementSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  type: inventoryMovementTypeSchema,
  quantity: z.number().int(),
  resultingStock: z.number().int(),
  reason: z.string().nullable(),
  orderId: z.string().uuid().nullable(),
  userName: z.string(),
  createdAt: z.string(),
});
export type InventoryMovementDto = z.infer<typeof inventoryMovementSchema>;

export const createManualMovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT", "PURCHASE"]),
  quantity: z.number().int().min(1),
  reason: z.string().min(1).max(200),
});
export type CreateManualMovementInput = z.infer<typeof createManualMovementSchema>;
