import type { AuditLogList } from "@barapp/contracts";
import { apiFetch } from "./api";

export interface AuditQueryParams {
  search?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export function fetchAuditLog(params: AuditQueryParams): Promise<AuditLogList> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.entityType) qs.set("entityType", params.entityType);
  if (params.action) qs.set("action", params.action);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  qs.set("page", String(params.page));
  qs.set("pageSize", String(params.pageSize));
  return apiFetch<AuditLogList>(`/audit?${qs.toString()}`);
}
