import { Navigate, Outlet } from "react-router-dom";
import type { PermissionKey } from "@barapp/config";
import { useAuthStore } from "../store/auth.store";
import { usePermission } from "../hooks/usePermission";

export function ProtectedRoute({ permission }: { permission?: PermissionKey }) {
  const status = useAuthStore((s) => s.status);
  const allowed = usePermission(permission ?? ("QUICK_SALE" as PermissionKey));

  if (status === "idle") return null;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (permission && !allowed) {
    return (
      <div className="p-8 text-center text-slate-300">
        <p className="text-lg font-semibold">No tienes permiso para ver esta sección.</p>
      </div>
    );
  }
  return <Outlet />;
}
