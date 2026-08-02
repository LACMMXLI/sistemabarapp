import { Link } from "react-router-dom";
import type { PermissionKey } from "@barapp/config";
import { usePermission } from "../hooks/usePermission";
import { useAuthStore } from "../store/auth.store";

const TILES: { to: string; label: string; icon: string; permission: PermissionKey }[] = [
  { to: "/venta-rapida", label: "Venta rápida", icon: "⚡", permission: "QUICK_SALE" },
  { to: "/mesas", label: "Mesas", icon: "🍽️", permission: "TABLES_VIEW" },
  { to: "/inventario", label: "Inventario", icon: "📦", permission: "INVENTORY_VIEW_FULL" },
  { to: "/productos", label: "Productos", icon: "🛒", permission: "PRODUCTS_MANAGE" },
  { to: "/caja", label: "Caja", icon: "💰", permission: "CASH_VIEW_SHIFTS" },
  { to: "/reportes", label: "Reportes", icon: "📊", permission: "REPORTS_VIEW" },
];

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-white">Hola, {user?.fullName}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {TILES.map((tile) => (
          <Tile key={tile.to} {...tile} />
        ))}
      </div>
    </div>
  );
}

function Tile({ to, label, icon, permission }: (typeof TILES)[number]) {
  const allowed = usePermission(permission);
  if (!allowed) return null;
  return (
    <Link
      to={to}
      className="flex touch-target flex-col items-center justify-center gap-2 rounded-xl bg-slate-900 p-6 text-center hover:bg-slate-800"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-medium text-slate-200">{label}</span>
    </Link>
  );
}
