import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ServicesView } from "@/components/admin/services-view";
import { getServices } from "@/lib/admin/services";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <PageHeader
        title="Services"
        description="Manage the treatments shown on the public website."
        actions={
          <Link
            href="/admin/services/new"
            className="inline-flex h-10 items-center gap-2 rounded-admin bg-navy px-4 text-sm font-medium text-white transition-colors hover:bg-royal"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add service
          </Link>
        }
      />
      <ServicesView services={services} />
    </>
  );
}
