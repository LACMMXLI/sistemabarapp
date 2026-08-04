import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useLogin } from "../hooks/useAuth";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  if (status === "authenticated") return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <form
        className="w-full max-w-sm rounded-xl !bg-slate-900 p-8 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ username, password });
        }}
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Bar POS</h1>
        <label className="mb-1 block text-sm text-slate-300">Usuario</label>
        <input
          className="mb-4 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus:ring-2 focus:ring-sky-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
        />
        <label className="mb-1 block text-sm text-slate-300">Contraseña</label>
        <input
          type="password"
          className="mb-4 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus:ring-2 focus:ring-sky-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {login.isError && (
          <p className="mb-4 text-sm text-red-400">
            {login.error instanceof ApiError ? login.error.message : "No se pudo iniciar sesión."}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="touch-target w-full rounded-md bg-sky-600 font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {login.isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
