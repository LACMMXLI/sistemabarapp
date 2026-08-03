import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Plus } from "lucide-react";
import type { Category, ProductOperational } from "@barapp/contracts";
import { fetchCategories, fetchProducts } from "../lib/catalogApi";

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STOCK_BADGE: Record<ProductOperational["stockStatus"], string | null> = {
  AVAILABLE: null,
  UNTRACKED: null,
  LOW_STOCK: "Poco stock",
  OUT_OF_STOCK: "Agotado",
};

export function ProductGrid({
  onSelect,
  disabled,
  hideSearch = false,
}: {
  onSelect: (product: ProductOperational) => void;
  disabled?: boolean;
  hideSearch?: boolean;
}) {
  const [searchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  const { data: categories, isLoading: loadingCategories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const {
    data: products,
    isLoading: loadingProducts,
    isError,
  } = useQuery({
    queryKey: ["products", categoryId],
    queryFn: () => fetchProducts(categoryId ?? undefined),
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    return products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [products, search]);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(148px,2fr)_minmax(0,5fr)]">
      <aside className="flex gap-sm overflow-x-auto border-b border-border bg-surface p-md md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
        <CategoryChip label="Todas" icon={LayoutGrid} active={categoryId === null} onClick={() => setCategoryId(null)} />
        {categories?.map((c: Category) => (
          <CategoryChip key={c.id} label={c.name} emoji={c.icon} active={categoryId === c.id} onClick={() => setCategoryId(c.id)} />
        ))}
      </aside>
      <div className="flex min-h-0 flex-col bg-background p-md">
        {!hideSearch && (
          <>
            <label htmlFor="product-search" className="sr-only">
              Buscar producto
            </label>
            <input
              id="product-search"
              placeholder="Buscar producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-md touch-target rounded-xl border border-border bg-surface px-lg text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </>
        )}
        {isError && (
          <p className="mb-md rounded-xl bg-error p-md text-sm text-white">No se pudieron cargar los productos.</p>
        )}
        {!isError && (loadingProducts || loadingCategories) && <p className="p-md text-sm text-textMuted">Cargando catálogo…</p>}
        {!isError && !loadingProducts && filtered.length === 0 && (
          <p className="p-md text-sm text-textMuted">No hay productos que coincidan con la búsqueda.</p>
        )}
        <div className="product-grid-cards grid min-h-0 flex-1 content-start gap-md overflow-y-auto">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} disabled={disabled} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  disabled,
  onSelect,
}: {
  product: ProductOperational;
  disabled?: boolean;
  onSelect: (product: ProductOperational) => void;
}) {
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const badge = STOCK_BADGE[product.stockStatus];
  const isDisabled = disabled || outOfStock;

  return (
    <button
      disabled={isDisabled}
      onClick={() => onSelect(product)}
      aria-label={`Agregar ${product.name}`}
      className="product-card group flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-surfaceLight p-md text-left shadow-md hover:border-primary disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span className="line-clamp-2 text-sm font-medium text-text">{product.name}</span>
      <span className="flex items-end justify-between gap-sm">
        <span>
          {product.activePromotionName ? (
            <span className="flex flex-col">
              <span className="font-bold text-success">{formatMoney(product.effectivePriceCents)}</span>
              <span className="text-xs text-textMuted line-through">{formatMoney(product.priceCents)}</span>
            </span>
          ) : (
            <span className="font-bold text-primary">{formatMoney(product.priceCents)}</span>
          )}
          {product.activePromotionName && <span className="block text-[10px] font-bold text-success">{product.activePromotionName}</span>}
          {badge && <span className={`block text-[10px] font-bold ${outOfStock ? "text-error" : "text-primary"}`}>{badge}</span>}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-black group-hover:bg-primaryHover">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </span>
    </button>
  );
}

function CategoryChip({
  label,
  icon: Icon,
  emoji,
  active,
  onClick,
}: {
  label: string;
  icon?: typeof LayoutGrid;
  emoji?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`touch-target flex h-14 shrink-0 items-center gap-sm rounded-xl border px-md text-left text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary md:w-full ${
        active ? "border-primary bg-primary text-black" : "border-border bg-surfaceLight text-text hover:border-primary"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {!Icon && emoji && <span>{emoji}</span>}
      {label}
    </button>
  );
}
