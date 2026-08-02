import { useState } from "react";
import { NavLink } from "react-router-dom";
import type { PermissionKey } from "@barapp/config";
import { usePermission } from "../hooks/usePermission";
import { useAuthStore } from "../store/auth.store";
import { useLogout } from "../hooks/useAuth";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  iconBg: string;
  permission?: PermissionKey;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Inicio", icon: "🏠", iconBg: "bg-slate-700" },
  { to: "/venta-rapida", label: "Venta rápida", icon: "⚡", iconBg: "bg-amber-600", permission: "QUICK_SALE" },
  { to: "/mesas", label: "Mesas", icon: "🍽️", iconBg: "bg-cyan-600", permission: "TABLES_VIEW" },
  { to: "/billar", label: "Billar", icon: "🎱", iconBg: "bg-violet-600", permission: "BILLIARD_OPERATE" },
  { to: "/inventario", label: "Inventario", icon: "📦", iconBg: "bg-orange-600", permission: "INVENTORY_VIEW_FULL" },
  { to: "/productos", label: "Productos", icon: "🛒", iconBg: "bg-rose-600", permission: "PRODUCTS_MANAGE" },
  { to: "/promociones", label: "Promociones", icon: "🏷️", iconBg: "bg-yellow-600", permission: "PROMOTIONS_MANAGE" },
  { to: "/caja", label: "Caja", icon: "💰", iconBg: "bg-emerald-600", permission: "CASH_VIEW_SHIFTS" },
  { to: "/reportes", label: "Reportes", icon: "📊", iconBg: "bg-blue-600", permission: "REPORTS_VIEW" },
  { to: "/auditoria", label: "Auditoría", icon: "🗒️", iconBg: "bg-slate-600", permission: "AUDIT_VIEW" },
  { to: "/usuarios", label: "Usuarios", icon: "👤", iconBg: "bg-indigo-600", permission: "USERS_MANAGE" },
];

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };
  return { collapsed, toggle };
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const allowed = usePermission(item.permission ?? ("QUICK_SALE" as PermissionKey));
  if (item.permission && !allowed) return null;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        `mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 touch-target text-sm font-medium transition-colors ${
          isActive ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"
        }`
      }
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${item.iconBg}`}>
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const { collapsed, toggle } = useCollapsed();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <aside className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all ${collapsed ? "w-16" : "w-64"}`}>
      <div className="flex items-center gap-2 border-b border-slate-800 p-4">
        <span className="text-2xl">🍻</span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-white">Las Cheladas de la Once</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-400">Sistema POS</p>
          </div>
        )}
      </div>
      <button
        onClick={toggle}
        className="touch-target flex items-center justify-center text-xs text-slate-400 hover:text-white border-b border-slate-800"
        aria-label="Alternar barra lateral"
      >
        {collapsed ? "»" : "« Colapsar"}
      </button>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-lg bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-700/40 p-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-400">Buena chelada</p>
          <p className="text-xs text-amber-200">Buen ambiente</p>
          <p className="text-xs text-amber-200">Buenos momentos</p>
        </div>
      )}
      <div className="border-t border-slate-800 p-3">
        {!collapsed && user && (
          <p className="text-xs text-slate-400 mb-2 truncate">
            {user.fullName} · {user.role}
          </p>
        )}
        <button
          onClick={() => logout.mutate()}
          className="touch-target w-full rounded-md bg-slate-800 hover:bg-red-700 text-sm font-medium"
        >
          {collapsed ? "⏻" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
