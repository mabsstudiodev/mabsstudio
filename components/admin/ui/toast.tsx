"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}

const DURATION_MS = 5000;

const ICONS: Record<ToastTone, React.ElementType> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ICON_TONES: Record<ToastTone, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-royal",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...input, id }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss]
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ tone: "success", title, description }),
      error: (title, description) => toast({ tone: "error", title, description }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Announced politely so a screen reader hears the result of an action. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon = ICONS[item.tone];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-admin border border-admin-border bg-admin-surface p-3.5 shadow-admin-raised"
              >
                <Icon
                  aria-hidden="true"
                  className={cn("mt-0.5 size-4 shrink-0", ICON_TONES[item.tone])}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-sm leading-snug text-muted">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="-m-1 rounded p-1 text-muted transition-colors hover:bg-paper hover:text-navy"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
