import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Tags } from "lucide-react";
import type { ProductAdmin } from "@barapp/contracts";
import { fetchProductsAdmin, createProduct, updateProduct, fetchCategoriesAdmin } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { FormModal } from "../../components/FormModal";

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: products, isLoading, isError } = useQuery({ queryKey: ["products-admin"], queryFn: fetchProductsAdmin });
  const { data: categories } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });

  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tracksInventory, setTracksInventory] = useState(false);
  const [initialStock, setInitialStock] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductAdmin | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const visibleProducts = products?.filter((product) =>
    product.name.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")) &&
    (!filterCategory || product.categoryId === filterCategory) &&
    (filterStatus === "ALL" || (filterStatus === "ACTIVE" ? product.active : !product.active)),
  );
  const categoryName = (id: string) => categories?.find((category) => category.id === id)?.name ?? "Sin categoría";

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products-admin"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createProduct({
        name,
        priceCents: Math.round(parseFloat(priceInput || "0") * 100),
        categoryId,
        imageUrl: imageUrl || undefined,
        type: "STANDARD",
        tracksInventory,
        stockDeductPerSale: 1,
        lowStockThreshold: 5,
        initialStock,
        sortOrder: (products?.length ?? 0) + 1,
      }),
    onSuccess: () => {
      setName("");
      setPriceInput("");
      setImageUrl("");
      setInitialStock(0);
      setError(null);
      setShowCreate(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear el producto."),
  });

  return (
    <div className="space-y-4 p-3 md:p-4">
      <PageHeader title="Productos" description="Catálogo, precios, disponibilidad y control de existencias." action={<div className="flex gap-2"><Link to="/categorias" className="touch-target flex items-center gap-2 rounded-pos border border-border px-3 text-sm text-textMuted"><Tags className="h-4 w-4" /> Categorías</Link><button onClick={() => setShowCreate(true)} className="touch-target flex items-center gap-2 rounded-pos bg-primary px-4 font-semibold text-black"><Plus className="h-4 w-4" /> Nuevo producto</button></div>} />

      <div className="grid gap-2 rounded-pos border border-border bg-pos-bg/45 p-2 sm:grid-cols-[minmax(180px,1fr)_180px_150px]">
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…" className="w-full touch-target rounded-pos border border-border bg-pos-bg pl-9 pr-3 text-text" /></label>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="touch-target rounded-pos border border-border bg-pos-bg px-3 text-text"><option value="">Todas las categorías</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} className="touch-target rounded-pos border border-border bg-pos-bg px-3 text-text"><option value="ALL">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select>
      </div>
      {error && (
        <button type="button" className="mb-3 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {isLoading && <p className="text-slate-400">Cargando productos…</p>}
      {isError && <p className="text-red-400">No se pudieron cargar los productos.</p>}

      <div className="hidden overflow-x-auto rounded-pos border border-border md:block">
        <table className="w-full min-w-[680px] text-sm text-text">
          <thead className="text-slate-400">
            <tr>
              <th className="py-1 text-left"></th>
              <th className="text-left">Nombre</th>
              <th className="text-left">Categoría</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts?.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="w-10 py-1.5">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <span className="inline-block h-8 w-8 rounded bg-slate-800 text-center text-xs leading-8">—</span>
                  )}
                </td>
                <td className={p.active ? "" : "text-slate-500 line-through"}>{p.name}</td>
                <td>{categoryName(p.categoryId)}</td>
                <td className="text-right">${(p.priceCents / 100).toFixed(2)}</td>
                <td className="text-right">{p.currentStock ?? "—"}</td>
                <td className="text-right">
                  <span className={p.active ? "text-emerald-400" : "text-slate-500"}>{p.active ? "Activo" : "Inactivo"}</span>
                </td>
                <td className="py-1.5 text-right">
                  <button
                    onClick={() => setEditingProduct(p)}
                    aria-label={`Editar ${p.name}`}
                    className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-slate-200"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 md:hidden">{visibleProducts?.map((product) => <div key={product.id} className="flex items-center gap-3 rounded-pos border border-border bg-pos-surface/85 p-3"><div className="h-12 w-12 overflow-hidden rounded-pos bg-pos-bg">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-text">{product.name}</p><p className="text-xs text-textMuted">{categoryName(product.categoryId)} · ${(product.priceCents / 100).toFixed(2)}</p><span className={`text-xs ${product.active ? "text-success" : "text-textMuted"}`}>{product.active ? "Activo" : "Inactivo"}</span></div><button onClick={() => setEditingProduct(product)} aria-label={`Editar ${product.name}`} className="touch-target flex w-11 items-center justify-center rounded-pos border border-border text-text"><Pencil className="h-4 w-4" /></button></div>)}</div>

      {showCreate && <FormModal title="Nuevo producto" onClose={() => setShowCreate(false)} footer={<><button onClick={() => setShowCreate(false)} className="touch-target flex-1 rounded-pos border border-border text-textMuted">Cancelar</button><button disabled={!name || !categoryId || createMutation.isPending} onClick={() => createMutation.mutate()} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-40">{createMutation.isPending ? "Guardando…" : "Crear producto"}</button></>}>
        <div className="space-y-3"><label className="block text-sm text-textMuted">Nombre<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-textMuted">Precio<input value={priceInput} onChange={(e) => setPriceInput(e.target.value)} inputMode="decimal" className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label><label className="text-sm text-textMuted">Categoría<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text"><option value="">Selecciona…</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div><label className="block text-sm text-textMuted">URL de la foto<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label><label className="flex touch-target items-center gap-2 text-sm text-text"><input type="checkbox" checked={tracksInventory} onChange={(e) => setTracksInventory(e.target.checked)} /> Controla inventario</label>{tracksInventory && <label className="block text-sm text-textMuted">Stock inicial<input type="number" value={initialStock} onChange={(e) => setInitialStock(Number(e.target.value))} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label>}{error && <p className="text-sm text-error">{error}</p>}</div>
      </FormModal>}

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function EditProductDialog({ product, onClose, onSaved }: { product: ProductAdmin; onClose: () => void; onSaved: () => void }) {
  const { data: categories } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });
  const [name, setName] = useState(product.name);
  const [priceInput, setPriceInput] = useState((product.priceCents / 100).toFixed(2));
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [tracksInventory, setTracksInventory] = useState(product.tracksInventory);
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product.lowStockThreshold));
  const [active, setActive] = useState(product.active);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProduct(product.id, {
        name,
        priceCents: Math.round(parseFloat(priceInput || "0") * 100),
        categoryId,
        imageUrl: imageUrl || null,
        tracksInventory,
        lowStockThreshold: Number(lowStockThreshold) || 0,
        active,
      }),
    onSuccess: onSaved,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo guardar el producto."),
  });

  return (
    <FormModal title="Editar producto" onClose={onClose} width="max-w-md" footer={<><button onClick={onClose} disabled={saveMutation.isPending} className="touch-target flex-1 rounded-pos border border-border text-textMuted disabled:opacity-50">Cancelar</button><button onClick={() => saveMutation.mutate()} disabled={!name || !categoryId || saveMutation.isPending} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-50">{saveMutation.isPending ? "Guardando…" : "Guardar"}</button></>}>

        <label htmlFor="edit-product-name" className="mb-1 block text-sm text-slate-300">
          Nombre
        </label>
        <input id="edit-product-name" value={name} onChange={(e) => setName(e.target.value)} className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white" />

        <label htmlFor="edit-product-price" className="mb-1 block text-sm text-slate-300">
          Precio
        </label>
        <input
          id="edit-product-price"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          inputMode="decimal"
          className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
        />

        <label htmlFor="edit-product-category" className="mb-1 block text-sm text-slate-300">
          Categoría
        </label>
        <select
          id="edit-product-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mb-3 w-full touch-target rounded-md bg-slate-800 px-2 text-white"
        >
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="edit-product-image" className="mb-1 block text-sm text-slate-300">
          URL de la foto
        </label>
        <input
          id="edit-product-image"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
        />

        <label className="mb-3 flex touch-target items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={tracksInventory} onChange={(e) => setTracksInventory(e.target.checked)} />
          Controla inventario
        </label>

        {tracksInventory && (
          <>
            <label htmlFor="edit-product-threshold" className="mb-1 block text-sm text-slate-300">
              Umbral de stock bajo
            </label>
            <input
              id="edit-product-threshold"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
            />
          </>
        )}

        <label className="mb-4 flex touch-target items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Activo (visible para la venta)
        </label>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

    </FormModal>
  );
}
