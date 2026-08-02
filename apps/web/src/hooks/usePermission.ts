import { roleHasPermission, type PermissionKey } from "@barapp/config";
import { useAuthStore } from "../store/auth.store";

/** Solo oculta UI. El backend siempre vuelve a validar cada endpoint. */
export function usePermission(permission: PermissionKey): boolean {
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return false;
  return roleHasPermission(role, permission);
}
