"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brush,
  CalendarDays,
  Home,
  Images,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", short: "Home", icon: Home },
  { href: "/services", label: "Services", short: "Services", icon: Brush },
  { href: "/gallery", label: "Gallery", short: "Gallery", icon: Images },
  { href: "/about", label: "About", short: "About", icon: User },
  { href: "/book", label: "Book Appointment", short: "Book", icon: CalendarDays },
  { href: "/contact", label: "Contact", short: "Contact", icon: Phone },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Main navigation"
        className={cn(
          "rounded-full border border-line bg-white/95 px-2.5 py-1.5 backdrop-blur-sm transition-shadow duration-500",
          scrolled ? "shadow-lift" : "shadow-soft"
        )}
      >
        <ul className="flex items-center gap-0.5 sm:gap-2">
          {links.map(({ href, label, short, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "group relative flex size-11 items-center justify-center rounded-full transition-colors duration-300",
                    active ? "text-royal" : "text-navy/70 hover:bg-paper hover:text-navy"
                  )}
                >
                  <Icon
                    className="size-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  {/* Hover / focus label — floats beneath the rail */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.2em] text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    {short}
                  </span>
                  {/* Active marker */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-royal transition-opacity duration-300",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
