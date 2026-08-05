import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { roleHasPermission, type PermissionKey } from "@barapp/config";
import { useAuthStore } from "../store/auth.store";
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

const OPERATION_TILES: QuickTile[] = [
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
];

const ADMINISTRATION_TILES: QuickTile[] = [
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
    to: "/categorias",
    label: "Categorías",
    icon: NAV_ICONS.categories,
    permission: "PRODUCTS_MANAGE",
    accent: "text-fuchsia-400",
    bar: "bg-fuchsia-400",
    glow: "shadow-[0_0_12px_2px_rgba(232,121,249,0.55)]",
  },
  {
    to: "/promociones",
    label: "Promociones",
    icon: NAV_ICONS.promotions,
    permission: "PROMOTIONS_MANAGE",
    accent: "text-rose-400",
    bar: "bg-rose-400",
    glow: "shadow-[0_0_12px_2px_rgba(251,113,133,0.55)]",
  },
  {
    to: "/auditoria",
    label: "Auditoría",
    icon: NAV_ICONS.audit,
    permission: "AUDIT_VIEW",
    accent: "text-slate-300",
    bar: "bg-slate-300",
    glow: "shadow-[0_0_12px_2px_rgba(203,213,225,0.45)]",
  },
];

const SETTINGS_TILES: QuickTile[] = [
  {
    to: "/usuarios",
    label: "Usuarios",
    icon: NAV_ICONS.users,
    permission: "USERS_MANAGE",
    accent: "text-sky-400",
    bar: "bg-sky-400",
    glow: "shadow-[0_0_12px_2px_rgba(56,189,248,0.55)]",
  },
  {
    to: "/configuracion",
    label: "Configuración",
    icon: NAV_ICONS.settings,
    permission: "SETTINGS_MANAGE",
    accent: "text-violet-400",
    bar: "bg-violet-400",
    glow: "shadow-[0_0_12px_2px_rgba(167,139,250,0.55)]",
  },
];

type SectionKey = "administration" | "settings";

const SECTIONS = [
  {
    key: "administration" as const,
    label: "Administración",
    icon: NAV_ICONS.administration,
    items: ADMINISTRATION_TILES,
    accent: "text-emerald-400",
    bar: "bg-emerald-400",
    glow: "shadow-[0_0_12px_2px_rgba(52,211,153,0.55)]",
  },
  {
    key: "settings" as const,
    label: "Configuración",
    icon: NAV_ICONS.settings,
    items: SETTINGS_TILES,
    accent: "text-violet-400",
    bar: "bg-violet-400",
    glow: "shadow-[0_0_12px_2px_rgba(167,139,250,0.55)]",
  },
];

function Tile({ to, label, icon: Icon, accent, bar, glow }: QuickTile) {
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

function SectionTile({
  label,
  icon: Icon,
  accent,
  bar,
  glow,
  active,
  onClick,
}: Omit<(typeof SECTIONS)[number], "key" | "items"> & { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={active}
      aria-controls="home-nav-section"
      className={`group flex min-w-0 touch-target flex-col items-center gap-1 rounded-xl border px-1 py-2.5 backdrop-blur-sm transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-5 ${
        active ? "border-white/30 bg-black/60" : "border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/55"
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 sm:h-7 sm:w-7 md:h-8 md:w-8 ${accent}`} strokeWidth={1.75} />
      <span className="flex items-center gap-1 text-center text-[10px] font-medium leading-tight text-white sm:text-xs md:text-sm">
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${active ? "rotate-180" : ""}`} />
      </span>
      <span className={`h-[3px] w-6 rounded-full sm:w-9 md:w-10 ${bar} ${glow}`} />
    </button>
  );
}

export function HomePage() {
  const role = useAuthStore((s) => s.user?.role);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const canView = (tile: QuickTile) => !!role && roleHasPermission(role, tile.permission);
  const operationTiles = OPERATION_TILES.filter(canView);
  const sections = SECTIONS.map((section) => ({ ...section, items: section.items.filter(canView) })).filter((section) => section.items.length > 0);
  const selectedSection = sections.find((section) => section.key === activeSection);
  const SelectedSectionIcon = selectedSection?.icon;

  return (
    <div className="flex h-full min-h-full w-full flex-col items-center justify-center gap-6 px-4 py-6 sm:gap-10 sm:py-10">
      <img
        src="/brand/logo_cheladas.jpg"
        alt="Las Cheladas de la 11"
        className="w-[32.5%] max-w-[163px] select-none drop-shadow-[0_0_35px_rgba(0,0,0,0.65)] sm:max-w-[188px] md:max-w-[213px]"
        style={{ mixBlendMode: "screen" }}
        draggable={false}
      />

      <nav
        aria-label="Navegación principal"
        className="grid w-full max-w-[880px] grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/35 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-md sm:grid-cols-5 sm:gap-3 sm:p-3"
      >
        {operationTiles.map((tile) => (
          <Tile key={tile.to} {...tile} />
        ))}
        {sections.map((section) => (
          <SectionTile
            key={section.key}
            label={section.label}
            icon={section.icon}
            accent={section.accent}
            bar={section.bar}
            glow={section.glow}
            active={activeSection === section.key}
            onClick={() => setActiveSection((current) => current === section.key ? null : section.key)}
          />
        ))}

        {selectedSection && SelectedSectionIcon && (
          <section id="home-nav-section" className="col-span-3 mt-1 border-t border-white/10 pt-2 sm:col-span-5 sm:mt-0 sm:pt-3" aria-label={selectedSection.label}>
            <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 sm:text-sm">
              <SelectedSectionIcon className={`h-4 w-4 ${selectedSection.accent}`} />
              {selectedSection.label}
            </div>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
              {selectedSection.items.map((tile) => (
                <Tile key={tile.to} {...tile} />
              ))}
            </div>
          </section>
        )}
      </nav>
    </div>
  );
}
