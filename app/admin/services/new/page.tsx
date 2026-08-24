import { PageHeader } from "@/components/admin/page-header";
import { ServiceEditor } from "@/components/admin/service-editor";
import { getServices } from "@/lib/admin/services";

export const metadata = { title: "New service" };

export default async function NewServicePage() {
  // Places the new service at the end of the current running order.
  const services = await getServices();

  return (
    <>
      <PageHeader
        title="Add service"
        description="Create a treatment for the services page and homepage grid."
      />
      <ServiceEditor nextSortOrder={services.length} />
    </>
  );
}
