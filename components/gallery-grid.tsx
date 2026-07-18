"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { galleryFilters, galleryItems, type GalleryCategory } from "@/lib/gallery";
import { StudioImage } from "@/components/studio-image";

const EASE = [0.22, 1, 0.36, 1] as const;

export function GalleryGrid() {
  const [filter, setFilter] = React.useState<GalleryCategory | "all">("all");
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const lastTriggerRef = React.useRef<HTMLElement | null>(null);

  const items = React.useMemo(
    () => (filter === "all" ? galleryItems : galleryItems.filter((i) => i.category === filter)),
    [filter]
  );

  const open = activeIndex !== null;
  const active = open ? items[activeIndex] : null;

  const close = React.useCallback(() => {
    setActiveIndex(null);
    lastTriggerRef.current?.focus();
  }, []);

  const step = React.useCallback(
    (dir: 1 | -1) => {
      setActiveIndex((i) => (i === null ? i : (i + dir + items.length) % items.length));
    },
    [items.length]
  );

  // Keyboard navigation + scroll lock while the lightbox is open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  return (
    <div>
      <div
        className="flex flex-wrap items-center justify-center gap-3"
        role="group"
        aria-label="Filter gallery by category"
      >
        {galleryFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => {
              setFilter(f.value);
              setActiveIndex(null);
            }}
            className={cn(
              "h-10 rounded-xl border px-5 text-sm tracking-wide transition-colors duration-300",
              filter === f.value
                ? "border-navy bg-navy text-white"
                : "border-line bg-white text-ink hover:border-navy/40"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <motion.ul layout className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>li]:mb-6">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.li
              key={item.src}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="break-inside-avoid"
            >
              <button
                type="button"
                onClick={(e) => {
                  lastTriggerRef.current = e.currentTarget;
                  setActiveIndex(i);
                }}
                aria-label={`View larger: ${item.alt}`}
                className="group block w-full overflow-hidden rounded-3xl border border-line bg-paper shadow-soft transition-shadow duration-500 hover:shadow-lift"
              >
                <StudioImage
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <AnimatePresence>
        {open && active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={active.alt}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/90 p-4 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={close}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label="Close lightbox"
              className="absolute right-5 top-5 inline-flex size-11 items-center justify-center rounded-xl bg-white/10 text-white transition-colors duration-300 hover:bg-white hover:text-navy"
            >
              <X className="size-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white transition-colors duration-300 hover:bg-white hover:text-navy md:inline-flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next image"
              className="absolute right-4 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white transition-colors duration-300 hover:bg-white hover:text-navy md:inline-flex"
            >
              <ChevronRight className="size-5" />
            </button>

            <motion.figure
              key={active.src}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <StudioImage
                src={active.src}
                alt={active.alt}
                width={active.width}
                height={active.height}
                sizes="90vw"
                className="max-h-[80vh] w-auto rounded-3xl object-contain"
                priority
              />
              <figcaption className="mt-4 text-center text-sm text-white/80">
                {active.alt}
                <span className="mx-3 text-white/40" aria-hidden="true">
                  ·
                </span>
                {activeIndex! + 1} / {items.length}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
