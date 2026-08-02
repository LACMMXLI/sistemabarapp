import { z } from "zod";

export const idSchema = z.string().uuid();

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}

/** Dinero SIEMPRE en centavos, enteros. Nunca punto flotante. */
export const moneySchema = z.number().int();

export const idempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9._-]+$/);

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  TABLE_OCCUPIED: "TABLE_OCCUPIED",
  ORDER_NOT_OPEN: "ORDER_NOT_OPEN",
  ORDER_STALE: "ORDER_STALE",
  CASH_SHIFT_NOT_OPEN: "CASH_SHIFT_NOT_OPEN",
  CASH_SHIFT_ALREADY_OPEN: "CASH_SHIFT_ALREADY_OPEN",
  PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED",
  BILLIARD_ALREADY_ACTIVE: "BILLIARD_ALREADY_ACTIVE",
  BILLIARD_NOT_ACTIVE: "BILLIARD_NOT_ACTIVE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
