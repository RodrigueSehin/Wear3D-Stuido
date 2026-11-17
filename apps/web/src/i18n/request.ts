import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

/** Langue lue dans le cookie NEXT_LOCALE ; les URL restent sans préfixe (CDC §3.3). */
export default getRequestConfig(async () => {
  const store = await cookies();
  const value = store.get("NEXT_LOCALE")?.value;
  const locale: Locale = LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
