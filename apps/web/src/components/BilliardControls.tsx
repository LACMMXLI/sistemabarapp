import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, StopCircle } from "lucide-react";
import type { DiningTable } from "@barapp/contracts";
import { fetchActiveSession, fetchBilliardRates, finishSession, pauseSession, resumeSession, startSession } from "../lib/billiardApi";
import { ApiError } from "../lib/api";
import { ConfirmDialog } from "./ConfirmDialog";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BilliardControls({ table, orderId }: { table: DiningTable; orderId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const { data: session, refetch } = useQuery({
    queryKey: ["billiard-session", table.id],
    queryFn: () => fetchActiveSession(table.id),
    refetchInterval: 5000,
  });
  const { data: rates } = useQuery({ queryKey: ["billiard-rates"], queryFn: fetchBilliardRates });

  useEffect(() => {
    if (session?.status !== "ACTIVE") return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

  const afterMutation = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["tables"] });
  };

  const startMutation = useMutation({
    mutationFn: (rateId: string) => startSession(table.id, rateId),
    onSuccess: afterMutation,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo iniciar el billar."),
  });
  const pauseMutation = useMutation({
    mutationFn: () => pauseSession(session!.id),
    onSuccess: afterMutation,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo pausar."),
  });
  const resumeMutation = useMutation({
    mutationFn: () => resumeSession(session!.id),
    onSuccess: afterMutation,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo reanudar."),
  });
  const finishMutation = useMutation({
    mutationFn: () => finishSession(session!.id),
    onSuccess: () => {
      setShowFinishDialog(false);
      afterMutation();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo finalizar."),
  });

  const busy = startMutation.isPending || pauseMutation.isPending || resumeMutation.isPending;
  const elapsed = session ? session.accumulatedSeconds + (session.status === "ACTIVE" ? tick : 0) : 0;
  const estimateCents = session ? Math.max(Math.ceil(elapsed / 60) * session.appliedPricePerMinuteCents, session.minimumChargeCents) : 0;

  return (
    <div className="mb-sm rounded-xl border border-primary/40 bg-primary/10 p-md">
      {error && (
        <button type="button" className="mb-2 block text-left text-xs text-red-300" onClick={() => setError(null)}>
          {error}
        </button>
      )}
      {!session && (
        <div>
          <p className="mb-sm text-sm text-primary">Billar sin iniciar</p>
          <div className="flex flex-wrap gap-2">
            {rates?.map((rate) => (
              <button
                key={rate.id}
                disabled={busy}
                onClick={() => startMutation.mutate(rate.id)}
                className="touch-target rounded-xl bg-primary px-md text-sm font-medium text-black disabled:opacity-50"
              >
                Iniciar · {rate.name}
              </button>
            ))}
            {rates?.length === 0 && <p className="text-xs text-primary">No hay tarifas configuradas. Crea una en Configuración.</p>}
          </div>
        </div>
      )}
      {session && (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-lg text-primary">{formatElapsed(elapsed)}</p>
            <p className="text-xs text-textMuted">Estimado: ${(estimateCents / 100).toFixed(2)} · {session.status}</p>
          </div>
          <div className="flex gap-2">
            {session.status === "ACTIVE" && (
              <button
                onClick={() => pauseMutation.mutate()}
                disabled={busy}
                aria-label="Pausar"
                className="touch-target flex items-center gap-1 rounded-md bg-slate-700 px-3 text-sm text-white disabled:opacity-50"
              >
                <Pause className="h-4 w-4" /> Pausar
              </button>
            )}
            {session.status === "PAUSED" && (
              <button
                onClick={() => resumeMutation.mutate()}
                disabled={busy}
                aria-label="Reanudar"
                className="touch-target flex items-center gap-1 rounded-md bg-slate-700 px-3 text-sm text-white disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> Reanudar
              </button>
            )}
            <button
              onClick={() => setShowFinishDialog(true)}
              disabled={busy}
              className="touch-target flex items-center gap-1 rounded-md bg-red-700 px-3 text-sm font-medium text-white disabled:opacity-50"
            >
              <StopCircle className="h-4 w-4" /> Finalizar
            </button>
          </div>
        </div>
      )}

      {showFinishDialog && (
        <ConfirmDialog
          title="Finalizar sesión de billar"
          description={`Se agregará el cargo estimado de $${(estimateCents / 100).toFixed(2)} a la cuenta. Esta acción no se puede deshacer.`}
          confirmLabel="Finalizar"
          destructive
          pending={finishMutation.isPending}
          onConfirm={() => finishMutation.mutate()}
          onCancel={() => setShowFinishDialog(false)}
        />
      )}
    </div>
  );
}
