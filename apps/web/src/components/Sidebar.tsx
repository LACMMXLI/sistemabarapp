import { NavLink } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";
import type { PermissionKey } from "@barapp/config";
import { usePermission } from "../hooks/usePermission";
import { useLogout } from "../hooks/useAuth";
import { NAV_ICONS } from "../lib/navIcons";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionKey;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Inicio", icon: NAV_ICONS.home },
  { to: "/venta-rapida", label: "Venta rápida", icon: NAV_ICONS.quickSale, permission: "QUICK_SALE" },
  { to: "/mesas", label: "Mesas", icon: NAV_ICONS.tables, permission: "TABLES_VIEW" },
  { to: "/billar", label: "Billar", icon: NAV_ICONS.billiard, permission: "BILLIARD_OPERATE" },
  { to: "/inventario", label: "Inventario", icon: NAV_ICONS.inventory, permission: "INVENTORY_VIEW_FULL" },
  { to: "/productos", label: "Productos", icon: NAV_ICONS.products, permission: "PRODUCTS_MANAGE" },
  { to: "/promociones", label: "Promociones", icon: NAV_ICONS.promotions, permission: "PROMOTIONS_MANAGE" },
  { to: "/caja", label: "Caja", icon: NAV_ICONS.cash, permission: "CASH_VIEW_SHIFTS" },
  { to: "/reportes", label: "Reportes", icon: NAV_ICONS.reports, permission: "REPORTS_VIEW" },
  { to: "/auditoria", label: "Auditoría", icon: NAV_ICONS.audit, permission: "AUDIT_VIEW" },
  { to: "/usuarios", label: "Usuarios", icon: NAV_ICONS.users, permission: "USERS_MANAGE" },
  { to: "/configuracion", label: "Configuración", icon: NAV_ICONS.settings, permission: "SETTINGS_MANAGE" },
];

function DockLink({ item }: { item: NavItem }) {
  const allowed = usePermission(item.permission ?? ("QUICK_SALE" as PermissionKey));
  if (item.permission && !allowed) return null;
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      aria-label={item.label}
      title={item.label}
      className={({ isActive }) =>
        `dock-item touch-target relative flex items-center justify-center rounded-xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${
          isActive ? "border-blue-500 bg-blue-700 text-white" : "border-transparent text-slate-200 hover:bg-slate-700"
        }`
      }
    >
      <Icon className={`h-6 w-6 ${item.to === "/venta-rapida" ? "text-amber-400" : ""}`} strokeWidth={1.8} />
      <span className="dock-tooltip" role="tooltip">{item.label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const logout = useLogout();

  return (
    <div className="app-dock-shell" aria-label="Menú autoocultable">
      <nav className="app-dock" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => <DockLink key={item.to} item={item} />)}
        <span className="dock-separator" aria-hidden="true" />
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="dock-item touch-target relative flex items-center justify-center rounded-xl border border-transparent text-slate-300 transition hover:bg-red-800 hover:text-white"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="h-6 w-6" />
          <span className="dock-tooltip" role="tooltip">Cerrar sesión</span>
        </button>
      </nav>
    </div>
  );
}
