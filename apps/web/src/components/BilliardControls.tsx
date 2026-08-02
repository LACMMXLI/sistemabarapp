import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DiningTable } from "@barapp/contracts";
import { fetchActiveSession, fetchBilliardRates, finishSession, pauseSession, resumeSession, startSession } from "../lib/billiardApi";
import { ApiError } from "../lib/api";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BilliardControls({ table, orderId }: { table: DiningTable; orderId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

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
    onSuccess: afterMutation,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo finalizar."),
  });

  const elapsed = session ? session.accumulatedSeconds + (session.status === "ACTIVE" ? tick : 0) : 0;
  const estimateCents = session ? Math.max(Math.ceil(elapsed / 60) * session.appliedPricePerMinuteCents, session.minimumChargeCents) : 0;

  return (
    <div className="mb-2 rounded-md bg-amber-950/50 p-3">
      {error && <p className="mb-2 text-xs text-red-300" onClick={() => setError(null)}>{error}</p>}
      {!session && (
        <div>
          <p className="mb-2 text-sm text-amber-200">Billar sin iniciar</p>
          <div className="flex flex-wrap gap-2">
            {rates?.map((rate) => (
              <button
                key={rate.id}
                onClick={() => startMutation.mutate(rate.id)}
                className="touch-target rounded-md bg-amber-600 px-3 text-sm font-medium text-white"
              >
                Iniciar · {rate.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {session && (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-lg text-amber-300">{formatElapsed(elapsed)}</p>
            <p className="text-xs text-amber-200">Estimado: ${(estimateCents / 100).toFixed(2)} · {session.status}</p>
          </div>
          <div className="flex gap-2">
            {session.status === "ACTIVE" && (
              <button onClick={() => pauseMutation.mutate()} className="touch-target rounded-md bg-slate-700 px-3 text-sm text-white">
                Pausar
              </button>
            )}
            {session.status === "PAUSED" && (
              <button onClick={() => resumeMutation.mutate()} className="touch-target rounded-md bg-slate-700 px-3 text-sm text-white">
                Reanudar
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("¿Finalizar sesión de billar y agregar el cargo a la cuenta?")) finishMutation.mutate();
              }}
              className="touch-target rounded-md bg-red-700 px-3 text-sm font-medium text-white"
            >
              Finalizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
