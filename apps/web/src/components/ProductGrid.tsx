import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Beer, LayoutGrid, Plus } from "lucide-react";
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

export function ProductGrid({ onSelect, disabled }: { onSelect: (product: ProductOperational) => void; disabled?: boolean }) {
  const [searchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex h-full flex-col">
      <label htmlFor="product-search" className="sr-only">
        Buscar producto
      </label>
      <input
        id="product-search"
        placeholder="Buscar producto…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip label="Todas" icon={LayoutGrid} active={categoryId === null} onClick={() => setCategoryId(null)} />
        {categories?.map((c: Category) => (
          <CategoryChip key={c.id} label={c.name} emoji={c.icon} active={categoryId === c.id} onClick={() => setCategoryId(c.id)} />
        ))}
      </div>
      {isError && (
        <p className="rounded-md bg-red-900/40 px-3 py-2 text-sm text-red-200">No se pudieron cargar los productos.</p>
      )}
      {!isError && (loadingProducts || loadingCategories) && <p className="p-3 text-sm text-slate-400">Cargando catálogo…</p>}
      {!isError && !loadingProducts && filtered.length === 0 && (
        <p className="p-3 text-sm text-slate-500">No hay productos que coincidan con la búsqueda.</p>
      )}
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 content-start">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} disabled={disabled} onSelect={onSelect} />
        ))}
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
    <div className="overflow-hidden rounded-xl bg-slate-800">
      <div className="flex h-24 items-center justify-center bg-slate-900/60">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Beer className="h-8 w-8 text-slate-600" strokeWidth={1.5} />
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-semibold text-white">{product.name}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {product.activePromotionName ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-emerald-400">{formatMoney(product.effectivePriceCents)}</span>
                <span className="text-xs text-slate-500 line-through">{formatMoney(product.priceCents)}</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-sky-300">{formatMoney(product.priceCents)}</span>
            )}
          </div>
          <button
            disabled={isDisabled}
            onClick={() => onSelect(product)}
            aria-label={`Agregar ${product.name}`}
            className="touch-target flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
        {product.activePromotionName && <p className="mt-1 text-[10px] font-bold text-emerald-400">{product.activePromotionName}</p>}
        {badge && <p className={`mt-1 text-[10px] font-bold ${outOfStock ? "text-red-400" : "text-amber-400"}`}>{badge}</p>}
      </div>
    </div>
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
      className={`touch-target flex shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
        active ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {!Icon && emoji && <span>{emoji}</span>}
      {label}
    </button>
  );
}
