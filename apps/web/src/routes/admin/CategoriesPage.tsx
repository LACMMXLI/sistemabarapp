import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import type { Category } from "@barapp/contracts";
import { fetchCategoriesAdmin, createCategory, updateCategory } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { FormModal } from "../../components/FormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deactivating, setDeactivating] = useState<Category | null>(null);

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
      setShowCreate(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear la categoría."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCategory(id, { active }),
    onSuccess: () => { setDeactivating(null); invalidate(); },
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
    <div className="space-y-4 p-3 md:p-4">
      <PageHeader title="Categorías" description="Organiza el catálogo que se muestra en la venta." action={<div className="flex gap-2"><Link to="/productos" className="touch-target flex items-center gap-2 rounded-pos border border-border px-3 text-sm text-textMuted"><ArrowLeft className="h-4 w-4" /> Productos</Link><button onClick={() => setShowCreate(true)} className="touch-target flex items-center gap-2 rounded-pos bg-primary px-4 font-semibold text-black"><Plus className="h-4 w-4" /> Nueva categoría</button></div>} />

      {error && (
        <button type="button" className="mb-3 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {isLoading && <p className="text-slate-400">Cargando categorías…</p>}
      {isError && <p className="text-red-400">No se pudieron cargar las categorías.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-posLg border border-border bg-pos-surface/85 p-4 shadow-pos">
              <span className={c.active ? "text-white" : "text-slate-500 line-through"}>
                {c.icon && <span className="mr-2">{c.icon}</span>}
                {c.name}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(c)} aria-label={`Editar ${c.name}`} className="touch-target flex w-11 items-center justify-center rounded-pos border border-border text-textMuted">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => c.active ? setDeactivating(c) : toggleMutation.mutate({ id: c.id, active: true })}
                  className="touch-target rounded-pos border border-border px-3 text-sm text-textMuted"
                >
                  {c.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
        ))}
      </div>

      {showCreate && <FormModal title="Nueva categoría" onClose={() => setShowCreate(false)} footer={<><button onClick={() => setShowCreate(false)} className="touch-target flex-1 rounded-pos border border-border text-textMuted">Cancelar</button><button disabled={!name || createMutation.isPending} onClick={() => createMutation.mutate()} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-40">{createMutation.isPending ? "Guardando…" : "Crear"}</button></>}><div className="grid grid-cols-[80px_1fr] gap-3"><label className="text-sm text-textMuted">Ícono<input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-2 text-center text-text" /></label><label className="text-sm text-textMuted">Nombre<input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label></div></FormModal>}

      {editingId && <FormModal title="Editar categoría" onClose={() => setEditingId(null)} footer={<><button onClick={() => setEditingId(null)} className="touch-target flex-1 rounded-pos border border-border text-textMuted">Cancelar</button><button disabled={!editName || editMutation.isPending} onClick={() => editMutation.mutate({ id: editingId, patchName: editName, patchIcon: editIcon })} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-40">{editMutation.isPending ? "Guardando…" : "Guardar"}</button></>}><div className="grid grid-cols-[80px_1fr] gap-3"><label className="text-sm text-textMuted">Ícono<input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} maxLength={4} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-2 text-center text-text" /></label><label className="text-sm text-textMuted">Nombre<input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label></div></FormModal>}

      {deactivating && <ConfirmDialog title={`Desactivar ${deactivating.name}`} description="La categoría dejará de mostrarse para nuevas ventas. Puedes reactivarla después." confirmLabel="Desactivar" destructive pending={toggleMutation.isPending} onConfirm={() => toggleMutation.mutate({ id: deactivating.id, active: false })} onCancel={() => setDeactivating(null)} />}
    </div>
  );
}
