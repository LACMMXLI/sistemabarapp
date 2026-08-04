import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { AppHeader } from "../components/AppHeader";
import { OfflineBanner } from "../components/OfflineBanner";

export function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden">
      {isHome && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/brand/fondo.png)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
      )}
      <OfflineBanner />
      <AppHeader />
      <main
        className={`app-main relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${isHome ? "" : "bg-background"}`}
      >
        <Outlet />
      </main>
      <Sidebar />
    </div>
  );
}
