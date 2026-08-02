import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";

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

export function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const online = useOnlineStatus();

  return (
    <header className="flex items-center justify-end gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2">
      <span className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
        <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`} />
        {online ? "En línea" : "Sin conexión"}
      </span>
      {user && (
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          {user.fullName} · {user.role}
        </span>
      )}
    </header>
  );
}
