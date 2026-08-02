import type { AppSettingsDto, UpdateAppSettingsInput } from "@barapp/contracts";
import { apiFetch } from "./api";

export const fetchSettings = (): Promise<AppSettingsDto> => apiFetch<AppSettingsDto>("/settings");
export const updateSettings = (input: UpdateAppSettingsInput) =>
  apiFetch<AppSettingsDto>("/settings", { method: "PATCH", body: JSON.stringify(input) });
