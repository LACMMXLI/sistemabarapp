import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { AuditLogDto } from "@barapp/contracts";

export function AuditPage() {
  const { data } = useQuery({
    queryKey: ["audit"],
    queryFn: () => apiFetch<{ items: AuditLogDto[] }>("/audit"),
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Auditoría</h1>
      <div className="space-y-1 text-sm text-slate-300">
        {data?.items.map((log) => (
          <div key={log.id} className="border-b border-slate-800 pb-1">
            <span className="font-medium text-white">{log.action}</span> · {log.entityType} · {log.userName ?? "sistema"}
            <div className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString("es-MX")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
