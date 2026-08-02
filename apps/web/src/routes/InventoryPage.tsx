import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APP_TIMEZONE } from "@barapp/config";
import { fetchInventory, fetchInventoryMovements, createManualMovement } from "../lib/inventoryApi";
import { ApiError } from "../lib/api";

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

  const adjustMutation = useMutation({
    mutationFn: () => createManualMovement({ productId, type, quantity, reason }),
    onSuccess: () => {
      setReason("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento."),
  });

  return (
    <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2 md:p-4">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">Existencias</h2>
        {loadingItems && <p className="text-sm text-slate-400">Cargando existencias…</p>}
        {errorItems && <p className="text-sm text-red-400">No se pudieron cargar las existencias.</p>}
        {!loadingItems && items?.length === 0 && <p className="text-sm text-slate-500">No hay productos con inventario controlado.</p>}
        {items && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-sm text-slate-200">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left">Producto</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Umbral</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId} className={item.isLow ? "text-amber-400" : ""}>
                    <td>{item.productName}</td>
                    <td className="text-right">{item.currentStock}</td>
                    <td className="text-right">{item.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Ajuste manual</h3>
        {error && (
          <button type="button" className="mb-2 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
            {error}
          </button>
        )}
        <label htmlFor="inv-product" className="sr-only">
          Producto
        </label>
        <select
          id="inv-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
        >
          <option value="">Selecciona un producto…</option>
          {items?.map((item) => (
            <option key={item.productId} value={item.productId}>
              {item.productName}
            </option>
          ))}
        </select>
        <div className="mb-2 flex gap-2">
          <select aria-label="Tipo de movimiento" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="touch-target flex-1 rounded-md bg-slate-800 px-2 text-white">
            <option value="ADJUSTMENT_IN">Entrada</option>
            <option value="ADJUSTMENT_OUT">Salida</option>
            <option value="PURCHASE">Compra</option>
          </select>
          <label htmlFor="inv-quantity" className="sr-only">
            Cantidad
          </label>
          <input
            id="inv-quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20 touch-target rounded-md bg-slate-800 px-2 text-white"
          />
        </div>
        <label htmlFor="inv-reason" className="sr-only">
          Motivo
        </label>
        <input
          id="inv-reason"
          placeholder="Motivo (obligatorio)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
        />
        <button
          disabled={!productId || !reason || adjustMutation.isPending}
          onClick={() => adjustMutation.mutate()}
          className="touch-target rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
        >
          {adjustMutation.isPending ? "Registrando…" : "Registrar movimiento"}
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">Historial de movimientos</h2>
        {loadingMovements && <p className="text-sm text-slate-400">Cargando historial…</p>}
        {!loadingMovements && movements?.length === 0 && <p className="text-sm text-slate-500">Sin movimientos registrados.</p>}
        <div className="max-h-[70vh] overflow-y-auto text-sm text-slate-300">
          {movements?.map((m) => (
            <div key={m.id} className="mb-1 border-b border-slate-800 pb-1">
              <span className="font-medium text-white">{m.productName}</span> · {m.type} · {m.quantity > 0 ? "+" : ""}
              {m.quantity} → {m.resultingStock}
              <div className="text-xs text-slate-500">
                {m.userName} · {formatDate(m.createdAt)} {m.reason ? `· ${m.reason}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
