import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCategoriesAdmin, createCategory, updateCategory } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name, icon: icon || null, sortOrder: (data?.length ?? 0) + 1 }),
    onSuccess: () => {
      setName("");
      setIcon("");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear la categoría."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCategory(id, { active }),
    onSuccess: invalidate,
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Categorías</h1>
      <div className="mb-4 flex gap-2">
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Ícono"
          maxLength={4}
          className="w-16 touch-target rounded-md bg-slate-800 px-3 text-center text-white"
        />
        <input
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
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        {data?.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-md bg-slate-800 px-3 py-2">
            <span className={c.active ? "text-white" : "text-slate-500 line-through"}>
              {c.icon && <span className="mr-2">{c.icon}</span>}
              {c.name}
            </span>
            <button
              onClick={() => toggleMutation.mutate({ id: c.id, active: !c.active })}
              className="touch-target rounded-md bg-slate-700 px-3 text-sm text-slate-200"
            >
              {c.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
