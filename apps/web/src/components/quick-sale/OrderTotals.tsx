import { formatMoney } from "../../lib/format";

export function OrderTotals({
  subtotalCents,
  discountCents,
  totalCents,
}: {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}) {
  return (
    <div className="space-y-1 border-t border-pos-borderSoft pt-3 text-sm text-pos-textSecondary">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span className="font-medium text-pos-textPrimary">{formatMoney(subtotalCents)}</span>
      </div>
      {discountCents > 0 && (
        <div className="flex justify-between">
          <span>Descuentos</span>
          <span className="font-medium text-pos-success">-{formatMoney(discountCents)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between pt-1.5">
        <span className="text-base font-semibold text-pos-textPrimary">Total</span>
        <span className="text-2xl font-bold text-pos-amber">{formatMoney(totalCents)}</span>
      </div>
    </div>
  );
}
