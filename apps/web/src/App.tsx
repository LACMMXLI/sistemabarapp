import { Routes, Route } from "react-router-dom";
import { useAuthBootstrap } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./routes/AppLayout";
import { LoginPage } from "./routes/LoginPage";
import { HomePage } from "./routes/HomePage";
import { TablesPage } from "./routes/TablesPage";
import { OrderPage } from "./routes/OrderPage";
import { QuickSalePage } from "./routes/QuickSalePage";
import { InventoryPage } from "./routes/InventoryPage";
import { ProductsPage } from "./routes/admin/ProductsPage";
import { CategoriesPage } from "./routes/admin/CategoriesPage";
import { PromotionsPage } from "./routes/admin/PromotionsPage";
import { UsersPage } from "./routes/admin/UsersPage";
import { SettingsPage } from "./routes/admin/SettingsPage";
import { CashPage } from "./routes/CashPage";
import { ReportsPage } from "./routes/ReportsPage";
import { AuditPage } from "./routes/AuditPage";

export function App() {
  const ready = useAuthBootstrap();
  if (!ready) {
    return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Cargando…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/venta-rapida" element={<QuickSalePage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/mesas" element={<TablesPage />} />
          <Route element={<ProtectedRoute permission="BILLIARD_OPERATE" />}>
            <Route path="/billar" element={<TablesPage typeFilter="BILLIARD" />} />
          </Route>
          <Route path="/ordenes/:orderId" element={<OrderPage />} />
          <Route element={<ProtectedRoute permission="INVENTORY_VIEW_FULL" />}>
            <Route path="/inventario" element={<InventoryPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="PRODUCTS_MANAGE" />}>
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/categorias" element={<CategoriesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="PROMOTIONS_MANAGE" />}>
            <Route path="/promociones" element={<PromotionsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="USERS_MANAGE" />}>
            <Route path="/usuarios" element={<UsersPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="SETTINGS_MANAGE" />}>
            <Route path="/configuracion" element={<SettingsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="CASH_VIEW_SHIFTS" />}>
            <Route path="/caja" element={<CashPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="REPORTS_VIEW" />}>
            <Route path="/reportes" element={<ReportsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="AUDIT_VIEW" />}>
            <Route path="/auditoria" element={<AuditPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
