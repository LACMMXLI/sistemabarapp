import { z } from "zod";

export const reportsRangeQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  preset: z.enum(["TODAY", "YESTERDAY", "CUSTOM"]).default("TODAY"),
});
export type ReportsRangeQuery = z.infer<typeof reportsRangeQuerySchema>;

export const salesReportSchema = z.object({
  totalSalesCents: z.number().int(),
  orderCount: z.number().int(),
  averageTicketCents: z.number().int(),
  byPaymentMethod: z.array(z.object({ method: z.string(), totalCents: z.number().int() })),
  byHour: z.array(z.object({ hour: z.number().int(), totalCents: z.number().int() })),
  byEmployee: z.array(z.object({ userName: z.string(), totalCents: z.number().int() })),
});
export type SalesReportDto = z.infer<typeof salesReportSchema>;

export const productsReportSchema = z.object({
  topProducts: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      quantitySold: z.number().int(),
      revenueCents: z.number().int(),
    }),
  ),
  byCategory: z.array(
    z.object({ categoryId: z.string().uuid(), categoryName: z.string(), revenueCents: z.number().int() }),
  ),
});
export type ProductsReportDto = z.infer<typeof productsReportSchema>;

export const billiardReportSchema = z.object({
  sessionCount: z.number().int(),
  cancelledCount: z.number().int(),
  totalSeconds: z.number().int(),
  revenueCents: z.number().int(),
  byTable: z.array(
    z.object({ tableId: z.string().uuid(), tableName: z.string(), revenueCents: z.number().int(), sessionCount: z.number().int() }),
  ),
});
export type BilliardReportDto = z.infer<typeof billiardReportSchema>;
