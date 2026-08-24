import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Gallery media served from Convex Storage.
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        // Admin profile photos from Clerk.
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
    // Local art-direction placeholders are SVG; all first-party.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
