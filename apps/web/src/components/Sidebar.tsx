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
  permission: PermissionKey;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/venta-rapida", label: "Venta rápida", icon: "⚡", permission: "QUICK_SALE" },
  { to: "/mesas", label: "Mesas", icon: "🍽️", permission: "TABLES_VIEW" },
  { to: "/inventario", label: "Inventario", icon: "📦", permission: "INVENTORY_VIEW_FULL" },
  { to: "/productos", label: "Productos", icon: "🛒", permission: "PRODUCTS_MANAGE" },
  { to: "/promociones", label: "Promociones", icon: "🏷️", permission: "PROMOTIONS_MANAGE" },
  { to: "/caja", label: "Caja", icon: "💰", permission: "CASH_VIEW_SHIFTS" },
  { to: "/reportes", label: "Reportes", icon: "📊", permission: "REPORTS_VIEW" },
  { to: "/auditoria", label: "Auditoría", icon: "🗒️", permission: "AUDIT_VIEW" },
  { to: "/usuarios", label: "Usuarios", icon: "👤", permission: "USERS_MANAGE" },
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

function NavList({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="flex-1 overflow-y-auto py-2">
      {NAV_ITEMS.map((item) => (
        <SidebarLink key={item.to} item={item} collapsed={collapsed} />
      ))}
    </nav>
  );
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const allowed = usePermission(item.permission);
  if (!allowed) return null;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 touch-target text-sm font-medium transition-colors ${
          isActive ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"
        }`
      }
    >
      <span className="text-xl">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const { collapsed, toggle } = useCollapsed();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <aside className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all ${collapsed ? "w-16" : "w-56"}`}>
      <button
        onClick={toggle}
        className="touch-target flex items-center justify-center text-slate-400 hover:text-white border-b border-slate-800"
        aria-label="Alternar barra lateral"
      >
        {collapsed ? "»" : "« Colapsar"}
      </button>
      <NavList collapsed={collapsed} />
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
