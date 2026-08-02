import { z } from "zod";
import { roleSchema } from "./auth";

export const createUserSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-z0-9._-]+$/),
  fullName: z.string().min(1).max(120),
  password: z.string().min(8).max(256),
  role: roleSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(256).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
