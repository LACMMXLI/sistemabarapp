import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ORDER_POLL_INTERVAL_MS } from "@barapp/config";
import { fetchOrder, addOrderItem } from "../lib/ordersApi";
import { fetchTables } from "../lib/tablesApi";
import { ProductGrid } from "../components/ProductGrid";
import { OrderCartPanel } from "../components/OrderCartPanel";
import { BilliardControls } from "../components/BilliardControls";
import { ArrowLeft, ReceiptText, User } from "lucide-react";

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
    <div className="flex min-h-full flex-col md:h-full md:min-h-0">
      <header className="shrink-0 border-b border-border bg-pos-surface/90 p-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate("/mesas")} className="touch-target flex items-center gap-2 rounded-pos border border-border px-3 text-sm text-textMuted">
            <ArrowLeft className="h-4 w-4" /> Mesas
          </button>
          <div className="min-w-36 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-bold text-text"><ReceiptText className="h-5 w-5 text-primary" /> {table?.name ?? "Cuenta"}</h1>
            <p className="flex items-center gap-1 text-xs text-textMuted"><User className="h-3.5 w-3.5" /> {table?.openedByName ?? "Cuenta abierta"} · {order.status === "OPEN" ? "En servicio" : order.status}</p>
          </div>
          {table?.type === "BILLIARD" && <BilliardControls table={table} orderId={order.id} />}
        </div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
      <div className="min-h-[34rem] border-b border-border md:min-h-0 md:border-b-0 md:border-r">
        <ProductGrid
          disabled={!canEdit}
          onSelect={(product) =>
            addOrderItem(order.id, product.id).then(() => queryClient.invalidateQueries({ queryKey: ["order", order.id] }))
          }
        />
      </div>
      <div className="flex min-h-0 flex-col bg-surface">
        <OrderCartPanel
          order={order}
          capacity={table?.capacity}
          onBack={() => navigate("/mesas")}
          onCancelled={() => {
            queryClient.invalidateQueries({ queryKey: ["tables"] });
            navigate("/mesas");
          }}
          onPaid={() => {
            queryClient.invalidateQueries({ queryKey: ["order", order.id] });
            queryClient.invalidateQueries({ queryKey: ["tables"] });
            setTimeout(() => navigate(order.tableId ? "/mesas" : "/venta-rapida"), 800);
          }}
        />
      </div>
      </div>
    </div>
  );
}
