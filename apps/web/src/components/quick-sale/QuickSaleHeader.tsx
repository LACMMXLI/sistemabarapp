import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Home, Zap, Search, SlidersHorizontal } from "lucide-react";

export type StockFilter = "ALL" | "AVAILABLE" | "OUT_OF_STOCK";

const FILTERS: { value: StockFilter; label: string }[] = [
  { value: "ALL", label: "Todos los productos" },
  { value: "AVAILABLE", label: "Solo disponibles" },
  { value: "OUT_OF_STOCK", label: "Solo agotados" },
];

export function QuickSaleHeader({
  search,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  stockFilter: StockFilter;
  onStockFilterChange: (filter: StockFilter) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const onOutside = (e: PointerEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [filtersOpen]);

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-pos-borderSoft bg-pos-surface/85 px-3 backdrop-blur-sm sm:px-4">
      <Link
        to="/"
        aria-label="Inicio"
        className="flex h-12 min-w-[48px] shrink-0 items-center gap-2 rounded-posMd border border-pos-amber/30 bg-pos-surfaceElevated px-3 text-sm font-medium text-pos-textPrimary transition hover:border-pos-amber/60 active:scale-95"
      >
        <Home className="h-5 w-5 text-pos-amber" strokeWidth={2} />
        <span className="hidden sm:inline">Inicio</span>
      </Link>

      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <Zap className="h-5 w-5 text-pos-amber" strokeWidth={2.2} />
        <h1 className="whitespace-nowrap text-lg font-bold text-pos-textPrimary">Venta rápida</h1>
      </div>

      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pos-textMuted" />
        <label htmlFor="quick-sale-search" className="sr-only">
          Buscar producto
        </label>
        <input
          id="quick-sale-search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar producto…"
          className="h-12 w-full rounded-posMd border border-pos-borderSoft bg-pos-surfaceElevated pl-10 pr-3 text-sm text-pos-textPrimary outline-none placeholder:text-pos-textMuted focus-visible:border-pos-amber/60"
        />
      </div>

      <div ref={filtersRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className={`flex h-12 items-center gap-2 rounded-posMd border px-3 text-sm font-medium transition active:scale-95 ${
            filtersOpen || stockFilter !== "ALL"
              ? "border-pos-cyan/60 bg-pos-cyan/10 text-pos-cyan"
              : "border-pos-borderSoft bg-pos-surfaceElevated text-pos-textSecondary hover:border-pos-cyan/40"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
        {filtersOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-posMd border border-pos-border bg-pos-surfaceElevated p-1.5 shadow-posPanel">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  onStockFilterChange(f.value);
                  setFiltersOpen(false);
                }}
                className={`flex w-full items-center rounded-posSm px-3 py-2.5 text-left text-sm font-medium transition ${
                  stockFilter === f.value ? "bg-pos-amber/15 text-pos-amber" : "text-pos-textSecondary hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <img
        src="/brand/logo_cheladas.jpg"
        alt="Las Cheladas de la 11"
        className="hidden h-12 w-12 shrink-0 rounded-full object-cover opacity-85 md:block"
        style={{ mixBlendMode: "screen" }}
        draggable={false}
      />
    </header>
  );
}
