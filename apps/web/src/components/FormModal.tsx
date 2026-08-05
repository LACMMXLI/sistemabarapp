import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function FormModal({
  title,
  children,
  footer,
  onClose,
  width = "max-w-lg",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-posLg border border-border bg-pos-surface shadow-posXl ${width}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="touch-target flex w-11 items-center justify-center rounded-pos text-textMuted hover:bg-white/5 hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex shrink-0 gap-2 border-t border-border bg-pos-bg/60 p-3">{footer}</div>}
      </div>
    </div>
  );
}
