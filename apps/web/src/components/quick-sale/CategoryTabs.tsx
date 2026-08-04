import { Beer, LayoutGrid, Popcorn, Star, Tag, type LucideIcon } from "lucide-react";
import type { Category } from "@barapp/contracts";

/** Mapeo por nombre para categorías conocidas; cualquier categoría nueva cae en el ícono genérico sin tocar este componente. */
const ICON_BY_NAME: Record<string, LucideIcon> = {
  cerveza: Beer,
  botanas: Popcorn,
  promociones: Star,
};

function iconForCategory(name: string): LucideIcon {
  return ICON_BY_NAME[name.trim().toLowerCase()] ?? Tag;
}

export function CategoryTabs({
  categories,
  categoryId,
  onSelect,
}: {
  categories: Category[] | undefined;
  categoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) {
  return (
    <nav
      aria-label="Categorías"
      className="flex shrink-0 gap-2 overflow-x-auto border-b border-pos-borderSoft bg-pos-bg/40 px-3 py-2.5 sm:px-4"
    >
      <CategoryTab label="Todas" icon={LayoutGrid} active={categoryId === null} onClick={() => onSelect(null)} />
      {categories?.map((c) => (
        <CategoryTab key={c.id} label={c.name} icon={iconForCategory(c.name)} active={categoryId === c.id} onClick={() => onSelect(c.id)} />
      ))}
    </nav>
  );
}

function CategoryTab({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-12 shrink-0 items-center gap-2 rounded-posMd border px-4 text-sm font-semibold transition active:scale-95 ${
        active
          ? "border-pos-amber bg-pos-amber/12 text-pos-amber"
          : "border-pos-borderSoft bg-pos-surface text-pos-textSecondary hover:border-pos-border hover:text-pos-textPrimary"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-pos-amber" : "text-pos-textMuted"}`} strokeWidth={2} />
      {label}
    </button>
  );
}
