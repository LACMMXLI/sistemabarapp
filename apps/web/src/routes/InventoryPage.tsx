import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInventory, fetchInventoryMovements, createManualMovement } from "../lib/inventoryApi";
import { ApiError } from "../lib/api";

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: items } = useQuery({ queryKey: ["inventory"], queryFn: fetchInventory });
  const { data: movements } = useQuery({ queryKey: ["inventory-movements"], queryFn: fetchInventoryMovements });

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "PURCHASE">("ADJUSTMENT_IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const adjustMutation = useMutation({
    mutationFn: () => createManualMovement({ productId, type, quantity, reason }),
    onSuccess: () => {
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento."),
  });

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">Existencias</h2>
        <table className="w-full text-sm text-slate-200">
          <thead className="text-slate-400">
            <tr>
              <th className="text-left">Producto</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Umbral</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.productId} className={item.isLow ? "text-amber-400" : ""}>
                <td>{item.productName}</td>
                <td className="text-right">{item.currentStock}</td>
                <td className="text-right">{item.lowStockThreshold}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Ajuste manual</h3>
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <select
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
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="touch-target flex-1 rounded-md bg-slate-800 px-2 text-white">
            <option value="ADJUSTMENT_IN">Entrada</option>
            <option value="ADJUSTMENT_OUT">Salida</option>
            <option value="PURCHASE">Compra</option>
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20 touch-target rounded-md bg-slate-800 px-2 text-white"
          />
        </div>
        <input
          placeholder="Motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
        />
        <button
          disabled={!productId || !reason || adjustMutation.isPending}
          onClick={() => adjustMutation.mutate()}
          className="touch-target rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
        >
          Registrar movimiento
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">Historial de movimientos</h2>
        <div className="max-h-[70vh] overflow-y-auto text-sm text-slate-300">
          {movements?.map((m) => (
            <div key={m.id} className="mb-1 border-b border-slate-800 pb-1">
              <span className="font-medium text-white">{m.productName}</span> · {m.type} · {m.quantity > 0 ? "+" : ""}
              {m.quantity} → {m.resultingStock}
              <div className="text-xs text-slate-500">
                {m.userName} · {new Date(m.createdAt).toLocaleString("es-MX")} {m.reason ? `· ${m.reason}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
