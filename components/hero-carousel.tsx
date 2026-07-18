"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const AUTOPLAY_MS = 4500;

export type HeroSlide = {
  src: string;
  alt: string;
  label: string;
};

/**
 * Fanned deck of slides — the active image sits upright in front while the
 * next slides peek out behind it, rotated like a hand of cards. Auto-advances,
 * supports swipe, and exposes dot navigation.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  // Only the front card renders on first paint; the rest of the deck mounts
  // once the browser is idle so its images don't compete with initial load.
  const [deckReady, setDeckReady] = React.useState(false);
  const count = slides.length;

  React.useEffect(() => {
    const start = () => setDeckReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 1200);
    return () => window.clearTimeout(id);
  }, []);

  const next = React.useCallback(() => setActive((a) => (a + 1) % count), [count]);
  const prev = React.useCallback(() => setActive((a) => (a - 1 + count) % count), [count]);

  React.useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [next, reduce, paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Recent work from Mabs Studio"
        className="relative mx-auto w-full max-w-[24rem] lg:max-w-[28rem]"
      >
        {/* Horizontal margins reserve room for the cards peeking out on each side. */}
        <div className="relative mx-10 aspect-[9/10] sm:mx-12">
        {slides.map((slide, i) => {
          // Position in the deck: 0 = front card; 1 peeks right, 2 peeks left.
          const pos = (i - active + count) % count;
          const visible = pos < 3;
          const side = pos === 0 ? 0 : pos === 1 ? 1 : -1;
          if (pos !== 0 && !deckReady) return null;
          return (
            <motion.figure
              key={slide.src}
              aria-hidden={pos !== 0}
              className="absolute inset-0"
              style={{ zIndex: count - pos }}
              initial={false}
              animate={{
                rotate: reduce ? 0 : side * 5,
                x: reduce ? 0 : side * 18,
                scale: 1 - pos * 0.05,
                opacity: visible ? 1 : 0,
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 320,
                      damping: 32,
                      opacity: { duration: 0.35, ease: EASE },
                    }
              }
              drag={pos === 0 && !reduce ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                // A committed drag or a quick flick advances; direction decides which way.
                if (info.offset.x < -60 || info.velocity.x < -500) next();
                else if (info.offset.x > 60 || info.velocity.x > 500) prev();
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-line bg-paper shadow-lift">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 640px) 90vw, 448px"
                  className="pointer-events-none object-cover"
                />
                <span
                  className={cn(
                    "absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-navy backdrop-blur transition-opacity duration-500",
                    pos === 0 ? "opacity-100" : "opacity-0"
                  )}
                >
                  {slide.label}
                </span>
              </div>
            </motion.figure>
          );
        })}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2.5" role="tablist" aria-label="Choose slide">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Show slide ${i + 1}: ${slide.label}`}
            onClick={() => setActive(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              i === active ? "w-7 bg-navy" : "w-2 bg-navy/25 hover:bg-navy/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
