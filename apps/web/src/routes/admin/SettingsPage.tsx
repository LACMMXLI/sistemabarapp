import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Save } from "lucide-react";
import type { BilliardRateDto } from "@barapp/contracts";
import { fetchSettings, updateSettings } from "../../lib/settingsApi";
import { createBilliardRate, fetchBilliardRates, updateBilliardRate } from "../../lib/billiardApi";
import { ApiError } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { FormModal } from "../../components/FormModal";

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
    <div className="space-y-4 p-3 md:p-4">
      <PageHeader title="Configuración" description="Identidad del negocio y tarifas operativas." />
      <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className="rounded-posLg border border-border bg-pos-surface/85 p-4 shadow-pos">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-text"><Building2 className="h-5 w-5 text-primary" /> Negocio</h2>
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

            <div className="mb-4 flex min-h-24 items-center justify-center overflow-hidden rounded-pos border border-dashed border-border bg-pos-bg/45 p-3">
              {logoUrl ? <img src={logoUrl} alt="Vista previa del logo" className="max-h-20 max-w-full object-contain" /> : <span className="text-sm text-textMuted">Vista previa del logo</span>}
            </div>

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
              className="touch-target flex items-center gap-2 rounded-pos bg-primary px-4 font-semibold text-black disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </>
        )}
      </section>

      <BilliardRatesSection />
      </div>
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
  const [showCreate, setShowCreate] = useState(false);

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
      setShowCreate(false);
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
    <section className="rounded-posLg border border-border bg-pos-surface/85 p-4 shadow-pos">
      <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-text">Tarifas de billar</h2><p className="text-xs text-textMuted">Precio por hora y cargo mínimo.</p></div><button onClick={() => setShowCreate(true)} className="touch-target flex items-center gap-2 rounded-pos bg-primary px-3 text-sm font-semibold text-black"><Plus className="h-4 w-4" /> Nueva</button></div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Cargando tarifas…</p>}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar las tarifas.</p>}
      {!isLoading && rates?.length === 0 && <p className="text-sm text-slate-500">No hay tarifas configuradas.</p>}

      <div className="space-y-2">
        {rates?.map((rate) =>
          editingId === rate.id ? (
            <EditRateRow key={rate.id} rate={rate} onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); invalidate(); }} />
          ) : (
            <div key={rate.id} className="flex items-center justify-between rounded-pos border border-border bg-pos-bg/45 p-3 text-sm">
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
      {showCreate && <FormModal title="Nueva tarifa" onClose={() => setShowCreate(false)} footer={<><button onClick={() => setShowCreate(false)} className="touch-target flex-1 rounded-pos border border-border text-textMuted">Cancelar</button><button disabled={!name || !pricePerHour || createMutation.isPending} onClick={() => createMutation.mutate()} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-40">{createMutation.isPending ? "Guardando…" : "Crear tarifa"}</button></>}><div className="space-y-3"><label className="block text-sm text-textMuted">Nombre<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label><label className="block text-sm text-textMuted">Precio por hora<input value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} inputMode="decimal" className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label><label className="block text-sm text-textMuted">Cargo mínimo<input value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} inputMode="decimal" className="mt-1 w-full touch-target rounded-pos border border-border bg-pos-bg px-3 text-text" /></label>{error && <p className="text-sm text-error">{error}</p>}</div></FormModal>}
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
    <FormModal title={`Editar ${rate.name}`} onClose={onCancel} footer={<><button onClick={onCancel} className="touch-target flex-1 rounded-pos border border-border text-textMuted">Cancelar</button><button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="touch-target flex-1 rounded-pos bg-primary font-semibold text-black disabled:opacity-50">{saveMutation.isPending ? "Guardando…" : "Guardar"}</button></>}>
      <div className="grid grid-cols-1 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="touch-target rounded-md bg-slate-700 px-3 text-white" />
        <input value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} inputMode="decimal" className="touch-target rounded-md bg-slate-700 px-3 text-white" />
        <input value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} inputMode="decimal" className="touch-target rounded-md bg-slate-700 px-3 text-white" />
      </div>
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
    </FormModal>
  );
}
