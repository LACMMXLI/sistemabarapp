import { useAuthStore } from "../store/auth.store";
import type { LoginResponse } from "@barapp/contracts";

const API_URL = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) return false;
    const data = (await res.json()) as LoginResponse;
    useAuthStore.getState().setSession(data.accessToken, data.user);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = useAuthStore.getState().accessToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Sin conexión con el servidor. Verifica tu internet e intenta de nuevo.");
  }

  if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      const token2 = useAuthStore.getState().accessToken;
      headers.set("Authorization", `Bearer ${token2}`);
      try {
        res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
      } catch {
        throw new ApiError("NETWORK_ERROR", "Sin conexión con el servidor. Verifica tu internet e intenta de nuevo.");
      }
    } else {
      useAuthStore.getState().clearSession();
      throw new ApiError("UNAUTHORIZED", "Tu sesión expiró. Inicia sesión de nuevo.");
    }
  }

  if (!res.ok) {
    let body: { error?: { code?: string; message?: string; details?: unknown } } | null = null;
    try {
      body = await res.json();
    } catch {
      // Sin cuerpo JSON: se usa el mensaje genérico de abajo.
    }
    throw new ApiError(
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? "Ocurrió un error inesperado. Intenta de nuevo.",
      body?.error?.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
