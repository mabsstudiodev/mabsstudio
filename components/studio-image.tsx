import Image, { type ImageProps } from "next/image";

/**
 * Shared image wrapper. Renders immediately — a JS-gated fade-in used to
 * live here, but load-event timing left images stuck invisible on some
 * devices, so photographs now simply appear as the browser paints them.
 */
export function StudioImage(props: ImageProps) {
  return <Image {...props} />;
}
