import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Pencil, X } from "lucide-react";
import type { Category } from "@barapp/contracts";
import { fetchCategoriesAdmin, createCategory, updateCategory } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name, icon: icon || null, sortOrder: (data?.length ?? 0) + 1 }),
    onSuccess: () => {
      setName("");
      setIcon("");
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear la categoría."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCategory(id, { active }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo actualizar la categoría."),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, patchName, patchIcon }: { id: string; patchName: string; patchIcon: string }) =>
      updateCategory(id, { name: patchName, icon: patchIcon || null }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo guardar la categoría."),
  });

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditIcon(c.icon ?? "");
  };

  return (
    <div className="p-3 md:p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/productos" className="touch-target flex items-center gap-2 rounded-md bg-slate-800 px-3 text-sm text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Productos
        </Link>
        <h1 className="text-lg font-semibold text-white">Categorías</h1>
      </div>

      <div className="mb-4 flex gap-2">
        <label htmlFor="new-category-icon" className="sr-only">
          Ícono
        </label>
        <input
          id="new-category-icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Ícono"
          maxLength={4}
          className="w-16 touch-target rounded-md bg-slate-800 px-3 text-center text-white"
        />
        <label htmlFor="new-category-name" className="sr-only">
          Nombre de la categoría
        </label>
        <input
          id="new-category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la categoría"
          className="touch-target flex-1 rounded-md bg-slate-800 px-3 text-white"
        />
        <button
          disabled={!name || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="touch-target rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
        >
          Crear
        </button>
      </div>

      {error && (
        <button type="button" className="mb-3 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {isLoading && <p className="text-slate-400">Cargando categorías…</p>}
      {isError && <p className="text-red-400">No se pudieron cargar las categorías.</p>}

      <div className="space-y-2">
        {data?.map((c) =>
          editingId === c.id ? (
            <div key={c.id} className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2">
              <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} maxLength={4} className="w-14 touch-target rounded-md bg-slate-700 px-2 text-center text-white" />
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 touch-target rounded-md bg-slate-700 px-3 text-white" />
              <button
                onClick={() => editMutation.mutate({ id: c.id, patchName: editName, patchIcon: editIcon })}
                disabled={!editName || editMutation.isPending}
                aria-label="Guardar"
                className="touch-target flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditingId(null)} aria-label="Cancelar" className="touch-target flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div key={c.id} className="flex items-center justify-between rounded-md bg-slate-800 px-3 py-2">
              <span className={c.active ? "text-white" : "text-slate-500 line-through"}>
                {c.icon && <span className="mr-2">{c.icon}</span>}
                {c.name}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(c)} aria-label={`Editar ${c.name}`} className="touch-target flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-slate-200">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: c.id, active: !c.active })}
                  className="touch-target rounded-md bg-slate-700 px-3 text-sm text-slate-200"
                >
                  {c.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
