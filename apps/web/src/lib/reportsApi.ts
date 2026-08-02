import type { BilliardReportDto, ProductsReportDto, SalesReportDto } from "@barapp/contracts";
import { apiFetch } from "./api";

export const fetchSalesReport = (preset: string): Promise<SalesReportDto> => apiFetch<SalesReportDto>(`/reports/sales?preset=${preset}`);
export const fetchProductsReport = (preset: string): Promise<ProductsReportDto> => apiFetch<ProductsReportDto>(`/reports/products?preset=${preset}`);
export const fetchBilliardReport = (preset: string): Promise<BilliardReportDto> => apiFetch<BilliardReportDto>(`/reports/billiard?preset=${preset}`);
