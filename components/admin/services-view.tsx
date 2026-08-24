"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Eye, EyeOff, Pencil, Scissors, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { ActiveBadge, Badge } from "./ui/badge";
import { ActionMenu } from "./ui/action-menu";
import { ConfirmDialog } from "./ui/dialog";
import { EmptyState } from "./ui/states";
import { useToast } from "./ui/toast";
import { deleteService, duplicateService, toggleServiceActive } from "@/lib/admin/actions";
import { CATEGORY_LABELS, formatPrice } from "@/lib/admin/catalog";
import { toUserMessage } from "@/lib/admin/data-source";
import type { AdminService } from "@/types/admin";

/**
 * Service list.
 *
 * TODO: Under Convex, replace the `services` prop with
 * `useQuery(api.services.list)` and drop the optimistic local copy below.
 */
export function ServicesView({ services }: { services: AdminService[] }) {
  const toast = useToast();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<AdminService | null>(null);

  async function handleToggle(service: AdminService) {
    setPendingId(service.id);
    try {
      await toggleServiceActive(service.id, !service.active);
      toast.success(service.active ? "Service disabled." : "Service enabled.");
    } catch (error) {
      toast.error(
        "Status not changed",
        toUserMessage(error, "We couldn't change this service. Please try again.")
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleDuplicate(service: AdminService) {
    setPendingId(service.id);
    try {
      await duplicateService(service.id);
      toast.success("Service duplicated.");
    } catch (error) {
      toast.error(
        "Service not duplicated",
        toUserMessage(error, "We couldn't duplicate this service. Please try again.")
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteService(toDelete.id);
      toast.success("Service deleted.");
      setToDelete(null);
    } catch (error) {
      toast.error(
        "Service not deleted",
        toUserMessage(error, "We couldn't delete this service. Please try again.")
      );
    }
  }

  if (services.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Scissors}
          title="No services found."
          description="Add the treatments the studio offers so they appear on the public website."
          action={{ label: "Add service", href: "/admin/services/new" }}
        />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <ul className="divide-y divide-admin-border">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-paper/60"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-admin border border-admin-border bg-paper">
                <Image
                  src={service.image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/services/${service.id}`}
                    className="text-sm font-medium text-navy hover:underline"
                  >
                    {service.title}
                  </Link>
                  <ActiveBadge active={service.active} />
                  {service.featured ? <Badge tone="accent">Featured</Badge> : null}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted">
                  {service.description}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {CATEGORY_LABELS[service.category]} ·{" "}
                  {formatPrice(service.startingPrice, service.currency)} ·{" "}
                  {service.duration}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-1">
                {pendingId === service.id ? (
                  <span className="px-2 text-xs text-muted" role="status">
                    Working…
                  </span>
                ) : null}
                <ActionMenu
                  label={`Actions for ${service.title}`}
                  items={[
                    {
                      label: "Edit",
                      icon: Pencil,
                      href: `/admin/services/${service.id}`,
                    },
                    {
                      label: "Duplicate",
                      icon: Copy,
                      onSelect: () => handleDuplicate(service),
                      disabled: pendingId !== null,
                    },
                    {
                      label: service.active ? "Disable" : "Enable",
                      icon: service.active ? EyeOff : Eye,
                      onSelect: () => handleToggle(service),
                      disabled: pendingId !== null,
                    },
                    {
                      label: "Delete",
                      icon: Trash2,
                      onSelect: () => setToDelete(service),
                      destructive: true,
                    },
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title={`Delete ${toDelete?.title ?? "this service"}?`}
        description="The service and its settings will be removed permanently and it will disappear from the public website. To hide it temporarily, disable it instead. This action cannot be undone."
        confirmLabel="Delete service"
      />
    </>
  );
}
