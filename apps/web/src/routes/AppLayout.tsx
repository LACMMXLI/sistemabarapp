import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { AppHeader } from "../components/AppHeader";
import { OfflineBanner } from "../components/OfflineBanner";

export function AppLayout() {
  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden">
      <OfflineBanner />
      <AppHeader />
      <main className="app-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#020812]">
        <Outlet />
      </main>
      <Sidebar />
    </div>
  );
}
