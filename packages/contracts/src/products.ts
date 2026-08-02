import { z } from "zod";

export const productTypeSchema = z.enum(["STANDARD", "SERVICE", "BILLIARD_SERVICE"]);
export type ProductType = z.infer<typeof productTypeSchema>;

export const stockStatusSchema = z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "UNTRACKED"]);
export type StockStatus = z.infer<typeof stockStatusSchema>;

/** Vista completa: solo visible para ADMIN. */
export const productAdminSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  priceCents: z.number().int(),
  categoryId: z.string().uuid(),
  sku: z.string().nullable(),
  type: productTypeSchema,
  imageUrl: z.string().nullable(),
  active: z.boolean(),
  tracksInventory: z.boolean(),
  stockDeductPerSale: z.number().int(),
  lowStockThreshold: z.number().int(),
  sortOrder: z.number().int(),
  currentStock: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductAdmin = z.infer<typeof productAdminSchema>;

/** Vista operativa: cajero/mesero, sin existencias exactas. */
export const productOperationalSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  priceCents: z.number().int(),
  categoryId: z.string().uuid(),
  type: productTypeSchema,
  imageUrl: z.string().nullable(),
  active: z.boolean(),
  stockStatus: stockStatusSchema,
});
export type ProductOperational = z.infer<typeof productOperationalSchema>;

export const createProductSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(280).nullable().optional(),
  priceCents: z.number().int().min(0),
  categoryId: z.string().uuid(),
  sku: z.string().max(60).nullable().optional(),
  type: productTypeSchema.default("STANDARD"),
  imageUrl: z.string().url().nullable().optional(),
  tracksInventory: z.boolean().default(false),
  stockDeductPerSale: z.number().int().min(0).default(1),
  lowStockThreshold: z.number().int().min(0).default(5),
  initialStock: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema
  .omit({ initialStock: true })
  .partial()
  .extend({
    active: z.boolean().optional(),
  });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
