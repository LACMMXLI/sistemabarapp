import type { Category, ProductOperational } from "@barapp/contracts";
import { apiFetch } from "./api";

export function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export function fetchProducts(categoryId?: string): Promise<ProductOperational[]> {
  const qs = categoryId ? `?categoryId=${categoryId}` : "";
  return apiFetch<ProductOperational[]>(`/products${qs}`);
}
