import type { BilliardReportDto, ProductsReportDto, SalesReportDto } from "@barapp/contracts";
import { apiFetch } from "./api";

export interface ReportRangeParams {
  preset: "TODAY" | "YESTERDAY" | "CUSTOM";
  from?: string;
  to?: string;
}

function buildQuery(params: ReportRangeParams): string {
  const qs = new URLSearchParams({ preset: params.preset });
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  return qs.toString();
}

export const fetchSalesReport = (params: ReportRangeParams): Promise<SalesReportDto> =>
  apiFetch<SalesReportDto>(`/reports/sales?${buildQuery(params)}`);
export const fetchProductsReport = (params: ReportRangeParams): Promise<ProductsReportDto> =>
  apiFetch<ProductsReportDto>(`/reports/products?${buildQuery(params)}`);
export const fetchBilliardReport = (params: ReportRangeParams): Promise<BilliardReportDto> =>
  apiFetch<BilliardReportDto>(`/reports/billiard?${buildQuery(params)}`);
