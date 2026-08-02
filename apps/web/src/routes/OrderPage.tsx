import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ORDER_POLL_INTERVAL_MS } from "@barapp/config";
import { fetchOrder, addOrderItem } from "../lib/ordersApi";
import { fetchTables } from "../lib/tablesApi";
import { ProductGrid } from "../components/ProductGrid";
import { OrderCartPanel } from "../components/OrderCartPanel";
import { BilliardControls } from "../components/BilliardControls";

export function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: ORDER_POLL_INTERVAL_MS,
  });

  const { data: tables } = useQuery({ queryKey: ["tables"], queryFn: fetchTables, enabled: !!order?.tableId });
  const table = tables?.find((t) => t.id === order?.tableId);

  if (isLoading || !order) return <div className="p-6 text-slate-400">Cargando orden…</div>;

  const canEdit = order.status === "OPEN";

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[1fr_360px]">
      <div className="border-b border-slate-800 p-3 md:border-b-0 md:border-r">
        <ProductGrid
          disabled={!canEdit}
          onSelect={(product) =>
            addOrderItem(order.id, product.id).then(() => queryClient.invalidateQueries({ queryKey: ["order", order.id] }))
          }
        />
      </div>
      <div className="flex flex-col">
        {table?.type === "BILLIARD" && <div className="p-2"><BilliardControls table={table} orderId={order.id} /></div>}
        <OrderCartPanel
          order={order}
          onBack={() => navigate("/mesas")}
          onPaid={() => {
            queryClient.invalidateQueries({ queryKey: ["order", order.id] });
            queryClient.invalidateQueries({ queryKey: ["tables"] });
            setTimeout(() => navigate(order.tableId ? "/mesas" : "/venta-rapida"), 800);
          }}
        />
      </div>
    </div>
  );
}
