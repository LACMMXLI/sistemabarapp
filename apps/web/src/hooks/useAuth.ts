import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { LoginResponse } from "@barapp/contracts";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/auth.store";

// Refresh token rota en cada uso: si dos llamadas concurrentes lo usan (p. ej.
// StrictMode montando el efecto dos veces), la segunda recibe 401 porque la
// primera ya lo invalidó. Un candado a nivel de módulo evita el duplicado.
let bootstrapPromise: Promise<LoginResponse> | null = null;

/** Al montar la app, intenta recuperar sesión con la cookie de refresh. */
export function useAuthBootstrap() {
  const [ready, setReady] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;
    if (!bootstrapPromise) {
      bootstrapPromise = apiFetch<LoginResponse>("/auth/refresh", { method: "POST" });
    }
    bootstrapPromise
      .then((data) => {
        if (!cancelled) setSession(data.accessToken, data.user);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ready;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => setSession(data.accessToken, data.user),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: () => apiFetch<void>("/auth/logout", { method: "POST" }),
    onSettled: () => clearSession(),
  });
}
