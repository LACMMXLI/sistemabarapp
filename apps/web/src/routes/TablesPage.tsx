import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Clock, Plus, User, Users } from "lucide-react";
import type { DiningTable, DiningTableType } from "@barapp/contracts";
import { TABLE_POLL_INTERVAL_MS, APP_TIMEZONE } from "@barapp/config";
import { fetchTables, openTable } from "../lib/tablesApi";
import { createTable, updateTable } from "../lib/adminApi";
import { ApiError } from "../lib/api";
import { usePermission } from "../hooks/usePermission";
import { FormModal } from "../components/FormModal";

const STATUS_STYLES: Record<DiningTable["status"], string> = {
  AVAILABLE: "border-success/40 bg-success/10",
  OCCUPIED: "border-error/40 bg-error/10",
  BILLIARD_ACTIVE: "border-primary/50 bg-primary/10",
  OUT_OF_SERVICE: "border-border bg-pos-surface/60 opacity-60",
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
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | DiningTable["status"]>("ALL");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    refetchInterval: TABLE_POLL_INTERVAL_MS,
  });

  const typedTables = typeFilter ? data?.filter((t) => t.type === typeFilter) : data;
  const tables = statusFilter === "ALL" ? typedTables : typedTables?.filter((table) => table.status === statusFilter);

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
      setShowCreate(false);
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
    <div className="space-y-4 p-md md:p-lg">
      {error && (
        <button type="button" className="mb-4 block w-full rounded-md bg-red-900/60 px-4 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}
      <div className="flex flex-col gap-2 rounded-posMd border border-white/10 bg-pos-surface/65 p-2 shadow-pos backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {(["ALL", "AVAILABLE", "OCCUPIED", "BILLIARD_ACTIVE", "OUT_OF_SERVICE"] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`touch-target shrink-0 rounded-pos px-3 text-sm font-medium ${statusFilter === status ? "bg-primary text-black" : "text-textMuted hover:bg-white/5"}`}>
              {status === "ALL" ? "Todas" : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        {canManageTables && (
          <button onClick={() => setShowCreate(true)} className="touch-target flex shrink-0 items-center justify-center gap-2 rounded-pos bg-primary px-4 font-semibold text-black">
            <Plus className="h-4 w-4" /> Agregar {typeFilter === "BILLIARD" ? "billar" : "mesa"}
          </button>
        )}
      </div>

      {isLoading && <p className="p-6 text-slate-400">Cargando mesas…</p>}
      {isError && <p className="p-6 text-red-400">No se pudieron cargar las mesas.</p>}
      {!isLoading && !isError && tables?.length === 0 && (
        <p className="p-6 text-slate-500">Todavía no hay mesas registradas.</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
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

      {showCreate && (
        <FormModal
          title={`Agregar ${typeFilter === "BILLIARD" ? "billar" : "mesa"}`}
          onClose={() => setShowCreate(false)}
          footer={(
            <>
              <button onClick={() => setShowCreate(false)} className="touch-target flex-1 rounded-pos border border-border text-textMuted">Cancelar</button>
              <button disabled={!newTableName || createMutation.isPending} onClick={() => createMutation.mutate()} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-40">
                {createMutation.isPending ? "Guardando…" : "Guardar"}
              </button>
            </>
          )}
        >
          <div className="space-y-3">
            <label className="block text-sm text-textMuted">Nombre
              <input autoFocus value={newTableName} onChange={(e) => setNewTableName(e.target.value)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" />
            </label>
            {!typeFilter && <label className="block text-sm text-textMuted">Tipo
              <select value={newTableType} onChange={(e) => setNewTableType(e.target.value as DiningTableType)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text"><option value="STANDARD">Normal</option><option value="BILLIARD">Billar</option></select>
            </label>}
            <label className="block text-sm text-textMuted">Capacidad
              <input type="number" min={1} value={newTableCapacity} onChange={(e) => setNewTableCapacity(e.target.value)} placeholder="Número de personas" className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" />
            </label>
          </div>
        </FormModal>
      )}
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
  const StatusIcon = table.status === "AVAILABLE"
    ? CheckCircle2
    : table.status === "OUT_OF_SERVICE"
      ? Ban
      : table.status === "BILLIARD_ACTIVE"
        ? Clock
        : Users;

  return (
    <div className={`group overflow-hidden rounded-posLg border shadow-pos backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-white/30 hover:shadow-posXl ${STATUS_STYLES[table.status]}`}>
      <button
        onClick={onTap}
        disabled={table.outOfService}
        className="flex min-h-28 w-full flex-col p-3.5 text-left"
      >
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-posMd border border-current/20 bg-black/20 shadow-pos">
              <StatusIcon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight text-text">{table.name}</span>
              {table.capacity !== null && <span className="flex items-center gap-1 text-[11px] text-textMuted"><Users className="h-3 w-3" /> {table.capacity} personas</span>}
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-current/30 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">{table.billiardStatus === "PAUSED" ? "Pausada" : STATUS_LABELS[table.status]}</span>
        </div>
        <div className="mt-3 flex w-full items-end justify-between gap-3 border-t border-current/15 pt-2.5">
          <div className="min-w-0 space-y-0.5 text-[11px] text-textMuted">
            {table.openedByName ? <span className="flex items-center gap-1 truncate"><User className="h-3 w-3 shrink-0" /> {table.openedByName}</span> : <span>Lista para abrir</span>}
            {table.openedAt && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(table.openedAt)}</span>}
          </div>
          <div className="shrink-0 text-right">
            {table.billiardElapsedSeconds !== null && <span className="block font-mono text-base font-bold text-primary">{formatElapsed(elapsed)}</span>}
            {table.orderTotalCents !== null && <span className="block text-lg font-black leading-none text-text">{formatMoney(table.orderTotalCents)}</span>}
          </div>
        </div>
      </button>
      <div className="flex gap-2 border-t border-current/20 bg-black/15 p-2">
        <button onClick={onTap} disabled={table.outOfService} className="touch-target flex-1 rounded-pos bg-white/10 px-3 text-sm font-bold text-text hover:bg-white/15 disabled:opacity-40">
          {table.activeOrderId ? "Ver cuenta" : "Abrir mesa"}
        </button>
        {canManage && <button onClick={onToggleOutOfService} className="touch-target flex items-center gap-1 rounded-pos border border-current/25 bg-black/10 px-3 text-xs font-medium text-textMuted hover:bg-white/10">
          {table.outOfService ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />} {table.outOfService ? "Reactivar" : "Fuera de servicio"}
        </button>}
      </div>
    </div>
  );
}
