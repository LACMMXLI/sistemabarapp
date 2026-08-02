import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Pencil, Play, Plus } from "lucide-react";
import type { Category, CreatePromotionInput, ProductAdmin, PromotionDto } from "@barapp/contracts";
import { fetchPromotions, createPromotion, updatePromotion } from "../../lib/promotionsApi";
import { fetchCategoriesAdmin, fetchProductsAdmin } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

function summarizeRule(params: {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  discountType: "FIXED_PRICE" | "PERCENTAGE";
  discountValue: number;
  categoryNames: string[];
  productNames: string[];
}): string {
  const dayLabels =
    params.daysOfWeek.length === 7
      ? "Todos los días"
      : DAYS.filter((d) => params.daysOfWeek.includes(d.value))
          .map((d) => d.label)
          .join(", ");
  const discount =
    params.discountType === "PERCENTAGE" ? `${params.discountValue}% de descuento` : `precio fijo de $${(params.discountValue / 100).toFixed(2)}`;
  const scope = [...params.categoryNames, ...params.productNames];
  const scopeText = scope.length > 0 ? ` en ${scope.join(", ")}` : " en todo el catálogo";
  return `${dayLabels} de ${params.startTime} a ${params.endTime}: ${discount}${scopeText}.`;
}

export function PromotionsPage() {
  const queryClient = useQueryClient();
  const { data: promotions, isLoading, isError } = useQuery({ queryKey: ["promotions"], queryFn: fetchPromotions });
  const { data: categories } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });
  const { data: products } = useQuery({ queryKey: ["products-admin"], queryFn: fetchProductsAdmin });

  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["promotions"] });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updatePromotion(id, { active }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo actualizar la promoción."),
  });

  const categoryName = (id: string) => categories?.find((c) => c.id === id)?.name ?? "";
  const productName = (id: string) => products?.find((p) => p.id === id)?.name ?? "";

  return (
    <div className="p-3 md:p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Promociones</h1>
        <button
          onClick={() => {
            setEditingPromotion(null);
            setShowForm(true);
          }}
          className="touch-target flex items-center gap-2 rounded-md bg-sky-600 px-4 text-white"
        >
          <Plus className="h-4 w-4" /> Nueva promoción
        </button>
      </div>

      {error && (
        <button type="button" className="mb-3 block w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {isLoading && <p className="text-slate-400">Cargando promociones…</p>}
      {isError && <p className="text-red-400">No se pudieron cargar las promociones.</p>}
      {!isLoading && promotions?.length === 0 && <p className="text-slate-500">Todavía no hay promociones configuradas.</p>}

      <div className="space-y-2">
        {promotions?.map((p) => (
          <div key={p.id} className="rounded-md bg-slate-800 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className={`font-semibold ${p.active ? "text-white" : "text-slate-500 line-through"}`}>{p.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingPromotion(p);
                    setShowForm(true);
                  }}
                  aria-label={`Editar ${p.name}`}
                  className="touch-target flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-slate-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: p.id, active: !p.active })}
                  className={`touch-target flex items-center gap-1 rounded-md px-3 text-xs font-medium ${
                    p.active ? "bg-amber-900/60 text-amber-200" : "bg-emerald-900/60 text-emerald-200"
                  }`}
                >
                  {p.active ? (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Activar
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {summarizeRule({
                daysOfWeek: p.daysOfWeek,
                startTime: p.startTime,
                endTime: p.endTime,
                discountType: p.discountType,
                discountValue: p.discountValue,
                categoryNames: p.categoryIds.map(categoryName).filter(Boolean),
                productNames: p.productIds.map(productName).filter(Boolean),
              })}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <PromotionFormDialog
          promotion={editingPromotion}
          categories={categories ?? []}
          products={products ?? []}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function PromotionFormDialog({
  promotion,
  categories,
  products,
  onClose,
  onSaved,
}: {
  promotion: PromotionDto | null;
  categories: Category[];
  products: ProductAdmin[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(promotion?.name ?? "");
  const [days, setDays] = useState<number[]>(promotion?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState(promotion?.startTime ?? "18:00");
  const [endTime, setEndTime] = useState(promotion?.endTime ?? "22:00");
  const [discountType, setDiscountType] = useState<"FIXED_PRICE" | "PERCENTAGE">(promotion?.discountType ?? "PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(
    promotion ? (promotion.discountType === "FIXED_PRICE" ? (promotion.discountValue / 100).toFixed(2) : String(promotion.discountValue)) : "10",
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(promotion?.categoryIds ?? []);
  const [productIds, setProductIds] = useState<string[]>(promotion?.productIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const toggleCategory = (id: string) => setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleProduct = (id: string) => setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const buildInput = (): CreatePromotionInput => ({
    name,
    daysOfWeek: days,
    startTime,
    endTime,
    discountType,
    discountValue: discountType === "FIXED_PRICE" ? Math.round(parseFloat(discountValue || "0") * 100) : Number(discountValue) || 0,
    priority: promotion?.priority ?? 0,
    categoryIds,
    productIds,
  });

  const saveMutation = useMutation({
    mutationFn: () => (promotion ? updatePromotion(promotion.id, buildInput()) : createPromotion(buildInput())),
    onSuccess: onSaved,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo guardar la promoción."),
  });

  const summary = summarizeRule({
    daysOfWeek: days,
    startTime,
    endTime,
    discountType,
    discountValue: discountType === "FIXED_PRICE" ? Math.round(parseFloat(discountValue || "0") * 100) : Number(discountValue) || 0,
    categoryNames: categoryIds.map((id) => categories.find((c) => c.id === id)?.name ?? "").filter(Boolean),
    productNames: productIds.map((id) => products.find((p) => p.id === id)?.name ?? "").filter(Boolean),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-slate-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-white">{promotion ? "Editar promoción" : "Nueva promoción"}</h2>

        <label htmlFor="promo-name" className="mb-1 block text-sm text-slate-300">
          Nombre
        </label>
        <input
          id="promo-name"
          placeholder="Ej. Happy hour"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white"
        />

        <p className="mb-1 text-sm text-slate-300">Días de la semana</p>
        <div className="mb-3 flex gap-1">
          {DAYS.map((d) => (
            <button
              key={d.value}
              onClick={() => toggleDay(d.value)}
              aria-pressed={days.includes(d.value)}
              className={`touch-target flex-1 rounded-md text-xs font-medium ${days.includes(d.value) ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400"}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <label htmlFor="promo-start" className="mb-1 block text-sm text-slate-300">
              Hora de inicio
            </label>
            <input id="promo-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-2 text-white" />
          </div>
          <div className="flex-1">
            <label htmlFor="promo-end" className="mb-1 block text-sm text-slate-300">
              Hora de fin
            </label>
            <input id="promo-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-2 text-white" />
          </div>
        </div>

        <div className="mb-3 flex gap-2">
          <select
            aria-label="Tipo de descuento"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
            className="touch-target rounded-md bg-slate-800 px-2 text-white"
          >
            <option value="PERCENTAGE">% de descuento</option>
            <option value="FIXED_PRICE">Precio fijo</option>
          </select>
          <input
            aria-label="Valor del descuento"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            inputMode="decimal"
            className="touch-target flex-1 rounded-md bg-slate-800 px-3 text-white"
          />
        </div>

        <p className="mb-1 text-sm text-slate-300">Categorías aplicables</p>
        <div className="mb-3 max-h-32 overflow-y-auto rounded-md bg-slate-800 p-2">
          {categories.map((c) => (
            <label key={c.id} className="flex touch-target items-center gap-2 text-sm text-slate-200">
              <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
              {c.icon && <span>{c.icon}</span>}
              {c.name}
            </label>
          ))}
        </div>

        <p className="mb-1 text-sm text-slate-300">Productos aplicables</p>
        <div className="mb-3 max-h-32 overflow-y-auto rounded-md bg-slate-800 p-2">
          {products.map((p) => (
            <label key={p.id} className="flex touch-target items-center gap-2 text-sm text-slate-200">
              <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
              {p.name}
            </label>
          ))}
        </div>

        <div className="mb-4 rounded-md bg-sky-950/40 p-3 text-sm text-sky-200">
          <span className="font-semibold">Resumen: </span>
          {summary}
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={saveMutation.isPending} className="touch-target flex-1 rounded-md bg-slate-800 text-slate-300 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!name || days.length === 0 || saveMutation.isPending}
            className="touch-target flex-1 rounded-md bg-sky-600 font-semibold text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
