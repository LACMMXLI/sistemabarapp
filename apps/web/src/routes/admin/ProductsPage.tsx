import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProductsAdmin, createProduct, updateProduct, fetchCategoriesAdmin } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ["products-admin"], queryFn: fetchProductsAdmin });
  const { data: categories } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });

  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tracksInventory, setTracksInventory] = useState(false);
  const [initialStock, setInitialStock] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear el producto."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateProduct(id, { active }),
    onSuccess: invalidate,
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Productos</h1>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="touch-target rounded-md bg-slate-800 px-3 text-white" />
        <input placeholder="Precio" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} inputMode="decimal" className="touch-target rounded-md bg-slate-800 px-3 text-white" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="touch-target rounded-md bg-slate-800 px-2 text-white">
          <option value="">Categoría…</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="URL de la foto (opcional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="touch-target rounded-md bg-slate-800 px-3 text-white"
        />
        <label className="flex touch-target items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={tracksInventory} onChange={(e) => setTracksInventory(e.target.checked)} />
          Controla inventario
        </label>
        {tracksInventory && (
          <input
            type="number"
            placeholder="Stock inicial"
            value={initialStock}
            onChange={(e) => setInitialStock(Number(e.target.value))}
            className="touch-target rounded-md bg-slate-800 px-3 text-white"
          />
        )}
      </div>
      <button
        disabled={!name || !categoryId || createMutation.isPending}
        onClick={() => createMutation.mutate()}
        className="touch-target mb-4 rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
      >
        Crear producto
      </button>
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      <table className="w-full text-sm text-slate-200">
        <thead className="text-slate-400">
          <tr>
            <th className="text-left">Nombre</th>
            <th className="text-right">Precio</th>
            <th className="text-right">Stock</th>
            <th className="text-right">Estado</th>
          </tr>
        </thead>
        <tbody>
          {products?.map((p) => (
            <tr key={p.id}>
              <td className="w-10 py-1">
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
                <button onClick={() => toggleMutation.mutate({ id: p.id, active: !p.active })} className="touch-target rounded-md bg-slate-700 px-2 text-xs">
                  {p.active ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
