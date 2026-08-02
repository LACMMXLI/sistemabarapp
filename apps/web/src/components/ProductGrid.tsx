import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: products } = useQuery({
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
      <input
        placeholder="Buscar producto…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip label="Todas" icon="🍹" active={categoryId === null} onClick={() => setCategoryId(null)} />
        {categories?.map((c: Category) => (
          <CategoryChip key={c.id} label={c.name} icon={c.icon} active={categoryId === c.id} onClick={() => setCategoryId(c.id)} />
        ))}
      </div>
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
          <span className="text-3xl opacity-40">🍺</span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-semibold text-white">{product.name}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-bold text-sky-300">{formatMoney(product.priceCents)}</span>
          <button
            disabled={isDisabled}
            onClick={() => onSelect(product)}
            aria-label={`Agregar ${product.name}`}
            className="touch-target flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white hover:bg-sky-500 disabled:opacity-40"
          >
            +
          </button>
        </div>
        {badge && <p className={`mt-1 text-[10px] font-bold ${outOfStock ? "text-red-400" : "text-amber-400"}`}>{badge}</p>}
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`touch-target flex shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium ${
        active ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"
      }`}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
