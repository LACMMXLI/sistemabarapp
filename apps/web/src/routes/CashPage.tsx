import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Info, Lock, Unlock } from "lucide-react";
import { fetchRegisters, createRegister, openShift, fetchShift, createCashMovement, closeShift } from "../lib/cashApi";
import { ApiError } from "../lib/api";
import { usePermission } from "../hooks/usePermission";
import { ConfirmDialog } from "../components/ConfirmDialog";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CashPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const canOpen = usePermission("CASH_OPEN");
  const canClose = usePermission("CASH_CLOSE");
  const canMove = usePermission("CASH_MOVEMENT");

  const { data: registers, isLoading: loadingRegisters } = useQuery({ queryKey: ["cash-registers"], queryFn: fetchRegisters, refetchInterval: 5000 });
  const openRegister = registers?.find((r) => r.openShiftId);
  const shiftId = openRegister?.openShiftId ?? null;

  const { data: shift, isLoading: loadingShift } = useQuery({
    queryKey: ["cash-shift", shiftId],
    queryFn: () => fetchShift(shiftId!),
    enabled: !!shiftId,
    refetchInterval: 5000,
  });

  const [registerName, setRegisterName] = useState("Caja principal");
  const [openingFloat, setOpeningFloat] = useState("500");
  const [selectedRegisterId, setSelectedRegisterId] = useState("");
  const [movementType, setMovementType] = useState<"CASH_IN" | "CASH_OUT">("CASH_OUT");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const createRegisterMutation = useMutation({
    mutationFn: () => createRegister(registerName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cash-registers"] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear la caja."),
  });

  const openShiftMutation = useMutation({
    mutationFn: () => openShift(selectedRegisterId, Math.round(parseFloat(openingFloat || "0") * 100)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cash-registers"] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo abrir el turno."),
  });

  const movementMutation = useMutation({
    mutationFn: () =>
      createCashMovement(shiftId!, { type: movementType, amountCents: Math.round(parseFloat(movementAmount || "0") * 100), reason: movementReason }),
    onSuccess: () => {
      setMovementAmount("");
      setMovementReason("");
      queryClient.invalidateQueries({ queryKey: ["cash-shift", shiftId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento."),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeShift(shiftId!, Math.round(parseFloat(countedCash || "0") * 100)),
    onSuccess: () => {
      setCountedCash("");
      setShowCloseDialog(false);
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-shift", shiftId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo cerrar el turno."),
  });

  const countedCents = Math.round(parseFloat(countedCash || "0") * 100);
  const previewDifference = shift ? countedCents - shift.expectedCashCents : 0;

  if (loadingRegisters || loadingShift) {
    return <div className="p-4 text-slate-400">Cargando caja…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-3 md:p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Caja</h1>
      {error && (
        <button type="button" className="mb-3 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {!shift && (
        <div className="rounded-md bg-slate-900 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-300">
            <Unlock className="h-5 w-5 text-amber-400" />
            <p>No hay un turno de caja abierto. No se pueden cobrar cuentas hasta abrir uno.</p>
          </div>
          {canOpen ? (
            <>
              <div className="mb-3 flex gap-2">
                <label htmlFor="register-name" className="sr-only">
                  Nombre de la caja
                </label>
                <input
                  id="register-name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="touch-target flex-1 rounded-md bg-slate-800 px-3 text-white"
                />
                <button
                  onClick={() => createRegisterMutation.mutate()}
                  disabled={!registerName || createRegisterMutation.isPending}
                  className="touch-target rounded-md bg-slate-700 px-3 text-white disabled:opacity-40"
                >
                  Crear caja
                </button>
              </div>
              <label htmlFor="select-register" className="sr-only">
                Selecciona una caja
              </label>
              <select
                id="select-register"
                value={selectedRegisterId}
                onChange={(e) => setSelectedRegisterId(e.target.value)}
                className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
              >
                <option value="">Selecciona una caja…</option>
                {registers?.map((r) => (
                  <option key={r.id} value={r.id} disabled={!!r.openShiftId}>
                    {r.name} {r.openShiftId ? "(con turno abierto)" : ""}
                  </option>
                ))}
              </select>
              <label htmlFor="opening-float" className="mb-1 block text-sm text-slate-300">
                Fondo inicial
              </label>
              <input
                id="opening-float"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                inputMode="decimal"
                className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
              />
              <button
                disabled={!selectedRegisterId || openShiftMutation.isPending}
                onClick={() => openShiftMutation.mutate()}
                className="touch-target w-full rounded-md bg-sky-600 text-white disabled:opacity-40"
              >
                {openShiftMutation.isPending ? "Abriendo…" : "Abrir turno"}
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">Solo un administrador puede abrir un turno de caja.</p>
          )}
        </div>
      )}

      {shift && (
        <div className="space-y-4">
          <div className="rounded-md bg-slate-900 p-4 text-sm text-slate-200">
            <p className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Lock className="h-4 w-4 text-emerald-400" /> {shift.registerName} · Turno abierto
            </p>
            <p className="mb-3 text-xs text-slate-500">Abierto por {shift.openedByName}</p>
            <Row label="Fondo inicial" value={shift.openingFloatCents} />
            <Row label="Ventas efectivo" value={shift.cashSalesCents} />
            <Row label="Ventas tarjeta" value={shift.cardSalesCents} />
            <Row label="Ventas transferencia" value={shift.transferSalesCents} />
            <Row label="Entradas" value={shift.cashInCents} />
            <Row label="Salidas" value={-shift.cashOutCents} />
            <Row label="Efectivo esperado" value={shift.expectedCashCents} bold />
          </div>

          {canMove && (
            <div className="rounded-md bg-slate-900 p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-white">
                <CircleDollarSign className="h-4 w-4" /> Movimiento de efectivo
              </p>
              <div className="mb-2 flex gap-2">
                <select
                  aria-label="Tipo de movimiento"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as typeof movementType)}
                  className="touch-target rounded-md bg-slate-800 px-2 text-white"
                >
                  <option value="CASH_IN">Entrada</option>
                  <option value="CASH_OUT">Salida</option>
                </select>
                <input
                  aria-label="Importe"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="Importe"
                  inputMode="decimal"
                  className="touch-target flex-1 rounded-md bg-slate-800 px-3 text-white"
                />
              </div>
              <label htmlFor="movement-reason" className="sr-only">
                Motivo
              </label>
              <input
                id="movement-reason"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Motivo (obligatorio)"
                className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
              />
              <button
                disabled={!movementAmount || !movementReason || movementMutation.isPending}
                onClick={() => movementMutation.mutate()}
                className="touch-target rounded-md bg-slate-700 px-4 text-white disabled:opacity-40"
              >
                {movementMutation.isPending ? "Registrando…" : "Registrar"}
              </button>
            </div>
          )}

          {canClose && (
            <div className="rounded-md bg-slate-900 p-4">
              <p className="mb-2 font-semibold text-white">Corte de caja</p>
              <label htmlFor="counted-cash" className="mb-1 block text-sm text-slate-300">
                Efectivo contado
              </label>
              <input
                id="counted-cash"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
              />
              {countedCash && (
                <p className={`mb-2 flex items-center gap-1 text-sm ${previewDifference === 0 ? "text-slate-400" : previewDifference > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  <Info className="h-4 w-4" />
                  Diferencia: {money(previewDifference)}
                </p>
              )}
              <button
                disabled={!countedCash}
                onClick={() => setShowCloseDialog(true)}
                className="touch-target w-full rounded-md bg-red-700 text-white disabled:opacity-40"
              >
                Cerrar turno
              </button>
            </div>
          )}
        </div>
      )}

      {showCloseDialog && shift && (
        <ConfirmDialog
          title="Cerrar turno de caja"
          description={`Efectivo esperado: ${money(shift.expectedCashCents)} · Contado: ${money(countedCents)} · Diferencia: ${money(previewDifference)}. Esta acción no se puede deshacer y no se podrán registrar más ventas en este turno.`}
          confirmLabel="Cerrar turno"
          destructive
          pending={closeMutation.isPending}
          onConfirm={() => closeMutation.mutate()}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-white" : ""}`}>
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}
