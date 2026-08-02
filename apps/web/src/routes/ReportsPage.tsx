import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSalesReport, fetchProductsReport, fetchBilliardReport } from "../lib/reportsApi";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ReportsPage() {
  const [preset, setPreset] = useState<"TODAY" | "YESTERDAY">("TODAY");
  const { data: sales } = useQuery({ queryKey: ["report-sales", preset], queryFn: () => fetchSalesReport(preset) });
  const { data: products } = useQuery({ queryKey: ["report-products", preset], queryFn: () => fetchProductsReport(preset) });
  const { data: billiard } = useQuery({ queryKey: ["report-billiard", preset], queryFn: () => fetchBilliardReport(preset) });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Reportes</h1>
        <div className="flex gap-2">
          <button onClick={() => setPreset("TODAY")} className={`touch-target rounded-md px-3 text-sm ${preset === "TODAY" ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"}`}>
            Hoy
          </button>
          <button onClick={() => setPreset("YESTERDAY")} className={`touch-target rounded-md px-3 text-sm ${preset === "YESTERDAY" ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"}`}>
            Ayer
          </button>
        </div>
      </div>

      {sales && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-slate-200">Ventas</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total" value={money(sales.totalSalesCents)} />
            <Stat label="Órdenes" value={String(sales.orderCount)} />
            <Stat label="Ticket promedio" value={money(sales.averageTicketCents)} />
          </div>
          <div className="mt-3 text-sm text-slate-300">
            {sales.byPaymentMethod.map((m) => (
              <div key={m.method} className="flex justify-between">
                <span>{m.method}</span>
                <span>{money(m.totalCents)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {products && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-slate-200">Productos más vendidos</h2>
          <table className="w-full text-sm text-slate-300">
            <tbody>
              {products.topProducts.map((p) => (
                <tr key={p.productId}>
                  <td>{p.productName}</td>
                  <td className="text-right">{p.quantitySold}</td>
                  <td className="text-right">{money(p.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {billiard && (
        <section>
          <h2 className="mb-2 font-semibold text-slate-200">Billar</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Sesiones" value={String(billiard.sessionCount)} />
            <Stat label="Canceladas" value={String(billiard.cancelledCount)} />
            <Stat label="Ingreso" value={money(billiard.revenueCents)} />
          </div>
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
