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
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip label="Todas" active={categoryId === null} onClick={() => setCategoryId(null)} />
        {categories?.map((c: Category) => (
          <CategoryChip key={c.id} label={c.name} active={categoryId === c.id} onClick={() => setCategoryId(c.id)} />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {filtered.map((product) => {
          const outOfStock = product.stockStatus === "OUT_OF_STOCK";
          const badge = STOCK_BADGE[product.stockStatus];
          return (
            <button
              key={product.id}
              disabled={disabled || outOfStock}
              onClick={() => onSelect(product)}
              className="touch-target flex flex-col items-start justify-between rounded-lg bg-slate-800 p-3 text-left hover:bg-slate-700 disabled:opacity-40"
            >
              <span className="text-sm font-semibold text-white">{product.name}</span>
              <div className="mt-2 flex w-full items-center justify-between">
                <span className="text-sm text-sky-300">{formatMoney(product.priceCents)}</span>
                {badge && (
                  <span className={`text-[10px] font-bold ${outOfStock ? "text-red-400" : "text-amber-400"}`}>{badge}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`touch-target shrink-0 rounded-full px-4 text-sm font-medium ${
        active ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
