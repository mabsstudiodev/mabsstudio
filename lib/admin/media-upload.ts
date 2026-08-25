import { getMediaUploadUrl, resolveMediaUrl } from "./actions";

/**
 * Browser-side upload for admin media that is stored as a URL string
 * (service photos and clips).
 *
 * The file goes straight from the browser to Convex Storage, so the bytes
 * never pass through the Next.js server or hit the Server Action body limit.
 * Only the storage id round-trips back to be exchanged for a durable URL.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Returns a human-readable reason the file can't be used, or null. */
export function validateMedia(file: File, kind: "image" | "video"): string | null {
  if (kind === "image") {
    if (!file.type.startsWith("image/")) return "Choose an image file.";
    if (file.size > MAX_IMAGE_BYTES) return "Images must be under 8MB.";
  } else {
    if (!file.type.startsWith("video/")) return "Choose a video file.";
    if (file.size > MAX_VIDEO_BYTES) return "Videos must be under 50MB.";
  }
  return null;
}

export async function uploadMedia(file: File): Promise<string> {
  const uploadUrl = await getMediaUploadUrl();

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Upload failed. Check your connection and try again.");
  }

  const { storageId } = (await response.json()) as { storageId: string };
  return resolveMediaUrl(storageId);
}
