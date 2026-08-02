import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DiningTable, DiningTableType } from "@barapp/contracts";
import { TABLE_POLL_INTERVAL_MS } from "@barapp/config";
import { fetchTables, openTable } from "../lib/tablesApi";
import { createTable } from "../lib/adminApi";
import { ApiError } from "../lib/api";
import { usePermission } from "../hooks/usePermission";

const STATUS_STYLES: Record<DiningTable["status"], string> = {
  AVAILABLE: "bg-emerald-900/40 border-emerald-600",
  OCCUPIED: "bg-red-900/40 border-red-600",
  BILLIARD_ACTIVE: "bg-amber-900/40 border-amber-500",
  OUT_OF_SERVICE: "bg-slate-800 border-slate-600 opacity-60",
};

const STATUS_LABELS: Record<DiningTable["status"], string> = {
  AVAILABLE: "Disponible",
  OCCUPIED: "Ocupada",
  BILLIARD_ACTIVE: "Billar activo",
  OUT_OF_SERVICE: "Fuera de servicio",
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function TablesPage({ typeFilter }: { typeFilter?: DiningTableType }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const canManageTables = usePermission("TABLES_MANAGE");
  const [newTableName, setNewTableName] = useState("");
  const [newTableType, setNewTableType] = useState<DiningTableType>(typeFilter ?? "STANDARD");
  const [newTableCapacity, setNewTableCapacity] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    refetchInterval: TABLE_POLL_INTERVAL_MS,
  });

  const tables = typeFilter ? data?.filter((t) => t.type === typeFilter) : data;

  const openMutation = useMutation({
    mutationFn: openTable,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      navigate(`/ordenes/${result.orderId}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo abrir la mesa."),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTable({
        name: newTableName,
        type: newTableType,
        capacity: newTableCapacity ? Number(newTableCapacity) : null,
      }),
    onSuccess: () => {
      setNewTableName("");
      setNewTableCapacity("");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear la mesa."),
  });

  if (isLoading) return <div className="p-6 text-slate-400">Cargando mesas…</div>;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">{typeFilter === "BILLIARD" ? "Billar" : "Mesas"}</h1>
      {error && (
        <div className="mb-4 rounded-md bg-red-900/60 px-4 py-2 text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      {canManageTables && (
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            placeholder="Nombre de la mesa"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="touch-target rounded-md bg-slate-800 px-3 text-white"
          />
          {!typeFilter && (
            <select
              value={newTableType}
              onChange={(e) => setNewTableType(e.target.value as DiningTableType)}
              className="touch-target rounded-md bg-slate-800 px-2 text-white"
            >
              <option value="STANDARD">Normal</option>
              <option value="BILLIARD">Billar</option>
            </select>
          )}
          <input
            placeholder="Personas"
            type="number"
            min={1}
            value={newTableCapacity}
            onChange={(e) => setNewTableCapacity(e.target.value)}
            className="w-24 touch-target rounded-md bg-slate-800 px-3 text-white"
          />
          <button
            disabled={!newTableName || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="touch-target rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
          >
            Agregar mesa
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tables?.map((table) => (
          <TableCard key={table.id} table={table} onTap={() => !table.outOfService && openMutation.mutate(table.id)} />
        ))}
      </div>
    </div>
  );
}

function TableCard({ table, onTap }: { table: DiningTable; onTap: () => void }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (table.status !== "BILLIARD_ACTIVE" || table.billiardStatus !== "ACTIVE") return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [table.status, table.billiardStatus]);

  const elapsed = (table.billiardElapsedSeconds ?? 0) + (table.billiardStatus === "ACTIVE" ? tick : 0);

  return (
    <button
      onClick={onTap}
      disabled={table.outOfService}
      className={`touch-target flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left ${STATUS_STYLES[table.status]}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-base font-bold text-white">{table.name}</span>
        {table.capacity !== null && <span className="text-[11px] text-slate-400">{table.capacity} pers.</span>}
      </div>
      <span className="text-xs text-slate-300">{STATUS_LABELS[table.status]}</span>
      {table.billiardElapsedSeconds !== null && (
        <span className="text-sm font-mono text-amber-300">{formatElapsed(elapsed)}</span>
      )}
      {table.orderTotalCents !== null && (
        <span className="text-sm font-semibold text-white">{formatMoney(table.orderTotalCents)}</span>
      )}
      {table.openedByName && <span className="text-[11px] text-slate-400">{table.openedByName}</span>}
    </button>
  );
}
