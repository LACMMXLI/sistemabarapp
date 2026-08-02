import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function PromotionsPage() {
  const queryClient = useQueryClient();
  const { data: promotions } = useQuery({ queryKey: ["promotions"], queryFn: fetchPromotions });
  const { data: categories } = useQuery({ queryKey: ["categories-admin"], queryFn: fetchCategoriesAdmin });
  const { data: products } = useQuery({ queryKey: ["products-admin"], queryFn: fetchProductsAdmin });

  const [name, setName] = useState("");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");
  const [discountType, setDiscountType] = useState<"FIXED_PRICE" | "PERCENTAGE">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["promotions"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createPromotion({
        name,
        daysOfWeek: days,
        startTime,
        endTime,
        discountType,
        discountValue: discountType === "FIXED_PRICE" ? Math.round(parseFloat(discountValue) * 100) : Number(discountValue),
        priority: 0,
        categoryIds,
        productIds,
      }),
    onSuccess: () => {
      setName("");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear la promoción."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updatePromotion(id, { active }),
    onSuccess: invalidate,
  });

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Promociones</h1>

      <div className="mb-6 max-w-xl space-y-2 rounded-md bg-slate-900 p-3">
        <input placeholder="Nombre (ej. Happy hour)" value={name} onChange={(e) => setName(e.target.value)} className="w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        <div className="flex gap-1">
          {DAYS.map((d) => (
            <button
              key={d.value}
              onClick={() => toggleDay(d.value)}
              className={`touch-target flex-1 rounded-md text-xs font-medium ${days.includes(d.value) ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="touch-target flex-1 rounded-md bg-slate-800 px-2 text-white" />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="touch-target flex-1 rounded-md bg-slate-800 px-2 text-white" />
        </div>
        <div className="flex gap-2">
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as typeof discountType)} className="touch-target rounded-md bg-slate-800 px-2 text-white">
            <option value="PERCENTAGE">% de descuento</option>
            <option value="FIXED_PRICE">Precio fijo</option>
          </select>
          <input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} inputMode="decimal" className="touch-target flex-1 rounded-md bg-slate-800 px-3 text-white" />
        </div>
        <select multiple value={categoryIds} onChange={(e) => setCategoryIds(Array.from(e.target.selectedOptions).map((o) => o.value))} className="h-24 w-full rounded-md bg-slate-800 px-2 text-white">
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select multiple value={productIds} onChange={(e) => setProductIds(Array.from(e.target.selectedOptions).map((o) => o.value))} className="h-24 w-full rounded-md bg-slate-800 px-2 text-white">
          {products?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={!name || days.length === 0 || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="touch-target w-full rounded-md bg-sky-600 text-white disabled:opacity-40"
        >
          Crear promoción
        </button>
      </div>

      <div className="space-y-2">
        {promotions?.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md bg-slate-800 px-3 py-2">
            <span className={p.active ? "text-white" : "text-slate-500 line-through"}>
              {p.name} · {p.startTime}-{p.endTime}
            </span>
            <button onClick={() => toggleMutation.mutate({ id: p.id, active: !p.active })} className="touch-target rounded-md bg-slate-700 px-3 text-sm text-slate-200">
              {p.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
