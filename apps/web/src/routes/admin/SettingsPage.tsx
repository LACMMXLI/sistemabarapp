import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, X } from "lucide-react";
import type { BilliardRateDto } from "@barapp/contracts";
import { fetchSettings, updateSettings } from "../../lib/settingsApi";
import { createBilliardRate, fetchBilliardRates, updateBilliardRate } from "../../lib/billiardApi";
import { ApiError } from "../../lib/api";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [businessName, setBusinessName] = useState("");
  const [sidebarName, setSidebarName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName);
      setSidebarName(settings.sidebarName);
      setLogoUrl(settings.logoUrl ?? "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => updateSettings({ businessName, sidebarName, logoUrl: logoUrl || null }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo guardar la configuración."),
  });

  return (
    <div className="p-3 md:p-4">
      <h1 className="mb-4 text-lg font-semibold text-white">Configuración</h1>

      <section className="mb-6 max-w-lg rounded-lg bg-slate-900 p-4">
        <h2 className="mb-3 font-semibold text-white">Negocio</h2>
        {isLoading && <p className="text-sm text-slate-400">Cargando…</p>}
        {!isLoading && (
          <>
            <label htmlFor="business-name" className="mb-1 block text-sm text-slate-300">
              Nombre del negocio
            </label>
            <input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />

            <label htmlFor="sidebar-name" className="mb-1 block text-sm text-slate-300">
              Nombre mostrado en el menú y encabezado
            </label>
            <input
              id="sidebar-name"
              value={sidebarName}
              onChange={(e) => setSidebarName(e.target.value)}
              className="mb-3 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />

            <label htmlFor="logo-url" className="mb-1 block text-sm text-slate-300">
              URL del logo (opcional)
            </label>
            <input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
              className="mb-4 w-full touch-target rounded-md bg-slate-800 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />

            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            <button
              onClick={() => saveMutation.mutate()}
              disabled={!businessName || !sidebarName || saveMutation.isPending}
              className="touch-target rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
            >
              {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </>
        )}
      </section>

      <BilliardRatesSection />
    </div>
  );
}

function BilliardRatesSection() {
  const queryClient = useQueryClient();
  const { data: rates, isLoading, isError } = useQuery({ queryKey: ["billiard-rates"], queryFn: fetchBilliardRates });
  const [name, setName] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [minimumCharge, setMinimumCharge] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["billiard-rates"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createBilliardRate({
        name,
        pricePerHourCents: Math.round(parseFloat(pricePerHour || "0") * 100),
        minimumChargeCents: Math.round(parseFloat(minimumCharge || "0") * 100),
      }),
    onSuccess: () => {
      setName("");
      setPricePerHour("");
      setMinimumCharge("0");
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo crear la tarifa."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateBilliardRate(id, { active }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo actualizar la tarifa."),
  });

  return (
    <section className="max-w-lg rounded-lg bg-slate-900 p-4">
      <h2 className="mb-3 font-semibold text-white">Tarifas de billar</h2>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="text-xs text-slate-400 sm:col-span-1">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </label>
        <label className="text-xs text-slate-400">
          Precio por hora
          <input value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} inputMode="decimal" className="mt-1 w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </label>
        <label className="text-xs text-slate-400">
          Cargo mínimo
          <input value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} inputMode="decimal" className="mt-1 w-full touch-target rounded-md bg-slate-800 px-3 text-white" />
        </label>
      </div>
      <button
        disabled={!name || !pricePerHour || createMutation.isPending}
        onClick={() => createMutation.mutate()}
        className="touch-target mb-4 flex items-center gap-2 rounded-md bg-sky-600 px-4 text-white disabled:opacity-40"
      >
        <Plus className="h-4 w-4" /> Crear tarifa
      </button>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Cargando tarifas…</p>}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar las tarifas.</p>}
      {!isLoading && rates?.length === 0 && <p className="text-sm text-slate-500">No hay tarifas configuradas.</p>}

      <div className="space-y-2">
        {rates?.map((rate) =>
          editingId === rate.id ? (
            <EditRateRow key={rate.id} rate={rate} onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); invalidate(); }} />
          ) : (
            <div key={rate.id} className="flex items-center justify-between rounded-md bg-slate-800 px-3 py-2 text-sm">
              <div className={rate.active ? "text-white" : "text-slate-500 line-through"}>
                <span className="font-medium">{rate.name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  ${(rate.pricePerHourCents / 100).toFixed(2)}/h · mín ${(rate.minimumChargeCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingId(rate.id)} aria-label={`Editar ${rate.name}`} className="touch-target flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-slate-200">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: rate.id, active: !rate.active })}
                  className="touch-target rounded-md bg-slate-700 px-3 text-xs text-slate-200"
                >
                  {rate.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function EditRateRow({ rate, onCancel, onSaved }: { rate: BilliardRateDto; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(rate.name);
  const [pricePerHour, setPricePerHour] = useState((rate.pricePerHourCents / 100).toFixed(2));
  const [minimumCharge, setMinimumCharge] = useState((rate.minimumChargeCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateBilliardRate(rate.id, {
        name,
        pricePerHourCents: Math.round(parseFloat(pricePerHour || "0") * 100),
        minimumChargeCents: Math.round(parseFloat(minimumCharge || "0") * 100),
      }),
    onSuccess: onSaved,
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo guardar la tarifa."),
  });

  return (
    <div className="rounded-md bg-slate-800 px-3 py-2">
      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="touch-target rounded-md bg-slate-700 px-3 text-white" />
        <input value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} inputMode="decimal" className="touch-target rounded-md bg-slate-700 px-3 text-white" />
        <input value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} inputMode="decimal" className="touch-target rounded-md bg-slate-700 px-3 text-white" />
      </div>
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="touch-target flex items-center gap-1 rounded-md bg-emerald-700 px-3 text-sm text-white disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Guardar
        </button>
        <button onClick={onCancel} className="touch-target flex items-center gap-1 rounded-md bg-slate-700 px-3 text-sm text-white">
          <X className="h-4 w-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}
