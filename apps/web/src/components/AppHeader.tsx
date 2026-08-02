import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { fetchProducts } from "../lib/catalogApi";
import { fetchTables } from "../lib/tablesApi";

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

function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const { data: tables } = useQuery({ queryKey: ["tables"], queryFn: fetchTables });

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const term = query.trim().toLowerCase();
  const matchedProducts = term ? (products ?? []).filter((p) => p.name.toLowerCase().includes(term)).slice(0, 5) : [];
  const matchedTables = term ? (tables ?? []).filter((t) => t.name.toLowerCase().includes(term)).slice(0, 5) : [];
  const hasResults = matchedProducts.length > 0 || matchedTables.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar productos, mesas…"
          className="w-full min-w-0 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
        />
      </div>
      {open && term && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg bg-slate-800 shadow-xl">
          {!hasResults && <p className="px-3 py-2 text-sm text-slate-400">Sin resultados para "{query}".</p>}
          {matchedTables.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setOpen(false);
                setQuery("");
                navigate("/mesas");
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
            >
              <span>🍽️ {t.name}</span>
              <span className="text-xs text-slate-500">Mesa</span>
            </button>
          ))}
          {matchedProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setOpen(false);
                setQuery("");
                navigate(`/venta-rapida?q=${encodeURIComponent(p.name)}`);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
            >
              <span>🛒 {p.name}</span>
              <span className="text-xs text-slate-500">${(p.priceCents / 100).toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const user = useAuthStore((s) => s.user);
  const online = useOnlineStatus();

  return (
    <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 px-3 py-2 md:px-4">
      <button
        onClick={onOpenMenu}
        className="touch-target flex items-center justify-center rounded-md text-slate-300 hover:text-white md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="hidden flex-1 md:block">
        <HeaderSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className="hidden sm:inline">{online ? "En línea" : "Sin conexión"}</span>
        </span>
        {user && (
          <span className="hidden rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 sm:inline">
            {user.fullName} · {user.role}
          </span>
        )}
      </div>
    </header>
  );
}
