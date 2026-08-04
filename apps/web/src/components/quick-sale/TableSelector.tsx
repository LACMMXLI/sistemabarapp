import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DiningTable } from "@barapp/contracts";

export function TableSelector({
  tables,
  value,
  onChange,
  disabled,
}: {
  tables: DiningTable[];
  value: string | null;
  onChange: (tableId: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = tables.find((t) => t.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [open]);

  const selectableTables = tables.filter((t) => !t.outOfService);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-posSm border border-pos-borderSoft bg-pos-surfaceElevated px-2.5 text-xs font-medium text-pos-textPrimary transition hover:border-pos-cyan/40 disabled:opacity-50"
      >
        <span className="text-pos-textMuted">Mesa</span>
        <span className={selected ? "text-pos-cyan" : "text-pos-textSecondary"}>{selected ? selected.name : "Venta directa"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-pos-textMuted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-posMd border border-pos-border bg-pos-surfaceElevated p-1.5 shadow-posPanel">
          <TableOption label="Venta directa" active={value === null} onClick={() => { onChange(null); setOpen(false); }} />
          {selectableTables.map((t) => (
            <TableOption
              key={t.id}
              label={t.name}
              subtitle={t.status === "OCCUPIED" ? "Ocupada" : t.status === "BILLIARD_ACTIVE" ? "Billar activo" : undefined}
              active={value === t.id}
              onClick={() => { onChange(t.id); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TableOption({
  label,
  subtitle,
  active,
  onClick,
}: {
  label: string;
  subtitle?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-posSm px-3 py-2.5 text-left text-sm font-medium transition ${
        active ? "bg-pos-cyan/15 text-pos-cyan" : "text-pos-textSecondary hover:bg-white/5"
      }`}
    >
      <span>{label}</span>
      {subtitle && <span className="text-[10px] font-normal text-pos-textMuted">{subtitle}</span>}
    </button>
  );
}
