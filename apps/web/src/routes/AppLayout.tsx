import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { OfflineBanner } from "../components/OfflineBanner";

export function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
