import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ORDER_POLL_INTERVAL_MS } from "@barapp/config";
import { createOrRecoverQuickSale } from "../lib/quickSaleApi";
import { fetchOrder, addOrderItem } from "../lib/ordersApi";
import { ProductGrid } from "../components/ProductGrid";
import { OrderCartPanel } from "../components/OrderCartPanel";

export function QuickSalePage() {
  const queryClient = useQueryClient();

  const { data: bootstrapOrder } = useQuery({
    queryKey: ["quick-sale-bootstrap"],
    queryFn: createOrRecoverQuickSale,
    staleTime: Infinity,
  });

  const { data: order } = useQuery({
    queryKey: ["order", bootstrapOrder?.id],
    queryFn: () => fetchOrder(bootstrapOrder!.id),
    enabled: !!bootstrapOrder?.id,
    refetchInterval: ORDER_POLL_INTERVAL_MS,
  });

  if (!order) return <div className="p-6 text-slate-400">Preparando venta rápida…</div>;

  const canEdit = order.status === "OPEN";

  return (
    <div className="grid min-h-full grid-cols-1 md:h-full md:min-h-0 md:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
      <div className="min-h-[34rem] border-b border-border md:min-h-0 md:border-b-0 md:border-r">
        <ProductGrid
          hideSearch
          disabled={!canEdit}
          onSelect={(product) =>
            addOrderItem(order.id, product.id).then(() => queryClient.invalidateQueries({ queryKey: ["order", order.id] }))
          }
        />
      </div>
      <OrderCartPanel
        order={order}
        onPaid={() => {
          queryClient.removeQueries({ queryKey: ["quick-sale-bootstrap"] });
          queryClient.invalidateQueries({ queryKey: ["quick-sale-bootstrap"] });
        }}
      />
    </div>
  );
}
