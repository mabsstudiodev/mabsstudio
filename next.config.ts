import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local art-direction placeholders are SVG; all first-party.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
