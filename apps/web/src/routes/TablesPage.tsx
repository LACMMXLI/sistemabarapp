import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Clock, User } from "lucide-react";
import type { DiningTable, DiningTableType } from "@barapp/contracts";
import { TABLE_POLL_INTERVAL_MS, APP_TIMEZONE } from "@barapp/config";
import { fetchTables, openTable } from "../lib/tablesApi";
import { createTable, updateTable } from "../lib/adminApi";
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIMEZONE });
}

export function TablesPage({ typeFilter }: { typeFilter?: DiningTableType }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const canManageTables = usePermission("TABLES_MANAGE");
  const [newTableName, setNewTableName] = useState("");
  const [newTableType, setNewTableType] = useState<DiningTableType>(typeFilter ?? "STANDARD");
  const [newTableCapacity, setNewTableCapacity] = useState("");

  const { data, isLoading, isError } = useQuery({
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

  const toggleOutOfServiceMutation = useMutation({
    mutationFn: ({ id, outOfService }: { id: string; outOfService: boolean }) => updateTable(id, { outOfService }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables"] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo actualizar la mesa."),
  });

  return (
    <div className="p-3 md:p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">{typeFilter === "BILLIARD" ? "Billar" : "Mesas"}</h1>
      {error && (
        <button type="button" className="mb-4 block w-full rounded-md bg-red-900/60 px-4 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}
      {canManageTables && (
        <div className="mb-4 flex flex-wrap gap-2">
          <label htmlFor="new-table-name" className="sr-only">
            Nombre de la mesa
          </label>
          <input
            id="new-table-name"
            placeholder="Nombre de la mesa"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          />
          {!typeFilter && (
            <select
              aria-label="Tipo de mesa"
              value={newTableType}
              onChange={(e) => setNewTableType(e.target.value as DiningTableType)}
              className="touch-target rounded-md bg-slate-800 px-2 text-white"
            >
              <option value="STANDARD">Normal</option>
              <option value="BILLIARD">Billar</option>
            </select>
          )}
          <input
            aria-label="Capacidad en personas"
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

      {isLoading && <p className="p-6 text-slate-400">Cargando mesas…</p>}
      {isError && <p className="p-6 text-red-400">No se pudieron cargar las mesas.</p>}
      {!isLoading && !isError && tables?.length === 0 && (
        <p className="p-6 text-slate-500">Todavía no hay mesas registradas.</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tables?.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            canManage={canManageTables}
            onTap={() => !table.outOfService && openMutation.mutate(table.id)}
            onToggleOutOfService={() => toggleOutOfServiceMutation.mutate({ id: table.id, outOfService: !table.outOfService })}
          />
        ))}
      </div>
    </div>
  );
}

function TableCard({
  table,
  canManage,
  onTap,
  onToggleOutOfService,
}: {
  table: DiningTable;
  canManage: boolean;
  onTap: () => void;
  onToggleOutOfService: () => void;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (table.status !== "BILLIARD_ACTIVE" || table.billiardStatus !== "ACTIVE") return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [table.status, table.billiardStatus]);

  const elapsed = (table.billiardElapsedSeconds ?? 0) + (table.billiardStatus === "ACTIVE" ? tick : 0);

  return (
    <div className={`relative overflow-hidden rounded-lg border-2 ${STATUS_STYLES[table.status]}`}>
      {canManage && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleOutOfService();
          }}
          aria-label={table.outOfService ? "Marcar disponible" : "Marcar fuera de servicio"}
          title={table.outOfService ? "Marcar disponible" : "Marcar fuera de servicio"}
          className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-slate-300 hover:text-white"
        >
          {table.outOfService ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        </button>
      )}
      <button
        onClick={onTap}
        disabled={table.outOfService}
        className="touch-target flex w-full flex-col items-start gap-1 p-3 text-left"
      >
        <div className="flex w-full items-center justify-between pr-6">
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
        {table.openedByName && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <User className="h-3 w-3" /> {table.openedByName}
          </span>
        )}
        {table.openedAt && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" /> {formatTime(table.openedAt)}
          </span>
        )}
      </button>
    </div>
  );
}
