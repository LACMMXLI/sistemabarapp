import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, X } from "lucide-react";
import type { DiningTable, OrderDto } from "@barapp/contracts";
import { cancelOrderItem, updateOrderItemQuantity } from "../../lib/ordersApi";
import { ApiError } from "../../lib/api";
import { CartItem } from "./CartItem";
import { OrderTotals } from "./OrderTotals";
import { TableSelector } from "./TableSelector";
import { CheckoutActions } from "./CheckoutActions";

export function PersistentCart({
  order,
  tables,
  selectedTableId,
  onSelectTableId,
  onOrderSettled,
}: {
  order: OrderDto;
  tables: DiningTable[];
  selectedTableId: string | null;
  onSelectTableId: (tableId: string | null) => void;
  onOrderSettled: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const canEdit = order.status === "OPEN";
  const activeItems = order.items.filter((i) => !i.cancelledAt);
  const itemCount = activeItems.reduce((sum, i) => sum + i.quantity, 0);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["order", order.id] });

  const qtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateOrderItemQuantity(order.id, itemId, quantity),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo actualizar la cantidad."),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => cancelOrderItem(order.id, itemId, "Retirado por el operador"),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo eliminar el producto."),
  });

  const busy = qtyMutation.isPending || removeMutation.isPending;

  return (
    <section className="flex h-full min-h-0 flex-col bg-pos-surface">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-pos-borderSoft px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-pos-textPrimary" strokeWidth={2} />
          <h2 className="text-base font-bold text-pos-textPrimary">Carrito</h2>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-pos-amber px-1.5 text-xs font-bold text-black">
            {itemCount}
          </span>
        </div>
        <TableSelector tables={tables} value={selectedTableId} onChange={onSelectTableId} disabled={!canEdit} />
      </div>

      {error && (
        <button
          type="button"
          onClick={() => setError(null)}
          className="mx-3 mt-2 flex shrink-0 items-center justify-between gap-2 rounded-posSm border border-pos-danger/40 bg-pos-danger/10 px-3 py-2 text-left text-xs text-pos-danger sm:mx-4"
        >
          <span>{error}</span>
          <X className="h-4 w-4 shrink-0" />
        </button>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-4">
        {activeItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <ShoppingCart className="h-9 w-9 text-pos-textMuted" strokeWidth={1.5} />
            <p className="text-sm font-medium text-pos-textSecondary">El carrito está vacío</p>
            <p className="text-xs text-pos-textMuted">Toca un producto para agregarlo.</p>
          </div>
        ) : (
          activeItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              disabled={!canEdit || busy}
              onIncrease={() => qtyMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
              onDecrease={() => qtyMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
              onRemove={() => removeMutation.mutate(item.id)}
            />
          ))
        )}
      </div>

      <div className="shrink-0 px-3 pb-3 sm:px-4">
        <OrderTotals subtotalCents={order.subtotalCents} discountCents={order.discountCents} totalCents={order.totalCents} />
        {canEdit && (
          <CheckoutActions
            order={order}
            selectedTableId={selectedTableId}
            tables={tables}
            onPaid={onOrderSettled}
            onSentToTable={onOrderSettled}
            onCancelled={onOrderSettled}
          />
        )}
      </div>
    </section>
  );
}
