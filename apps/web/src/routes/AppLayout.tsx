import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { OfflineBanner } from "../components/OfflineBanner";

export function AppLayout() {
  const isHome = useLocation().pathname === "/";

  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden">
      <OfflineBanner />
      <AppHeader />
      <main className={`app-main relative z-[1] min-h-0 flex-1 overflow-x-hidden ${isHome ? "overflow-y-auto" : "overflow-hidden p-2 sm:p-4"}`}>
        {isHome ? (
          <Outlet />
        ) : (
          <div className="app-view-shell h-full overflow-y-auto rounded-posLg border border-pos-borderSoft bg-gradient-to-b from-pos-surface/95 via-pos-bg/90 to-pos-bg/95 text-pos-textPrimary shadow-posPanel backdrop-blur-xl">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
