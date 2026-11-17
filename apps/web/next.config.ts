import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Les packages internes sont consommés en TypeScript source.
  transpilePackages: [
    "@wear3d/ui",
    "@wear3d/billing",
    "@wear3d/db",
    "@wear3d/design-schema",
    "@wear3d/garment-engine",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default withNextIntl(nextConfig);
