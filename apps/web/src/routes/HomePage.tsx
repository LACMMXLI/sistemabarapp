import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import type { PermissionKey } from "@barapp/config";
import { usePermission } from "../hooks/usePermission";
import { useAuthStore } from "../store/auth.store";
import { fetchTables } from "../lib/tablesApi";
import { fetchSalesReport } from "../lib/reportsApi";
import { NAV_ICONS } from "../lib/navIcons";

const TILES: { to: string; label: string; icon: LucideIcon; permission: PermissionKey }[] = [
  { to: "/venta-rapida", label: "Venta rápida", icon: NAV_ICONS.quickSale, permission: "QUICK_SALE" },
  { to: "/mesas", label: "Mesas", icon: NAV_ICONS.tables, permission: "TABLES_VIEW" },
  { to: "/billar", label: "Billar", icon: NAV_ICONS.billiard, permission: "BILLIARD_OPERATE" },
  { to: "/inventario", label: "Inventario", icon: NAV_ICONS.inventory, permission: "INVENTORY_VIEW_FULL" },
  { to: "/productos", label: "Productos", icon: NAV_ICONS.products, permission: "PRODUCTS_MANAGE" },
  { to: "/caja", label: "Caja", icon: NAV_ICONS.cash, permission: "CASH_VIEW_SHIFTS" },
  { to: "/reportes", label: "Reportes", icon: NAV_ICONS.reports, permission: "REPORTS_VIEW" },
];

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const canViewTables = usePermission("TABLES_VIEW");
  const canViewReports = usePermission("REPORTS_VIEW");

  const { data: tables } = useQuery({ queryKey: ["tables"], queryFn: fetchTables, enabled: canViewTables });
  const { data: sales } = useQuery({ queryKey: ["report-sales", "TODAY"], queryFn: () => fetchSalesReport("TODAY"), enabled: canViewReports });

  const occupied = tables?.filter((t) => t.status === "OCCUPIED" || t.status === "BILLIARD_ACTIVE").length ?? 0;
  const billiardActive = tables?.filter((t) => t.status === "BILLIARD_ACTIVE").length ?? 0;
  const totalTables = tables?.length ?? 0;

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold text-white">Hola, {user?.fullName}</h1>

      {(canViewTables || canViewReports) && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {canViewTables && (
            <>
              <Stat label="Mesas ocupadas" value={`${occupied} / ${totalTables}`} />
              <Stat label="Billar activo" value={String(billiardActive)} />
            </>
          )}
          {canViewReports && (
            <>
              <Stat label="Ventas de hoy" value={sales ? `$${(sales.totalSalesCents / 100).toFixed(2)}` : "—"} />
              <Stat label="Órdenes de hoy" value={sales ? String(sales.orderCount) : "—"} />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {TILES.map((tile) => (
          <Tile key={tile.to} {...tile} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900 p-3">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function Tile({ to, label, icon: Icon, permission }: (typeof TILES)[number]) {
  const allowed = usePermission(permission);
  if (!allowed) return null;
  return (
    <Link
      to={to}
      className="flex touch-target flex-col items-center justify-center gap-2 rounded-xl bg-slate-900 p-6 text-center hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      <Icon className="h-7 w-7 text-sky-400" strokeWidth={1.75} />
      <span className="text-sm font-medium text-slate-200">{label}</span>
    </Link>
  );
}
