import { z } from "zod";

export const auditLogSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  userName: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});
export type AuditLogDto = z.infer<typeof auditLogSchema>;

export const auditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  search: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export const auditLogListSchema = z.object({
  items: z.array(auditLogSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type AuditLogList = z.infer<typeof auditLogListSchema>;
