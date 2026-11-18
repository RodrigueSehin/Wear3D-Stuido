import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { resolve } from "node:path";

// Le .env unique vit à la racine du monorepo (apps/web est le cwd de Next).
loadEnvConfig(resolve(process.cwd(), "../.."));

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
