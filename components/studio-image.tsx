"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/** next/image wrapper that fades the photograph in once it has loaded. */
export function StudioImage({ className, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <Image
      alt={alt}
      className={cn(
        "transition-opacity duration-700 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
}
