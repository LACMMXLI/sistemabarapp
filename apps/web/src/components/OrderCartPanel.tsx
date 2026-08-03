import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2, X } from "lucide-react";
import type { OrderDto } from "@barapp/contracts";
import { cancelOrder, cancelOrderItem, payOrder, updateOrderItemQuantity } from "../lib/ordersApi";
import { ApiError } from "../lib/api";
import { usePermission } from "../hooks/usePermission";
import { ConfirmDialog } from "./ConfirmDialog";

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function OrderCartPanel({
  order,
  capacity,
  onPaid,
  onBack,
  onCancelled,
}: {
  order: OrderDto;
  capacity?: number | null;
  onPaid: () => void;
  onBack?: () => void;
  onCancelled?: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const canPay = usePermission("ORDERS_PAY");
  const canCancel = usePermission("ORDERS_CANCEL");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["order", order.id] });

  const qtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateOrderItemQuantity(order.id, itemId, quantity),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo actualizar la cantidad."),
  });

  const cancelItemMutation = useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) => cancelOrderItem(order.id, itemId, reason),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo eliminar el producto."),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (reason: string) => cancelOrder(order.id, reason),
    onSuccess: () => {
      invalidate();
      setShowCancelDialog(false);
      onCancelled?.();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo cancelar la orden."),
  });

  const busy = qtyMutation.isPending || cancelItemMutation.isPending || cancelOrderMutation.isPending;
  const activeItems = order.items.filter((i) => !i.cancelledAt);

  return (
    <section className="order-cart flex h-full min-h-0 flex-col bg-surface p-md">
      <h1 className="mb-lg text-xl font-semibold text-text">Cuenta actual</h1>
      <div className="mb-lg flex items-center justify-between rounded-2xl border border-border bg-surfaceLight p-md shadow-md">
        <div>
          <p className="text-base font-semibold text-text">{order.tableName ?? "Venta rápida"}</p>
          <p className="text-xs text-textMuted">
            {capacity ? `${capacity} personas · ` : ""}
            {order.openedByName}
          </p>
        </div>
        {onBack && (
          <button onClick={onBack} className="touch-target rounded-xl bg-background px-md text-sm text-textMuted">
            Cambiar mesa
          </button>
        )}
      </div>

      {error && (
        <button
          type="button"
          className="mb-sm flex items-center justify-between gap-sm rounded-xl bg-error p-md text-left text-xs text-white"
          onClick={() => setError(null)}
        >
          <span>{error}</span>
          <X className="h-4 w-4 shrink-0" />
        </button>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeItems.length === 0 && <p className="text-sm text-textMuted">Sin productos agregados.</p>}
        {activeItems.map((item) => (
          <div key={item.id} className="border-b border-border py-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">
                {item.quantity} {item.productNameSnapshot}
              </span>
              <span className="text-sm font-bold text-text">{formatMoney(item.totalCents)}</span>
            </div>
            {item.note && <span className="text-[11px] italic text-textMuted">{item.note}</span>}
            {item.promotionNameSnapshot && (
              <span className="text-[11px] text-success">Promo: {item.promotionNameSnapshot}</span>
            )}
            <div className="mt-1 flex items-center gap-2">
              <button
                className="touch-target flex items-center justify-center rounded-xl bg-surfaceLight px-md text-text disabled:opacity-40"
                disabled={order.status !== "OPEN" || busy}
                aria-label="Disminuir cantidad"
                onClick={() => qtyMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-text">{item.quantity}</span>
              <button
                className="touch-target flex items-center justify-center rounded-xl bg-surfaceLight px-md text-text disabled:opacity-40"
                disabled={order.status !== "OPEN" || busy}
                aria-label="Aumentar cantidad"
                onClick={() => qtyMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                className="touch-target ml-auto flex items-center justify-center rounded-xl bg-error/20 text-error disabled:opacity-40"
                disabled={order.status !== "OPEN" || busy}
                onClick={() => cancelItemMutation.mutate({ itemId: item.id, reason: "Retirado por el usuario" })}
                aria-label={`Quitar ${item.productNameSnapshot}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-sm border-t border-border pt-lg text-sm text-textMuted">
        <Row label="Subtotal" value={order.subtotalCents} />
        {order.discountCents > 0 && <Row label="Descuentos" value={-order.discountCents} />}
        {order.billiardChargeCents > 0 && <Row label="Billar" value={order.billiardChargeCents} />}
        <Row label="Total" value={order.totalCents} bold />
      </div>

      {order.status === "OPEN" && (
        <div className="mt-md space-y-sm">
          {canPay && (
            <button
              onClick={() => setShowPay(true)}
              disabled={activeItems.length === 0 || busy}
              className="h-14 w-full rounded-xl bg-primary text-base font-medium text-black shadow-sm hover:bg-primaryHover disabled:opacity-40"
            >
              Cobrar {formatMoney(order.totalCents)}
            </button>
          )}
          <div className="flex gap-2">
            {canCancel && (
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={busy}
                className="h-14 flex-1 rounded-xl bg-error text-sm font-medium text-white shadow-sm disabled:opacity-40"
              >
                Cancelar cuenta
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className="h-14 flex-1 rounded-xl bg-surfaceLight text-sm font-medium text-text">
                Cambiar mesa
              </button>
            )}
          </div>
        </div>
      )}
      {order.status === "PAID" && <p className="mt-md text-center font-semibold text-success">Pagada</p>}
      {order.status === "CANCELLED" && <p className="mt-md text-center font-semibold text-error">Cancelada</p>}

      {showPay && (
        <PayDialog
          orderId={order.id}
          totalCents={order.totalCents}
          onClose={() => setShowPay(false)}
          onPaid={() => {
            setShowPay(false);
            onPaid();
          }}
        />
      )}

      {showCancelDialog && (
        <ConfirmDialog
          title="Cancelar cuenta"
          description="Esta acción no se puede deshacer. Se conservará el historial y el motivo quedará registrado en auditoría."
          confirmLabel="Cancelar cuenta"
          destructive
          requireReason
          reasonLabel="Motivo de la cancelación"
          error={error}
          pending={cancelOrderMutation.isPending}
          onConfirm={(reason) => reason && cancelOrderMutation.mutate(reason)}
          onCancel={() => setShowCancelDialog(false)}
        />
      )}
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "mt-sm text-2xl font-bold text-text" : ""}`}>
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
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
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-white">Cobrar {`$${(totalCents / 100).toFixed(2)}`}</h2>
        <div className="mb-4 flex gap-2">
          {(["CASH", "CARD", "TRANSFER"] as const).map((m) => (
            <button
              key={m}
              disabled={pending}
              onClick={() => setMethod(m)}
              className={`touch-target flex-1 rounded-md text-sm font-medium disabled:opacity-50 ${
                method === m ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {m === "CASH" ? "Efectivo" : m === "CARD" ? "Tarjeta" : "Transferencia"}
            </button>
          ))}
        </div>
        {method === "CASH" && (
          <>
            <label htmlFor="received-amount" className="mb-1 block text-sm text-slate-300">
              Monto recibido
            </label>
            <input
              id="received-amount"
              value={received}
              disabled={pending}
              onChange={(e) => setReceived(e.target.value)}
              inputMode="decimal"
              className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none disabled:opacity-50"
            />
            <p className="mb-4 text-sm text-slate-300">Cambio: ${(changeCents / 100).toFixed(2)}</p>
          </>
        )}
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={pending} className="touch-target flex-1 rounded-md bg-slate-800 text-slate-300 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => payMutation.mutate()}
            disabled={pending}
            className="touch-target flex-1 rounded-md bg-emerald-600 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Procesando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
