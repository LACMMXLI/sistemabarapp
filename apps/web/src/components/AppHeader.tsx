import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
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
    <div ref={containerRef} className="relative w-full max-w-[430px]">
      <div className="header-search-control flex h-14 items-center gap-md rounded-xl border border-border bg-surface px-lg">
        <Search className="h-5 w-5 shrink-0 text-textMuted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar productos, mesas, clientes…"
          className="w-full min-w-0 bg-transparent text-base text-text placeholder:text-textMuted outline-none"
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

export function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const online = useOnlineStatus();

  return (
    <header className="app-header flex min-h-24 items-center gap-md border-b border-border bg-background px-lg md:px-xl">
      <div className="hidden flex-1 md:block">
        <HeaderSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="flex items-center gap-sm rounded-xl border border-border bg-surface px-lg py-md text-sm font-medium text-text">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-error"}`} />
          <span className="hidden sm:inline">{online ? "En línea" : "Sin conexión"}</span>
        </span>
        {user && (
          <span className="hidden rounded-xl border border-border bg-surface px-xl py-md text-sm font-medium text-text sm:inline">
            {user.fullName} · {user.role}
          </span>
        )}
      </div>
    </header>
  );
}
