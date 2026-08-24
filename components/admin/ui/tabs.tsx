"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TabDefinition = {
  id: string;
  label: string;
  icon?: React.ElementType;
};

/**
 * Accessible tab list — arrow keys move between tabs, Home/End jump to the
 * ends, and only the selected tab is in the tab order.
 */
export function Tabs({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: TabDefinition[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const refs = React.useRef(new Map<string, HTMLButtonElement>());

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = tabs.findIndex((tab) => tab.id === active);
    let next = index;

    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;

    event.preventDefault();
    const target = tabs[next];
    onChange(target.id);
    refs.current.get(target.id)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1 pb-1"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) refs.current.set(tab.id, node);
              else refs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={onKeyDown}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-admin border px-3 text-sm font-medium transition-colors",
              selected
                ? "border-navy bg-navy text-white"
                : "border-admin-border bg-admin-surface text-navy hover:bg-paper"
            )}
          >
            {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: string;
  children: React.ReactNode;
}) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0}>
      {children}
    </div>
  );
}
