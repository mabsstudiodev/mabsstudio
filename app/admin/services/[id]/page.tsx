import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ServiceEditor } from "@/components/admin/service-editor";
import { getServiceById } from "@/lib/admin/services";

export const metadata = { title: "Edit service" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) notFound();

  return (
    <>
      <PageHeader title={service.title} description="Edit this service." />
      <ServiceEditor service={service} />
    </>
  );
}
