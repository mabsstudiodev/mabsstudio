import { PageHeader } from "@/components/admin/page-header";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { getGalleryItems } from "@/lib/admin/gallery";

export const metadata = { title: "Gallery" };

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ upload?: string }>;
}) {
  const [items, params] = await Promise.all([getGalleryItems(), searchParams]);

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Manage the photos and clips shown on the public gallery."
      />
      {/* The dashboard's "Upload Gallery Image" action links here with ?upload=1. */}
      <GalleryManager items={items} openUploadInitially={params.upload === "1"} />
    </>
  );
}
