import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "CAJERO", "MESERO"]);
export type Role = z.infer<typeof roleSchema>;

export const loginRequestSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const userPublicSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  fullName: z.string(),
  role: roleSchema,
  active: z.boolean(),
});
export type UserPublic = z.infer<typeof userPublicSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string(),
  user: userPublicSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const meResponseSchema = z.object({
  user: userPublicSchema,
});
