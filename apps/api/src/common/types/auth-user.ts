import type { RoleName } from "@barapp/config";

export interface AuthenticatedUser {
  userId: string;
  username: string;
  role: RoleName;
}
