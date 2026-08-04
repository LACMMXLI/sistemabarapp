import { GlassWater, Minus, Plus, Trash2 } from "lucide-react";
import type { OrderItemDto } from "@barapp/contracts";
import { formatMoney } from "../../lib/format";

export function CartItem({
  item,
  disabled,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: OrderItemDto;
  disabled?: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-pos-borderSoft py-2.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-posSm bg-pos-surfaceElevated text-pos-textMuted">
        <GlassWater className="h-5 w-5" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-pos-textPrimary">{item.productNameSnapshot}</p>
        <p className="text-sm font-bold text-pos-amber">{formatMoney(item.totalCents)}</p>
        {item.promotionNameSnapshot && <p className="text-[10px] font-semibold text-pos-success">{item.promotionNameSnapshot}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onDecrease}
          aria-label="Disminuir cantidad"
          className="flex h-9 w-9 items-center justify-center rounded-posSm border border-pos-borderSoft bg-pos-surfaceElevated text-pos-textPrimary transition hover:border-pos-border active:scale-95 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-pos-textPrimary">{item.quantity}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={onIncrease}
          aria-label="Aumentar cantidad"
          className="flex h-9 w-9 items-center justify-center rounded-posSm border border-pos-borderSoft bg-pos-surfaceElevated text-pos-textPrimary transition hover:border-pos-border active:scale-95 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Quitar ${item.productNameSnapshot}`}
          className="flex h-9 w-9 items-center justify-center rounded-posSm border border-pos-danger/30 bg-pos-danger/10 text-pos-danger transition hover:border-pos-danger/60 active:scale-95 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
