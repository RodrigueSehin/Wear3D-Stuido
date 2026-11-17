import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import base from "../../eslint.config.mjs";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  // Next d'abord : la base typescript-eslint doit garder la main sur le parser.
  ...compat.extends("next/core-web-vitals"),
  ...base,
  { ignores: [".next/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
];

export default config;
