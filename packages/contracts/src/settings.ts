import { z } from "zod";

export const appSettingsSchema = z.object({
  businessName: z.string(),
  sidebarName: z.string(),
  logoUrl: z.string().nullable(),
  updatedAt: z.string(),
});
export type AppSettingsDto = z.infer<typeof appSettingsSchema>;

export const updateAppSettingsSchema = z.object({
  businessName: z.string().min(1).max(80).optional(),
  sidebarName: z.string().min(1).max(40).optional(),
  logoUrl: z.string().url().nullable().optional(),
});
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
