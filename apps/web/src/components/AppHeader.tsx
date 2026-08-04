import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Maximize2, Minimize2 } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { NAV_ICONS } from "../lib/navIcons";

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function useFullscreen() {
  const [supported] = useState(() => typeof document !== "undefined" && !!document.documentElement.requestFullscreen);
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return { supported, isFullscreen, toggle };
}

export function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const online = useOnlineStatus();
  const fullscreen = useFullscreen();
  const HomeIcon = NAV_ICONS.home;

  return (
    <header className="app-header relative z-10 flex min-h-24 items-center gap-md border-b border-white/10 bg-gradient-to-b from-white/15 via-white/5 to-transparent px-lg backdrop-blur-md md:px-xl">
      <NavLink
        to="/"
        end
        aria-label="Inicio"
        title="Inicio"
        className={({ isActive }) =>
          `touch-target flex items-center justify-center rounded-xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
            isActive ? "border-primary bg-primary text-black" : "border-white/15 bg-white/10 text-white hover:bg-white/20"
          }`
        }
      >
        <HomeIcon className="h-6 w-6" strokeWidth={1.8} />
      </NavLink>

      <div className="ml-auto flex items-center gap-2">
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            aria-label={fullscreen.isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            title={fullscreen.isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            className="touch-target flex items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {fullscreen.isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        )}
        <span className="flex items-center gap-sm rounded-xl border border-white/15 bg-white/10 px-lg py-md text-sm font-medium text-white">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-error"}`} />
          <span className="hidden sm:inline">{online ? "En línea" : "Sin conexión"}</span>
        </span>
        {user && (
          <span className="hidden rounded-xl border border-white/15 bg-white/10 px-xl py-md text-sm font-medium text-white sm:inline">
            {user.fullName} · {user.role}
          </span>
        )}
      </div>
    </header>
  );
}
