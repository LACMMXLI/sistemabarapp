import { GlassWater } from "lucide-react";
import type { ProductOperational } from "@barapp/contracts";
import { formatMoney } from "../../lib/format";

export function ProductCard({
  product,
  cartQuantity,
  disabled,
  onSelect,
}: {
  product: ProductOperational;
  cartQuantity: number;
  disabled?: boolean;
  onSelect: (product: ProductOperational) => void;
}) {
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const isDisabled = disabled || outOfStock;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(product)}
      aria-label={`Agregar ${product.name}, ${formatMoney(product.effectivePriceCents)}`}
      className="group relative flex flex-col overflow-hidden rounded-posLg border border-pos-borderSoft bg-pos-surface text-left shadow-posPanel transition hover:border-pos-amber/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pos-amber active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-pos-surfaceElevated">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-pos-textMuted">
            <GlassWater className="h-9 w-9" strokeWidth={1.4} />
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="rounded-posSm bg-pos-danger/90 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Agotado</span>
          </div>
        )}

        {!outOfStock && cartQuantity > 0 && (
          <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-pos-amber px-1.5 text-xs font-bold text-black shadow">
            ×{cartQuantity}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <span className="line-clamp-2 text-[13px] font-medium leading-tight text-pos-textPrimary">{product.name}</span>
        <span className="mt-auto text-base font-bold text-pos-amber">{formatMoney(product.effectivePriceCents)}</span>
        {product.activePromotionName && (
          <span className="text-[10px] font-semibold text-pos-success">{product.activePromotionName}</span>
        )}
      </div>
    </button>
  );
}
