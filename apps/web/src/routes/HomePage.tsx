import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import type { PermissionKey } from "@barapp/config";
import { usePermission } from "../hooks/usePermission";
import { NAV_ICONS } from "../lib/navIcons";

interface QuickTile {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: PermissionKey;
  accent: string;
  bar: string;
  glow: string;
}

const TILES: QuickTile[] = [
  {
    to: "/venta-rapida",
    label: "Venta rápida",
    icon: NAV_ICONS.quickSale,
    permission: "QUICK_SALE",
    accent: "text-amber-400",
    bar: "bg-amber-400",
    glow: "shadow-[0_0_12px_2px_rgba(251,191,36,0.55)]",
  },
  {
    to: "/mesas",
    label: "Mesas",
    icon: NAV_ICONS.tables,
    permission: "TABLES_VIEW",
    accent: "text-sky-400",
    bar: "bg-sky-400",
    glow: "shadow-[0_0_12px_2px_rgba(56,189,248,0.55)]",
  },
  {
    to: "/billar",
    label: "Billar",
    icon: NAV_ICONS.billiard,
    permission: "BILLIARD_OPERATE",
    accent: "text-violet-400",
    bar: "bg-violet-400",
    glow: "shadow-[0_0_12px_2px_rgba(167,139,250,0.55)]",
  },
  {
    to: "/inventario",
    label: "Inventario",
    icon: NAV_ICONS.inventory,
    permission: "INVENTORY_VIEW_FULL",
    accent: "text-green-400",
    bar: "bg-green-400",
    glow: "shadow-[0_0_12px_2px_rgba(74,222,128,0.55)]",
  },
  {
    to: "/productos",
    label: "Productos",
    icon: NAV_ICONS.products,
    permission: "PRODUCTS_MANAGE",
    accent: "text-orange-400",
    bar: "bg-orange-400",
    glow: "shadow-[0_0_12px_2px_rgba(251,146,60,0.55)]",
  },
  {
    to: "/caja",
    label: "Caja",
    icon: NAV_ICONS.cash,
    permission: "CASH_VIEW_SHIFTS",
    accent: "text-cyan-400",
    bar: "bg-cyan-400",
    glow: "shadow-[0_0_12px_2px_rgba(34,211,238,0.55)]",
  },
  {
    to: "/reportes",
    label: "Reportes",
    icon: NAV_ICONS.reports,
    permission: "REPORTS_VIEW",
    accent: "text-amber-400",
    bar: "bg-amber-400",
    glow: "shadow-[0_0_12px_2px_rgba(251,191,36,0.55)]",
  },
];

function Tile({ to, label, icon: Icon, permission, accent, bar, glow }: QuickTile) {
  const allowed = usePermission(permission);
  if (!allowed) return null;

  return (
    <Link
      to={to}
      className="group flex min-w-0 touch-target flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/40 px-1 py-2.5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/25 hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-5"
    >
      <Icon className={`h-5 w-5 shrink-0 sm:h-7 sm:w-7 md:h-8 md:w-8 ${accent}`} strokeWidth={1.75} />
      <span className="text-center text-[10px] font-medium leading-tight text-white sm:text-xs md:text-sm">{label}</span>
      <span className={`h-[3px] w-6 rounded-full sm:w-9 md:w-10 ${bar} ${glow}`} />
    </Link>
  );
}

export function HomePage() {
  return (
    <div className="flex h-full min-h-full w-full flex-col items-center justify-center gap-6 px-4 pb-20 pt-6 sm:gap-10 sm:pb-24 sm:pt-10">
      <img
        src="/brand/logo_cheladas.jpg"
        alt="Las Cheladas de la 11"
        className="w-[32.5%] max-w-[163px] select-none drop-shadow-[0_0_35px_rgba(0,0,0,0.65)] sm:max-w-[188px] md:max-w-[213px]"
        style={{ mixBlendMode: "screen" }}
        draggable={false}
      />

      <nav
        aria-label="Accesos rápidos"
        className="grid w-full max-w-[880px] grid-cols-7 gap-1 rounded-2xl border border-white/10 bg-black/35 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-md sm:gap-3 sm:p-3"
      >
        {TILES.map((tile) => (
          <Tile key={tile.to} {...tile} />
        ))}
      </nav>
    </div>
  );
}
