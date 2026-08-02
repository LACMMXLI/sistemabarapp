import { create } from "zustand";
import type { UserPublic } from "@barapp/contracts";

interface AuthState {
  accessToken: string | null;
  user: UserPublic | null;
  status: "idle" | "authenticated" | "unauthenticated";
  setSession: (accessToken: string, user: UserPublic) => void;
  clearSession: () => void;
}

/**
 * El access token vive solo en memoria (nunca en localStorage). El refresh
 * token vive en una cookie HttpOnly que el navegador maneja solo; por eso al
 * recargar la app se debe llamar a /auth/refresh para recuperar sesión.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "idle",
  setSession: (accessToken, user) => set({ accessToken, user, status: "authenticated" }),
  clearSession: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
}));
