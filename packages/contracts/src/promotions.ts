import { z } from "zod";

export const discountTypeSchema = z.enum(["FIXED_PRICE", "PERCENTAGE"]);
export type DiscountType = z.infer<typeof discountTypeSchema>;

/** 0=domingo ... 6=sábado (ISO-like, pero explícito para evitar ambigüedad). */
export const weekdaySchema = z.number().int().min(0).max(6);

export const promotionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  daysOfWeek: z.array(weekdaySchema),
  startTime: z.string(),
  endTime: z.string(),
  discountType: discountTypeSchema,
  discountValue: z.number().int(),
  priority: z.number().int(),
  productIds: z.array(z.string().uuid()),
  categoryIds: z.array(z.string().uuid()),
});
export type PromotionDto = z.infer<typeof promotionSchema>;

export const createPromotionSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(280).nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  daysOfWeek: z.array(weekdaySchema).min(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  discountType: discountTypeSchema,
  discountValue: z.number().int().min(0),
  priority: z.number().int().min(0).default(0),
  productIds: z.array(z.string().uuid()).default([]),
  categoryIds: z.array(z.string().uuid()).default([]),
});
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

export const updatePromotionSchema = createPromotionSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
