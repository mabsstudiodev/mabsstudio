import { createGalleryItem, getGalleryUploadUrl } from "./actions";
import type { AdminGalleryItem, ServiceCategory } from "@/types/admin";

/**
 * Browser-side upload orchestration.
 *
 * The file goes straight from the browser to Convex Storage — it never passes
 * through the Next.js server, which would double the transfer and hit the
 * Server Action body limit on video. Only the resulting storage id comes back
 * through a Server Action to be recorded.
 */

export type GalleryUploadMetadata = {
  alt: string;
  title?: string;
  category: ServiceCategory;
  featured: boolean;
  active: boolean;
  sortOrder: number;
};

/** POSTs one file to a fresh Convex upload URL and returns its storage id. */
async function putFile(file: File): Promise<string> {
  const url = await getGalleryUploadUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Upload failed. Check your connection and try again.");
  }
  const { storageId } = (await response.json()) as { storageId: string };
  return storageId;
}

/** Reads intrinsic dimensions so the gallery can reserve space before load. */
function measure(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");

  return new Promise((resolve) => {
    const done = (width: number, height: number) => {
      URL.revokeObjectURL(url);
      // Fall back to a portrait ratio rather than 0, which would collapse the grid.
      resolve({ width: width || 960, height: height || 1280 });
    };

    if (isVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => done(video.videoWidth, video.videoHeight);
      video.onerror = () => done(0, 0);
      video.src = url;
    } else {
      const image = new Image();
      image.onload = () => done(image.naturalWidth, image.naturalHeight);
      image.onerror = () => done(0, 0);
      image.src = url;
    }
  });
}

export async function uploadGalleryMedia(
  file: File,
  metadata: GalleryUploadMetadata,
  poster?: File
): Promise<AdminGalleryItem> {
  const isVideo = file.type.startsWith("video/");
  if (isVideo && !poster) {
    throw new Error("Videos need a poster image.");
  }

  const [{ width, height }, storageId, posterStorageId] = await Promise.all([
    // A video's own dimensions are the right ones; the poster only supplies
    // the still frame.
    measure(file),
    putFile(file),
    poster ? putFile(poster) : Promise.resolve(undefined),
  ]);

  return createGalleryItem({
    storageId,
    posterStorageId,
    alt: metadata.alt,
    title: metadata.title,
    category: metadata.category,
    type: isVideo ? "video" : "image",
    width,
    height,
    featured: metadata.featured,
    active: metadata.active,
    sortOrder: metadata.sortOrder,
  });
}
