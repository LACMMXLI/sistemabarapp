import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  error?: string | null;
  pending?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

/** Diálogo de confirmación genérico; sustituye a window.confirm/window.prompt. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive,
  requireReason,
  reasonLabel = "Motivo",
  error,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const canConfirm = !requireReason || reason.trim().length > 0;

  return (
    <div className="pos-modal-backdrop" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="pos-modal max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          {destructive && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-900/50 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 id="confirm-dialog-title" className="text-base font-bold text-white">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
        </div>

        {requireReason && (
          <div className="mb-3">
            <label htmlFor="confirm-reason" className="mb-1 block text-sm text-slate-300">
              {reasonLabel}
            </label>
            <textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              autoFocus
              className="w-full touch-target rounded-md bg-slate-800 px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="sticky bottom-0 flex gap-2 bg-pos-surface pt-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="touch-target flex-1 rounded-md bg-slate-800 text-sm font-medium text-slate-300 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
            disabled={pending || !canConfirm}
            className={`touch-target flex-1 rounded-md text-sm font-semibold text-white disabled:opacity-50 ${
              destructive ? "bg-red-700 hover:bg-red-600" : "bg-sky-600 hover:bg-sky-500"
            }`}
          >
            {pending ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
