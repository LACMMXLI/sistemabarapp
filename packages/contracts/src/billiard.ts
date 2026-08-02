import { z } from "zod";
import { idempotencyKeySchema } from "./common";

export const billiardSessionStatusSchema = z.enum(["ACTIVE", "PAUSED", "FINISHED", "CANCELLED"]);
export type BilliardSessionStatus = z.infer<typeof billiardSessionStatusSchema>;

export const billiardRateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  pricePerHourCents: z.number().int(),
  pricePerMinuteCents: z.number().int(),
  minimumChargeCents: z.number().int(),
  active: z.boolean(),
});
export type BilliardRateDto = z.infer<typeof billiardRateSchema>;

export const createBilliardRateSchema = z.object({
  name: z.string().min(1).max(80),
  pricePerHourCents: z.number().int().min(0),
  minimumChargeCents: z.number().int().min(0).default(0),
});
export type CreateBilliardRateInput = z.infer<typeof createBilliardRateSchema>;

export const updateBilliardRateSchema = createBilliardRateSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateBilliardRateInput = z.infer<typeof updateBilliardRateSchema>;

export const billiardSessionSchema = z.object({
  id: z.string().uuid(),
  tableId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: billiardSessionStatusSchema,
  rateId: z.string().uuid(),
  appliedPricePerMinuteCents: z.number().int(),
  minimumChargeCents: z.number().int(),
  startedAt: z.string(),
  accumulatedSeconds: z.number().int(),
  currentSegmentStartedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  billedCents: z.number().int().nullable(),
  startedByName: z.string(),
  finishedByName: z.string().nullable(),
  cancelReason: z.string().nullable(),
});
export type BilliardSessionDto = z.infer<typeof billiardSessionSchema>;

export const startBilliardSessionSchema = z.object({
  rateId: z.string().uuid(),
  idempotencyKey: idempotencyKeySchema,
});

export const finishBilliardSessionSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
});

export const cancelBilliardSessionSchema = z.object({
  reason: z.string().min(1).max(200),
});
