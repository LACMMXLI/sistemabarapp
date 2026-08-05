import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, History, Search } from "lucide-react";
import type { AuditLogDto } from "@barapp/contracts";
import { APP_TIMEZONE } from "@barapp/config";
import { fetchAuditLog } from "../lib/auditApi";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, describeAuditLog } from "../lib/auditLabels";
import { PageHeader } from "../components/PageHeader";
import { FormModal } from "../components/FormModal";

const PAGE_SIZE = 25;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { timeZone: APP_TIMEZONE, dateStyle: "short", timeStyle: "short" });
}

export function AuditPage() {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogDto | null>(null);

  const params = {
    search: search || undefined,
    entityType: entityType || undefined,
    action: action || undefined,
    from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
    to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit", params],
    queryFn: () => fetchAuditLog(params),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-4 p-3 md:p-4">
      <PageHeader title="Auditoría" description="Historial de acciones administrativas y operativas." />

      <div className="grid grid-cols-1 gap-2 rounded-pos border border-border bg-pos-bg/45 p-2 sm:grid-cols-2 md:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Buscar…"
            className="w-full touch-target rounded-md bg-slate-800 pl-9 pr-3 text-white"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            resetPage();
          }}
          className="touch-target rounded-md bg-slate-800 px-2 text-white"
        >
          <option value="">Toda entidad</option>
          {Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            resetPage();
          }}
          className="touch-target rounded-md bg-slate-800 px-2 text-white"
        >
          <option value="">Toda acción</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            resetPage();
          }}
          className="touch-target rounded-md bg-slate-800 px-2 text-white"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            resetPage();
          }}
          className="touch-target rounded-md bg-slate-800 px-2 text-white"
        />
      </div>

      {isLoading && <p className="text-slate-400">Cargando auditoría…</p>}
      {isError && <p className="text-red-400">No se pudo cargar la auditoría.</p>}
      {!isLoading && !isError && data?.items.length === 0 && <p className="text-slate-500">No hay registros para estos filtros.</p>}

      <div className="divide-y divide-border overflow-hidden rounded-posLg border border-border bg-pos-surface/85 shadow-pos">
        {data?.items.map((log) => (
          <button
            key={log.id}
            onClick={() => setSelected(log)}
            className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-textMuted hover:bg-white/5"
          >
            <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><History className="h-4 w-4" /></span><div>
              <span className="block truncate font-medium text-text">{describeAuditLog(log.action, log.entityType)}</span>
              <span className="text-xs text-textMuted">{log.userName ?? "Sistema"} · <span className="rounded-full bg-white/5 px-2 py-0.5">{AUDIT_ENTITY_LABELS[log.entityType] ?? log.entityType}</span></span>
            </div>
            </div>
            <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
          </button>
        ))}
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="sticky bottom-0 flex items-center justify-between rounded-pos border border-border bg-pos-surface/95 p-2 text-sm text-textMuted backdrop-blur-md">
          <span>
            Página {data.page} de {totalPages} · {data.total} registros
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="touch-target flex items-center gap-1 rounded-md bg-slate-800 px-3 text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="touch-target flex items-center gap-1 rounded-md bg-slate-800 px-3 text-white disabled:opacity-40"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <FormModal title={describeAuditLog(selected.action, selected.entityType)} onClose={() => setSelected(null)} width="max-w-md">
            <dl className="space-y-2 text-sm text-slate-300">
              <Row label="Fecha" value={formatDate(selected.createdAt)} />
              <Row label="Usuario" value={selected.userName ?? "Sistema"} />
              <Row label="Entidad" value={AUDIT_ENTITY_LABELS[selected.entityType] ?? selected.entityType} />
              {selected.entityId && <Row label="ID" value={selected.entityId} />}
            </dl>
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Detalle</p>
                <pre className="overflow-x-auto rounded-md bg-slate-950 p-2 text-xs text-slate-400">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}
        </FormModal>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  );
}
