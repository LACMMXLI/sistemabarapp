import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRegisters, createRegister, openShift, fetchShift, createCashMovement, closeShift } from "../lib/cashApi";
import { ApiError } from "../lib/api";
import { usePermission } from "../hooks/usePermission";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CashPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const canOpen = usePermission("CASH_OPEN");
  const canClose = usePermission("CASH_CLOSE");
  const canMove = usePermission("CASH_MOVEMENT");

  const { data: registers } = useQuery({ queryKey: ["cash-registers"], queryFn: fetchRegisters, refetchInterval: 5000 });
  const openRegister = registers?.find((r) => r.openShiftId);
  const shiftId = openRegister?.openShiftId ?? null;

  const { data: shift } = useQuery({
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

  const createRegisterMutation = useMutation({
    mutationFn: () => createRegister(registerName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cash-registers"] }),
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
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-shift", shiftId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo cerrar el turno."),
  });

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Caja</h1>
      {error && <p className="mb-3 text-sm text-red-400" onClick={() => setError(null)}>{error}</p>}

      {!shift && (
        <div className="rounded-md bg-slate-900 p-4">
          <p className="mb-3 text-slate-300">No hay un turno abierto.</p>
          {canOpen && (
            <>
              <div className="mb-3 flex gap-2">
                <input value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="touch-target flex-1 rounded-md bg-slate-800 px-3 text-white" />
                <button onClick={() => createRegisterMutation.mutate()} className="touch-target rounded-md bg-slate-700 px-3 text-white">
                  Crear caja
                </button>
              </div>
              <select value={selectedRegisterId} onChange={(e) => setSelectedRegisterId(e.target.value)} className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white">
                <option value="">Selecciona una caja…</option>
                {registers?.map((r) => (
                  <option key={r.id} value={r.id} disabled={!!r.openShiftId}>
                    {r.name} {r.openShiftId ? "(con turno abierto)" : ""}
                  </option>
                ))}
              </select>
              <input value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} placeholder="Fondo inicial" inputMode="decimal" className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
              <button disabled={!selectedRegisterId} onClick={() => openShiftMutation.mutate()} className="touch-target w-full rounded-md bg-sky-600 text-white disabled:opacity-40">
                Abrir turno
              </button>
            </>
          )}
        </div>
      )}

      {shift && (
        <div className="space-y-4">
          <div className="rounded-md bg-slate-900 p-4 text-sm text-slate-200">
            <p className="mb-2 font-semibold text-white">{shift.registerName} · Turno abierto</p>
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
              <p className="mb-2 font-semibold text-white">Movimiento de efectivo</p>
              <div className="mb-2 flex gap-2">
                <select value={movementType} onChange={(e) => setMovementType(e.target.value as typeof movementType)} className="touch-target rounded-md bg-slate-800 px-2 text-white">
                  <option value="CASH_IN">Entrada</option>
                  <option value="CASH_OUT">Salida</option>
                </select>
                <input value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} placeholder="Importe" inputMode="decimal" className="touch-target flex-1 rounded-md bg-slate-800 px-3 text-white" />
              </div>
              <input value={movementReason} onChange={(e) => setMovementReason(e.target.value)} placeholder="Motivo" className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
              <button
                disabled={!movementAmount || !movementReason || movementMutation.isPending}
                onClick={() => movementMutation.mutate()}
                className="touch-target rounded-md bg-slate-700 px-4 text-white disabled:opacity-40"
              >
                Registrar
              </button>
            </div>
          )}

          {canClose && (
            <div className="rounded-md bg-slate-900 p-4">
              <p className="mb-2 font-semibold text-white">Corte de caja</p>
              <input value={countedCash} onChange={(e) => setCountedCash(e.target.value)} placeholder="Efectivo contado" inputMode="decimal" className="mb-2 w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
              <button
                disabled={!countedCash || closeMutation.isPending}
                onClick={() => {
                  if (confirm("¿Cerrar el turno de caja? Esta acción no se puede deshacer.")) closeMutation.mutate();
                }}
                className="touch-target w-full rounded-md bg-red-700 text-white disabled:opacity-40"
              >
                Cerrar turno
              </button>
            </div>
          )}
        </div>
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
