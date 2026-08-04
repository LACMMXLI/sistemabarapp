import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2, Send, X } from "lucide-react";
import type { DiningTable, OrderDto } from "@barapp/contracts";
import { payOrder, cancelOrder, addOrderItem } from "../../lib/ordersApi";
import { openTable } from "../../lib/tablesApi";
import { ApiError } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import { usePermission } from "../../hooks/usePermission";
import { ConfirmDialog } from "../ConfirmDialog";
import { useToast } from "../../hooks/useToast";

export function CheckoutActions({
  order,
  selectedTableId,
  tables,
  onPaid,
  onSentToTable,
  onCancelled,
}: {
  order: OrderDto;
  selectedTableId: string | null;
  tables: DiningTable[];
  onPaid: () => void;
  onSentToTable: () => void;
  onCancelled: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canPay = usePermission("ORDERS_PAY");
  const canCancel = usePermission("ORDERS_CANCEL");
  const canOperate = usePermission("ORDERS_OPERATE");

  const [showPay, setShowPay] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sending, setSending] = useState(false);

  const activeItems = order.items.filter((i) => !i.cancelledAt);
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  const cancelOrderMutation = useMutation({
    mutationFn: (reason: string) => cancelOrder(order.id, reason),
    onSuccess: () => {
      setShowCancelDialog(false);
      toast.success("Venta cancelada.");
      onCancelled();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar la venta."),
  });

  async function handleSendToTable() {
    if (activeItems.length === 0) {
      toast.error("Agrega al menos un producto antes de enviar a mesa.");
      return;
    }
    if (!selectedTableId || !selectedTable) {
      toast.error("Selecciona una mesa para enviar la orden.");
      return;
    }

    setSending(true);
    try {
      const { orderId: tableOrderId } = await openTable(selectedTableId);

      // Se cancela la venta rápida antes de reagregar los productos: cancelar
      // libera el inventario reservado, evitando que un producto con stock
      // limitado se rechace por doble deducción (una vez en la venta rápida
      // y otra al reagregarlo en la orden de la mesa).
      await cancelOrder(order.id, `Enviado a ${selectedTable.name} desde venta rápida`);

      try {
        for (const item of activeItems) {
          await addOrderItem(tableOrderId, item.productId, item.quantity);
        }
      } catch (err) {
        toast.error(
          `La venta se canceló pero no se pudo reagregar todo a ${selectedTable.name}. Revisa la orden de la mesa. ${
            err instanceof ApiError ? err.message : ""
          }`.trim(),
        );
        queryClient.invalidateQueries({ queryKey: ["tables"] });
        queryClient.invalidateQueries({ queryKey: ["order", tableOrderId] });
        onSentToTable();
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["order", tableOrderId] });
      toast.success(`Orden enviada a ${selectedTable.name}.`);
      onSentToTable();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo enviar la orden a la mesa.");
    } finally {
      setSending(false);
    }
  }

  const busy = sending || cancelOrderMutation.isPending;

  return (
    <div className="space-y-2 border-t border-pos-borderSoft pt-3">
      {canPay && (
        <button
          type="button"
          onClick={() => setShowPay(true)}
          disabled={activeItems.length === 0 || busy}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-posMd bg-pos-amber text-base font-bold text-black shadow-posPanel transition hover:bg-pos-amberStrong active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          <CreditCard className="h-5 w-5" />
          Cobrar
        </button>
      )}

      <div className="flex gap-2">
        {canOperate && (
          <button
            type="button"
            onClick={handleSendToTable}
            disabled={activeItems.length === 0 || !selectedTableId || busy}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-posMd border border-pos-cyan/50 bg-pos-cyan/10 text-sm font-semibold text-pos-cyan transition hover:bg-pos-cyan/15 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar a mesa
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            disabled={activeItems.length === 0 || busy}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-posMd border border-pos-danger/50 bg-pos-danger/10 text-sm font-semibold text-pos-danger transition hover:bg-pos-danger/15 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        )}
      </div>

      {showPay && (
        <PayDialog
          orderId={order.id}
          totalCents={order.totalCents}
          onClose={() => setShowPay(false)}
          onPaid={() => {
            setShowPay(false);
            toast.success("Cobro realizado correctamente.");
            onPaid();
          }}
        />
      )}

      {showCancelDialog && (
        <ConfirmDialog
          title="Cancelar venta"
          description="Esta acción no se puede deshacer. El motivo quedará registrado en auditoría."
          confirmLabel="Cancelar venta"
          destructive
          requireReason
          reasonLabel="Motivo de la cancelación"
          pending={cancelOrderMutation.isPending}
          onConfirm={(reason) => reason && cancelOrderMutation.mutate(reason)}
          onCancel={() => setShowCancelDialog(false)}
        />
      )}
    </div>
  );
}

function PayDialog({
  orderId,
  totalCents,
  onClose,
  onPaid,
}: {
  orderId: string;
  totalCents: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [received, setReceived] = useState(String((totalCents / 100).toFixed(2)));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const payMutation = useMutation({
    mutationFn: () => {
      const receivedCents = Math.round(parseFloat(received || "0") * 100);
      return payOrder(orderId, [{ method, amountCents: totalCents, receivedCents: method === "CASH" ? receivedCents : undefined }]);
    },
    onSuccess: onPaid,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo cobrar la orden."),
  });

  const changeCents = method === "CASH" ? Math.max(0, Math.round(parseFloat(received || "0") * 100) - totalCents) : 0;
  const pending = payMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-posLg border border-pos-border bg-pos-surfaceElevated p-5 shadow-posPanel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-pos-textPrimary">Cobrar {formatMoney(totalCents)}</h2>
        <div className="mb-4 flex gap-2">
          {(["CASH", "CARD", "TRANSFER"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={pending}
              onClick={() => setMethod(m)}
              className={`h-12 flex-1 rounded-posSm text-sm font-medium transition disabled:opacity-50 ${
                method === m ? "bg-pos-cyan text-black" : "bg-pos-surface text-pos-textSecondary"
              }`}
            >
              {m === "CASH" ? "Efectivo" : m === "CARD" ? "Tarjeta" : "Transferencia"}
            </button>
          ))}
        </div>
        {method === "CASH" && (
          <>
            <label htmlFor="received-amount" className="mb-1 block text-sm text-pos-textSecondary">
              Monto recibido
            </label>
            <input
              id="received-amount"
              value={received}
              disabled={pending}
              onChange={(e) => setReceived(e.target.value)}
              inputMode="decimal"
              className="mb-2 h-12 w-full rounded-posSm border border-pos-borderSoft bg-pos-surface px-3 text-pos-textPrimary outline-none focus-visible:border-pos-amber/60 disabled:opacity-50"
            />
            <p className="mb-4 text-sm text-pos-textSecondary">Cambio: {formatMoney(changeCents)}</p>
          </>
        )}
        {error && <p className="mb-3 text-sm text-pos-danger">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-12 flex-1 rounded-posSm bg-pos-surface text-sm font-medium text-pos-textSecondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => payMutation.mutate()}
            disabled={pending}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-posSm bg-pos-amber text-sm font-bold text-black disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Procesando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
