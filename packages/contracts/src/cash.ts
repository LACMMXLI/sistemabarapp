import { z } from "zod";
import { idempotencyKeySchema } from "./common";

export const cashShiftStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type CashShiftStatus = z.infer<typeof cashShiftStatusSchema>;

export const cashMovementTypeSchema = z.enum(["CASH_IN", "CASH_OUT"]);
export type CashMovementType = z.infer<typeof cashMovementTypeSchema>;

export const cashRegisterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
  openShiftId: z.string().uuid().nullable(),
});
export type CashRegisterDto = z.infer<typeof cashRegisterSchema>;

export const createCashRegisterSchema = z.object({
  name: z.string().min(1).max(60),
});

export const openCashShiftSchema = z.object({
  registerId: z.string().uuid(),
  openingFloatCents: z.number().int().min(0),
  idempotencyKey: idempotencyKeySchema,
});
export type OpenCashShiftInput = z.infer<typeof openCashShiftSchema>;

export const cashMovementSchema = z.object({
  id: z.string().uuid(),
  type: cashMovementTypeSchema,
  amountCents: z.number().int(),
  reason: z.string(),
  userName: z.string(),
  createdAt: z.string(),
});
export type CashMovementDto = z.infer<typeof cashMovementSchema>;

export const createCashMovementSchema = z.object({
  type: cashMovementTypeSchema,
  amountCents: z.number().int().min(1),
  reason: z.string().min(1).max(200),
});
export type CreateCashMovementInput = z.infer<typeof createCashMovementSchema>;

export const cashShiftSummarySchema = z.object({
  id: z.string().uuid(),
  registerId: z.string().uuid(),
  registerName: z.string(),
  status: cashShiftStatusSchema,
  openingFloatCents: z.number().int(),
  openedByName: z.string(),
  openedAt: z.string(),
  closedByName: z.string().nullable(),
  closedAt: z.string().nullable(),
  totalSalesCents: z.number().int(),
  cashSalesCents: z.number().int(),
  cardSalesCents: z.number().int(),
  transferSalesCents: z.number().int(),
  cashInCents: z.number().int(),
  cashOutCents: z.number().int(),
  refundsCashCents: z.number().int(),
  expectedCashCents: z.number().int(),
  countedCashCents: z.number().int().nullable(),
  differenceCents: z.number().int().nullable(),
});
export type CashShiftSummaryDto = z.infer<typeof cashShiftSummarySchema>;

export const closeCashShiftSchema = z.object({
  countedCashCents: z.number().int().min(0),
  idempotencyKey: idempotencyKeySchema,
});
export type CloseCashShiftInput = z.infer<typeof closeCashShiftSchema>;
