import { z } from "zod";

export const tableTypeSchema = z.enum(["STANDARD", "BILLIARD"]);
export type DiningTableType = z.infer<typeof tableTypeSchema>;

export const tableStatusSchema = z.enum(["AVAILABLE", "OCCUPIED", "BILLIARD_ACTIVE", "OUT_OF_SERVICE"]);
export type DiningTableStatus = z.infer<typeof tableStatusSchema>;

export const diningTableSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: tableTypeSchema,
  status: tableStatusSchema,
  outOfService: z.boolean(),
  billiardRateId: z.string().uuid().nullable(),
  activeOrderId: z.string().uuid().nullable(),
  orderTotalCents: z.number().int().nullable(),
  openedByName: z.string().nullable(),
  openedAt: z.string().nullable(),
  billiardElapsedSeconds: z.number().int().nullable(),
  billiardStatus: z.enum(["ACTIVE", "PAUSED"]).nullable(),
});
export type DiningTable = z.infer<typeof diningTableSchema>;

export const createTableSchema = z.object({
  name: z.string().min(1).max(60),
  type: tableTypeSchema,
  billiardRateId: z.string().uuid().nullable().optional(),
});
export type CreateTableInput = z.infer<typeof createTableSchema>;

export const updateTableSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  billiardRateId: z.string().uuid().nullable().optional(),
  outOfService: z.boolean().optional(),
});
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
