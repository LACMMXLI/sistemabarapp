import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APP_TIMEZONE } from "@barapp/config";
import { fetchInventory, fetchInventoryMovements, createManualMovement } from "../lib/inventoryApi";
import { ApiError } from "../lib/api";
import { AlertTriangle, Boxes, PackageX, Plus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { FormModal } from "../components/FormModal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { timeZone: APP_TIMEZONE, dateStyle: "short", timeStyle: "short" });
}

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: items, isLoading: loadingItems, isError: errorItems } = useQuery({ queryKey: ["inventory"], queryFn: fetchInventory });
  const { data: movements, isLoading: loadingMovements } = useQuery({ queryKey: ["inventory-movements"], queryFn: fetchInventoryMovements });

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "PURCHASE">("ADJUSTMENT_IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [showMovement, setShowMovement] = useState(false);

  const adjustMutation = useMutation({
    mutationFn: () => createManualMovement({ productId, type, quantity, reason }),
    onSuccess: () => {
      setReason("");
      setError(null);
      setShowMovement(false);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento."),
  });

  return (
    <div className="space-y-4 p-3 md:p-4">
      <PageHeader title="Inventario" description="Existencias actuales y trazabilidad de movimientos." action={(
        <button onClick={() => setShowMovement(true)} className="touch-target flex items-center gap-2 rounded-pos bg-primary px-4 font-semibold text-black"><Plus className="h-4 w-4" /> Registrar movimiento</button>
      )} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Summary icon={<Boxes />} label="Productos controlados" value={items?.length ?? 0} />
        <Summary icon={<AlertTriangle />} label="Stock bajo" value={items?.filter((item) => item.isLow && item.currentStock > 0).length ?? 0} tone="amber" />
        <Summary icon={<PackageX />} label="Sin existencias" value={items?.filter((item) => item.currentStock <= 0).length ?? 0} tone="red" />
      </div>

      <section className="rounded-posLg border border-border bg-pos-surface/85 p-4 shadow-pos">
        <h2 className="mb-3 text-base font-semibold text-text">Existencias</h2>
        {loadingItems && <p className="text-sm text-slate-400">Cargando existencias…</p>}
        {errorItems && <p className="text-sm text-red-400">No se pudieron cargar las existencias.</p>}
        {!loadingItems && items?.length === 0 && <p className="text-sm text-slate-500">No hay productos con inventario controlado.</p>}
        {items && items.length > 0 && (
          <div className="overflow-x-auto rounded-pos border border-border">
            <table className="w-full min-w-[520px] text-sm text-text">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left">Producto</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Umbral</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="font-medium">{item.productName}</td>
                    <td className="text-right"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.currentStock <= 0 ? "bg-error/15 text-error" : item.isLow ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>{item.currentStock}</span></td>
                    <td className="text-right">{item.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>

      <section className="rounded-posLg border border-border bg-pos-surface/85 p-4 shadow-pos">
        <h2 className="mb-3 text-base font-semibold text-text">Historial de movimientos</h2>
        {loadingMovements && <p className="text-sm text-slate-400">Cargando historial…</p>}
        {!loadingMovements && movements?.length === 0 && <p className="text-sm text-slate-500">Sin movimientos registrados.</p>}
        <div className="max-h-[55vh] divide-y divide-border overflow-y-auto rounded-pos border border-border text-sm text-textMuted">
          {movements?.map((m) => (
            <div key={m.id} className="grid gap-1 p-3 sm:grid-cols-[minmax(180px,1fr)_140px_100px_minmax(220px,1fr)] sm:items-center">
              <span className="font-medium text-text">{m.productName}</span>
              <span>{movementLabel(m.type)}</span>
              <span className="font-mono font-semibold text-text">{m.quantity > 0 ? "+" : ""}{m.quantity} → {m.resultingStock}</span>
              <div className="text-xs text-textMuted sm:text-right">
                {m.userName} · {formatDate(m.createdAt)} {m.reason ? `· ${m.reason}` : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {showMovement && <FormModal title="Registrar movimiento" onClose={() => setShowMovement(false)} footer={(
        <><button onClick={() => setShowMovement(false)} className="touch-target flex-1 rounded-pos border border-border text-textMuted">Cancelar</button><button disabled={!productId || !reason || adjustMutation.isPending} onClick={() => adjustMutation.mutate()} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-40">{adjustMutation.isPending ? "Registrando…" : "Registrar"}</button></>
      )}>
        <div className="space-y-3">
          {error && <button type="button" className="block w-full rounded-pos bg-error/15 px-3 py-2 text-left text-sm text-error" onClick={() => setError(null)}>{error}</button>}
          <label className="block text-sm text-textMuted">Producto<select value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text"><option value="">Selecciona un producto…</option>{items?.map((item) => <option key={item.productId} value={item.productId}>{item.productName}</option>)}</select></label>
          <div className="grid grid-cols-[1fr_110px] gap-3"><label className="text-sm text-textMuted">Tipo<select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text"><option value="ADJUSTMENT_IN">Entrada</option><option value="ADJUSTMENT_OUT">Salida</option><option value="PURCHASE">Compra</option></select></label><label className="text-sm text-textMuted">Cantidad<input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label></div>
          <label className="block text-sm text-textMuted">Motivo<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo obligatorio" className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label>
        </div>
      </FormModal>}
    </div>
  );
}

function Summary({ icon, label, value, tone = "primary" }: { icon: ReactNode; label: string; value: number; tone?: "primary" | "amber" | "red" }) {
  const color = tone === "red" ? "text-error bg-error/10" : tone === "amber" ? "text-warning bg-warning/10" : "text-primary bg-primary/10";
  return <div className="flex items-center gap-3 rounded-posLg border border-border bg-pos-surface/85 p-4 shadow-pos"><span className={`flex h-11 w-11 items-center justify-center rounded-pos ${color}`}>{icon}</span><div><p className="text-2xl font-bold text-text">{value}</p><p className="text-xs text-textMuted">{label}</p></div></div>;
}

function movementLabel(type: string): string {
  return ({ ADJUSTMENT_IN: "Entrada", ADJUSTMENT_OUT: "Salida", PURCHASE: "Compra", SALE: "Venta", REVERSAL: "Reversión" } as Record<string, string>)[type] ?? type;
}
