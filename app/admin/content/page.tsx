import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ContentEditor } from "@/components/admin/content-editor";
import { getSiteContent } from "@/lib/admin/content";
import { canEditSettings, getAdminUser } from "@/lib/admin/auth";

export const metadata = { title: "Website content" };

export default async function ContentPage() {
  const user = await getAdminUser();
  // Owner-only, matching the sidebar. Never rely on hiding a link alone.
  if (!user || !canEditSettings(user.role)) notFound();

  const content = await getSiteContent();

  return (
    <>
      <PageHeader
        title="Website content"
        description="Edit the copy shown on the public website."
      />
      <ContentEditor content={content} />
    </>
  );
}
