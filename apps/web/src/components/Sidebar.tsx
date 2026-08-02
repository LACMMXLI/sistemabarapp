import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, X, type LucideIcon } from "lucide-react";
import type { PermissionKey } from "@barapp/config";
import { usePermission } from "../hooks/usePermission";
import { useAuthStore } from "../store/auth.store";
import { useLogout } from "../hooks/useAuth";
import { fetchSettings } from "../lib/settingsApi";
import { NAV_ICONS } from "../lib/navIcons";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  permission?: PermissionKey;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Inicio", icon: NAV_ICONS.home, iconBg: "bg-slate-700" },
  { to: "/venta-rapida", label: "Venta rápida", icon: NAV_ICONS.quickSale, iconBg: "bg-amber-600", permission: "QUICK_SALE" },
  { to: "/mesas", label: "Mesas", icon: NAV_ICONS.tables, iconBg: "bg-cyan-600", permission: "TABLES_VIEW" },
  { to: "/billar", label: "Billar", icon: NAV_ICONS.billiard, iconBg: "bg-violet-600", permission: "BILLIARD_OPERATE" },
  { to: "/inventario", label: "Inventario", icon: NAV_ICONS.inventory, iconBg: "bg-orange-600", permission: "INVENTORY_VIEW_FULL" },
  { to: "/productos", label: "Productos", icon: NAV_ICONS.products, iconBg: "bg-rose-600", permission: "PRODUCTS_MANAGE" },
  { to: "/promociones", label: "Promociones", icon: NAV_ICONS.promotions, iconBg: "bg-yellow-600", permission: "PROMOTIONS_MANAGE" },
  { to: "/caja", label: "Caja", icon: NAV_ICONS.cash, iconBg: "bg-emerald-600", permission: "CASH_VIEW_SHIFTS" },
  { to: "/reportes", label: "Reportes", icon: NAV_ICONS.reports, iconBg: "bg-blue-600", permission: "REPORTS_VIEW" },
  { to: "/auditoria", label: "Auditoría", icon: NAV_ICONS.audit, iconBg: "bg-slate-600", permission: "AUDIT_VIEW" },
  { to: "/usuarios", label: "Usuarios", icon: NAV_ICONS.users, iconBg: "bg-indigo-600", permission: "USERS_MANAGE" },
  { to: "/configuracion", label: "Configuración", icon: NAV_ICONS.settings, iconBg: "bg-slate-500", permission: "SETTINGS_MANAGE" },
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

function SidebarLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const allowed = usePermission(item.permission ?? ("QUICK_SALE" as PermissionKey));
  if (item.permission && !allowed) return null;
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 touch-target text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
          isActive ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"
        }`
      }
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}>
        <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2} />
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { collapsed, toggle } = useCollapsed();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const sidebarName = settings?.sidebarName ?? "Las Cheladas de la Once";

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-200 md:relative md:z-auto md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-64"}`}
      >
        <div className="flex items-center gap-2 border-b border-slate-800 p-4">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
          ) : (
            <span className="text-2xl">🍻</span>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold leading-tight text-white">{sidebarName}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-400">Sistema POS</p>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="touch-target flex items-center justify-center rounded-md text-slate-400 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={toggle}
          className="touch-target hidden items-center justify-center text-xs text-slate-400 hover:text-white border-b border-slate-800 md:flex"
          aria-label="Alternar barra lateral"
        >
          {collapsed ? "»" : "« Colapsar"}
        </button>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
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
            className="touch-target flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 hover:bg-red-700 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
