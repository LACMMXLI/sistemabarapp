import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@barapp/contracts";
import { fetchUsers, createUser, updateUser } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";

export function UsersPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("MESERO");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: () => createUser({ username, fullName, password, role }),
    onSuccess: () => {
      setUsername("");
      setFullName("");
      setPassword("");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear el usuario."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateUser(id, { active }),
    onSuccess: invalidate,
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Usuarios</h1>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <input placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} className="touch-target rounded-md bg-slate-800 px-3 text-white" />
        <input placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="touch-target rounded-md bg-slate-800 px-3 text-white" />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="touch-target rounded-md bg-slate-800 px-3 text-white" />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="touch-target rounded-md bg-slate-800 px-2 text-white">
          <option value="ADMIN">Administrador</option>
          <option value="CAJERO">Cajero</option>
          <option value="MESERO">Mesero</option>
        </select>
        <button
          disabled={!username || !fullName || password.length < 8 || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="touch-target rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
        >
          Crear
        </button>
      </div>
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        {data?.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-md bg-slate-800 px-3 py-2">
            <span className={u.active ? "text-white" : "text-slate-500 line-through"}>
              {u.fullName} · {u.username} · {u.role}
            </span>
            <button onClick={() => toggleMutation.mutate({ id: u.id, active: !u.active })} className="touch-target rounded-md bg-slate-700 px-3 text-sm text-slate-200">
              {u.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
