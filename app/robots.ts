import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The admin area and auth screens must never be indexed.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/sign-in", "/sign-up"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
