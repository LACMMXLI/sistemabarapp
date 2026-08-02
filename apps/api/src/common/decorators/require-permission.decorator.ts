import { SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "@barapp/config";

export const PERMISSION_KEY = "requiredPermission";

export const RequirePermission = (permission: PermissionKey) => SetMetadata(PERMISSION_KEY, permission);
