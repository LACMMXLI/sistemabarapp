import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, ShieldCheck, ShieldOff } from "lucide-react";
import type { Role, UserPublic } from "@barapp/contracts";
import { fetchUsers, createUser, updateUser } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const ROLE_LABELS: Record<Role, string> = { ADMIN: "Administrador", CAJERO: "Cajero", MESERO: "Mesero" };

export function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("MESERO");
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<UserPublic | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: () => createUser({ username, fullName, password, role }),
    onSuccess: () => {
      setUsername("");
      setFullName("");
      setPassword("");
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear el usuario."),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => updateUser(id, { active: true }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo activar el usuario."),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => updateUser(id, { active: false }),
    onSuccess: () => {
      setDeactivatingUser(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo desactivar el usuario."),
  });

  return (
    <div className="p-3 md:p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Usuarios</h1>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-5">
        <div>
          <label htmlFor="new-username" className="mb-1 block text-xs text-slate-400">
            Usuario
          </label>
          <input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </div>
        <div>
          <label htmlFor="new-fullname" className="mb-1 block text-xs text-slate-400">
            Nombre completo
          </label>
          <input id="new-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </div>
        <div>
          <label htmlFor="new-password" className="mb-1 block text-xs text-slate-400">
            Contraseña (mín. 8)
          </label>
          <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </div>
        <div>
          <label htmlFor="new-role" className="mb-1 block text-xs text-slate-400">
            Rol
          </label>
          <select id="new-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full touch-target rounded-md bg-slate-800 px-2 text-white">
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            disabled={!username || !fullName || password.length < 8 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="touch-target w-full rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
          >
            Crear usuario
          </button>
        </div>
      </div>

      {error && (
        <button type="button" className="mb-3 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {isLoading && <p className="text-slate-400">Cargando usuarios…</p>}
      {isError && <p className="text-red-400">No se pudieron cargar los usuarios.</p>}

      <div className="space-y-2">
        {data?.map((u) => {
          const isSelf = u.id === currentUser?.id;
          return (
            <div key={u.id} className="flex items-center justify-between rounded-md bg-slate-800 px-3 py-2">
              <div>
                <span className={u.active ? "text-white" : "text-slate-500 line-through"}>{u.fullName}</span>
                <span className="ml-2 text-xs text-slate-400">
                  @{u.username} · {ROLE_LABELS[u.role]}
                  {!u.active && " · Inactivo"}
                  {isSelf && " · Tú"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingUser(u)}
                  aria-label={`Editar ${u.fullName}`}
                  className="touch-target flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-slate-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {u.active ? (
                  <button
                    onClick={() => setDeactivatingUser(u)}
                    disabled={isSelf}
                    aria-label={`Desactivar ${u.fullName}`}
                    title={isSelf ? "No puedes desactivar tu propia cuenta" : "Desactivar"}
                    className="touch-target flex items-center gap-1 rounded-md bg-red-900/60 px-3 text-sm text-red-200 disabled:opacity-30"
                  >
                    <ShieldOff className="h-4 w-4" /> Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => activateMutation.mutate(u.id)}
                    className="touch-target flex items-center gap-1 rounded-md bg-emerald-900/60 px-3 text-sm text-emerald-200"
                  >
                    <ShieldCheck className="h-4 w-4" /> Activar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            invalidate();
          }}
        />
      )}

      {deactivatingUser && (
        <ConfirmDialog
          title={`Desactivar a ${deactivatingUser.fullName}`}
          description="El usuario ya no podrá iniciar sesión. Puedes reactivarlo después."
          confirmLabel="Desactivar"
          destructive
          error={error}
          pending={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate(deactivatingUser.id)}
          onCancel={() => setDeactivatingUser(null)}
        />
      )}
    </div>
  );
}

function EditUserDialog({ user, onClose, onSaved }: { user: UserPublic; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.fullName);
  const [role, setRole] = useState<Role>(user.role);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateUser(user.id, {
        fullName,
        role,
        password: newPassword.trim() ? newPassword.trim() : undefined,
      }),
    onSuccess: onSaved,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo guardar el usuario."),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-white">Editar {user.username}</h2>

        <label htmlFor="edit-fullname" className="mb-1 block text-sm text-slate-300">
          Nombre completo
        </label>
        <input
          id="edit-fullname"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />

        <label htmlFor="edit-role" className="mb-1 block text-sm text-slate-300">
          Rol
        </label>
        <select
          id="edit-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="mb-3 w-full touch-target rounded-md bg-slate-800 px-2 text-white"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label htmlFor="edit-password" className="mb-1 block text-sm text-slate-300">
          Restablecer contraseña (opcional)
        </label>
        <input
          id="edit-password"
          type="password"
          placeholder="Dejar en blanco para no cambiarla"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mb-4 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={saveMutation.isPending} className="touch-target flex-1 rounded-md bg-slate-800 text-slate-300 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!fullName || (newPassword.trim().length > 0 && newPassword.trim().length < 8) || saveMutation.isPending}
            className="touch-target flex-1 rounded-md bg-sky-600 font-semibold text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
