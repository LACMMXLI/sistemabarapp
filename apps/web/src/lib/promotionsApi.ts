import type { CreatePromotionInput, PromotionDto, UpdatePromotionInput } from "@barapp/contracts";
import { apiFetch } from "./api";

export const fetchPromotions = (): Promise<PromotionDto[]> => apiFetch<PromotionDto[]>("/promotions");
export const createPromotion = (input: CreatePromotionInput) =>
  apiFetch<PromotionDto>("/promotions", { method: "POST", body: JSON.stringify(input) });
export const updatePromotion = (id: string, input: UpdatePromotionInput) =>
  apiFetch<PromotionDto>(`/promotions/${id}`, { method: "PATCH", body: JSON.stringify(input) });
