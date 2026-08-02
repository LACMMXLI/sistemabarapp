import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Tags } from "lucide-react";
import type { ProductAdmin } from "@barapp/contracts";
import { fetchProductsAdmin, createProduct, updateProduct, fetchCategoriesAdmin } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";

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
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear el producto."),
  });

  return (
    <div className="p-3 md:p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Productos</h1>
        <Link to="/categorias" className="touch-target flex items-center gap-2 rounded-md bg-slate-800 px-3 text-sm text-slate-200">
          <Tags className="h-4 w-4" /> Categorías
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-5">
        <div>
          <label htmlFor="new-product-name" className="mb-1 block text-xs text-slate-400">
            Nombre
          </label>
          <input id="new-product-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </div>
        <div>
          <label htmlFor="new-product-price" className="mb-1 block text-xs text-slate-400">
            Precio
          </label>
          <input id="new-product-price" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} inputMode="decimal" className="w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </div>
        <div>
          <label htmlFor="new-product-category" className="mb-1 block text-xs text-slate-400">
            Categoría
          </label>
          <select id="new-product-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-2 text-white">
            <option value="">Selecciona…</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="new-product-image" className="mb-1 block text-xs text-slate-400">
            URL de la foto (opcional)
          </label>
          <input
            id="new-product-image"
            placeholder="https://…"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full touch-target rounded-md bg-slate-800 px-3 text-white"
          />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex touch-target items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={tracksInventory} onChange={(e) => setTracksInventory(e.target.checked)} />
            Controla inventario
          </label>
          {tracksInventory && (
            <input
              type="number"
              aria-label="Stock inicial"
              placeholder="Stock inicial"
              value={initialStock}
              onChange={(e) => setInitialStock(Number(e.target.value))}
              className="touch-target rounded-md bg-slate-800 px-3 text-white"
            />
          )}
        </div>
      </div>
      <button
        disabled={!name || !categoryId || createMutation.isPending}
        onClick={() => createMutation.mutate()}
        className="touch-target mb-4 rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
      >
        Crear producto
      </button>
      {error && (
        <button type="button" className="mb-3 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {isLoading && <p className="text-slate-400">Cargando productos…</p>}
      {isError && <p className="text-red-400">No se pudieron cargar los productos.</p>}

      <div className="overflow-x-auto rounded-md">
        <table className="w-full min-w-[560px] text-sm text-slate-200">
          <thead className="text-slate-400">
            <tr>
              <th className="py-1 text-left"></th>
              <th className="text-left">Nombre</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="w-10 py-1.5">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <span className="inline-block h-8 w-8 rounded bg-slate-800 text-center text-xs leading-8">—</span>
                  )}
                </td>
                <td className={p.active ? "" : "text-slate-500 line-through"}>{p.name}</td>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-slate-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-white">Editar producto</h2>

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

        <div className="flex gap-2">
          <button onClick={onClose} disabled={saveMutation.isPending} className="touch-target flex-1 rounded-md bg-slate-800 text-slate-300 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!name || !categoryId || saveMutation.isPending}
            className="touch-target flex-1 rounded-md bg-sky-600 font-semibold text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
