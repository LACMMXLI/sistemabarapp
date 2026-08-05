import { Outlet } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { OfflineBanner } from "../components/OfflineBanner";

export function AppLayout() {
  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden">
      <OfflineBanner />
      <AppHeader />
      <main className="app-main relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
