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
    <div className="pos-modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`pos-modal ${width}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pos-modal-header">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="touch-target flex w-11 items-center justify-center rounded-pos text-textMuted hover:bg-white/5 hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="pos-modal-body">{children}</div>
        {footer && <div className="pos-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
