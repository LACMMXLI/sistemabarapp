import type {
  Category,
  CreateCategoryInput,
  CreateProductInput,
  CreateUserInput,
  ProductAdmin,
  UpdateCategoryInput,
  UpdateProductInput,
  UpdateUserInput,
  UserPublic,
  CreateTableInput,
  DiningTable,
} from "@barapp/contracts";
import { apiFetch } from "./api";

export const fetchCategoriesAdmin = (): Promise<Category[]> => apiFetch<Category[]>("/categories?includeInactive=true");
export const createCategory = (input: CreateCategoryInput) =>
  apiFetch<Category>("/categories", { method: "POST", body: JSON.stringify(input) });
export const updateCategory = (id: string, input: UpdateCategoryInput) =>
  apiFetch<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const fetchProductsAdmin = (): Promise<ProductAdmin[]> => apiFetch<ProductAdmin[]>("/products/admin");
export const createProduct = (input: CreateProductInput) =>
  apiFetch<ProductAdmin>("/products", { method: "POST", body: JSON.stringify(input) });
export const updateProduct = (id: string, input: UpdateProductInput) =>
  apiFetch<ProductAdmin>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const fetchUsers = (): Promise<UserPublic[]> => apiFetch<UserPublic[]>("/users");
export const createUser = (input: CreateUserInput) => apiFetch<UserPublic>("/users", { method: "POST", body: JSON.stringify(input) });
export const updateUser = (id: string, input: UpdateUserInput) =>
  apiFetch<UserPublic>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const createTable = (input: CreateTableInput) =>
  apiFetch<void>("/tables", { method: "POST", body: JSON.stringify(input) });
export const fetchTablesAdmin = (): Promise<DiningTable[]> => apiFetch<DiningTable[]>("/tables");
