/**
 * Polices du studio (sous-ensemble du catalogue de 30 polices, CDC F-21).
 * Les familles CSS générées par next/font sont transmises au compositeur Canvas.
 */
import { Anton, Bebas_Neue, Montserrat, Oswald } from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400", display: "block" });
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"], display: "block" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "block" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "800"], display: "block" });

export const STUDIO_FONTS = {
  anton: {
    label: "Anton",
    family: anton.style.fontFamily,
    className: anton.className,
    weight: 400,
  },
  oswald: {
    label: "Oswald",
    family: oswald.style.fontFamily,
    className: oswald.className,
    weight: 700,
  },
  bebas: {
    label: "Bebas Neue",
    family: bebas.style.fontFamily,
    className: bebas.className,
    weight: 400,
  },
  montserrat: {
    label: "Montserrat",
    family: montserrat.style.fontFamily,
    className: montserrat.className,
    weight: 800,
  },
} as const;

export type StudioFontKey = keyof typeof STUDIO_FONTS;

/** Styles de numérotation sportive (CDC F-22). */
export const NUMBER_STYLES = {
  "block-classic": { label: "Bloc classique", font: "anton" },
  college: { label: "Collège", font: "oswald" },
  modern: { label: "Moderne", font: "bebas" },
} as const satisfies Record<string, { label: string; font: StudioFontKey }>;

export function resolveFont(key: string): string {
  return (STUDIO_FONTS[key as StudioFontKey] ?? STUDIO_FONTS.anton).family;
}

export function resolveNumberFont(style: string): string {
  const s = NUMBER_STYLES[style as keyof typeof NUMBER_STYLES] ?? NUMBER_STYLES["block-classic"];
  return STUDIO_FONTS[s.font].family;
}

/** Attend le chargement effectif des polices avant de composer l'atlas. */
export async function loadStudioFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(
    Object.values(STUDIO_FONTS).map((f) =>
      document.fonts.load(`${f.weight} 64px ${f.family}`).catch(() => []),
    ),
  );
}
