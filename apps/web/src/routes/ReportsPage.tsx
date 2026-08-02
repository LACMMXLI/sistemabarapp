import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSalesReport, fetchProductsReport, fetchBilliardReport, type ReportRangeParams } from "../lib/reportsApi";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [preset, setPreset] = useState<"TODAY" | "YESTERDAY" | "CUSTOM">("TODAY");
  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(todayIso());

  const params: ReportRangeParams =
    preset === "CUSTOM"
      ? { preset: "CUSTOM", from: `${fromDate}T00:00:00.000Z`, to: `${toDate}T23:59:59.999Z` }
      : { preset };

  const sales = useQuery({ queryKey: ["report-sales", params], queryFn: () => fetchSalesReport(params) });
  const products = useQuery({ queryKey: ["report-products", params], queryFn: () => fetchProductsReport(params) });
  const billiard = useQuery({ queryKey: ["report-billiard", params], queryFn: () => fetchBilliardReport(params) });

  const anyLoading = sales.isLoading || products.isLoading || billiard.isLoading;
  const anyError = sales.isError || products.isError || billiard.isError;

  return (
    <div className="p-3 md:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-white">Reportes</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(["TODAY", "YESTERDAY", "CUSTOM"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`touch-target rounded-md px-3 text-sm ${preset === p ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"}`}
            >
              {p === "TODAY" ? "Hoy" : p === "YESTERDAY" ? "Ayer" : "Rango"}
            </button>
          ))}
          {preset === "CUSTOM" && (
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="touch-target rounded-md bg-slate-800 px-2 text-sm text-white" />
              <span className="text-slate-500">–</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="touch-target rounded-md bg-slate-800 px-2 text-sm text-white" />
            </div>
          )}
        </div>
      </div>

      {anyLoading && <p className="text-slate-400">Cargando reportes…</p>}
      {anyError && <p className="text-red-400">No se pudieron cargar los reportes. Intenta de nuevo.</p>}

      {sales.data && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-slate-200">Ventas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Total" value={money(sales.data.totalSalesCents)} />
            <Stat label="Órdenes" value={String(sales.data.orderCount)} />
            <Stat label="Ticket promedio" value={money(sales.data.averageTicketCents)} />
          </div>

          {sales.data.orderCount === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No hubo ventas en este periodo.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-300">Por método de pago</h3>
                <div className="space-y-1 text-sm text-slate-300">
                  {sales.data.byPaymentMethod.map((m) => (
                    <div key={m.method} className="flex justify-between">
                      <span>{m.method === "CASH" ? "Efectivo" : m.method === "CARD" ? "Tarjeta" : "Transferencia"}</span>
                      <span>{money(m.totalCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-300">Por empleado</h3>
                <div className="space-y-1 text-sm text-slate-300">
                  {sales.data.byEmployee.map((e) => (
                    <div key={e.userName} className="flex justify-between">
                      <span>{e.userName}</span>
                      <span>{money(e.totalCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <h3 className="mb-1 text-sm font-semibold text-slate-300">Por hora (America/Tijuana)</h3>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {sales.data.byHour.map((h) => (
                    <div key={h.hour} className="flex min-w-[52px] flex-col items-center rounded-md bg-slate-900 px-2 py-1">
                      <span className="text-xs text-slate-400">{h.hour}:00</span>
                      <span className="text-sm font-semibold text-white">{money(h.totalCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {products.data && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-slate-200">Productos</h2>
          {products.data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No hay productos vendidos en este periodo.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="text-left">Producto</th>
                      <th className="text-right">Cant.</th>
                      <th className="text-right">Ingreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.data.topProducts.map((p) => (
                      <tr key={p.productId}>
                        <td>{p.productName}</td>
                        <td className="text-right">{p.quantitySold}</td>
                        <td className="text-right">{money(p.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-300">Ingreso por categoría</h3>
                <div className="space-y-1 text-sm text-slate-300">
                  {products.data.byCategory.map((c) => (
                    <div key={c.categoryId} className="flex justify-between">
                      <span>{c.categoryName}</span>
                      <span>{money(c.revenueCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {billiard.data && (
        <section>
          <h2 className="mb-2 font-semibold text-slate-200">Billar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Sesiones" value={String(billiard.data.sessionCount)} />
            <Stat label="Canceladas" value={String(billiard.data.cancelledCount)} />
            <Stat label="Tiempo total" value={`${Math.round(billiard.data.totalSeconds / 60)} min`} />
            <Stat label="Ingreso" value={money(billiard.data.revenueCents)} />
          </div>
          {billiard.data.byTable.length > 0 && (
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              {billiard.data.byTable.map((t) => (
                <div key={t.tableId} className="flex justify-between">
                  <span>{t.tableName}</span>
                  <span>
                    {t.sessionCount} sesiones · {money(t.revenueCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-900 p-3 text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
