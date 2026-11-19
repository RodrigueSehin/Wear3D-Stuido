/**
 * Polices du studio (sous-ensemble du catalogue de 30 polices, CDC F-21).
 * Les familles CSS générées par next/font sont transmises au compositeur Canvas.
 */
import {
  Anton,
  Archivo_Black,
  Barlow_Condensed,
  Bebas_Neue,
  Montserrat,
  Oswald,
  Pacifico,
  Russo_One,
  Staatliches,
  Teko,
  Alfa_Slab_One,
  Black_Ops_One,
  Bangers,
  Fjalla_One,
  Passion_One,
  Racing_Sans_One,
  Squada_One,
  Saira_Condensed,
  Rajdhani,
  Orbitron,
  Audiowide,
  Permanent_Marker,
  Lobster,
  Righteous,
  Bungee,
  Fugaz_One,
  Chakra_Petch,
  Playfair_Display,
  Roboto_Slab,
  Kanit,
} from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400", display: "block" });
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"], display: "block" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "block" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "800"], display: "block" });

const teko = Teko({ subsets: ["latin"], weight: ["500", "700"], display: "block" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], display: "block" });
const archivo = Archivo_Black({ subsets: ["latin"], weight: "400", display: "block" });
const staatliches = Staatliches({ subsets: ["latin"], weight: "400", display: "block" });
const russo = Russo_One({ subsets: ["latin"], weight: "400", display: "block" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", display: "block" });
const alfa = Alfa_Slab_One({ subsets: ["latin"], weight: "400", display: "block" });
const blackops = Black_Ops_One({ subsets: ["latin"], weight: "400", display: "block" });
const bangers = Bangers({ subsets: ["latin"], weight: "400", display: "block" });
const fjalla = Fjalla_One({ subsets: ["latin"], weight: "400", display: "block" });
const passion = Passion_One({ subsets: ["latin"], weight: "700", display: "block" });
const racing = Racing_Sans_One({ subsets: ["latin"], weight: "400", display: "block" });
const squada = Squada_One({ subsets: ["latin"], weight: "400", display: "block" });
const saira = Saira_Condensed({ subsets: ["latin"], weight: "700", display: "block" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: "700", display: "block" });
const orbitron = Orbitron({ subsets: ["latin"], weight: "700", display: "block" });
const audiowide = Audiowide({ subsets: ["latin"], weight: "400", display: "block" });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400", display: "block" });
const lobster = Lobster({ subsets: ["latin"], weight: "400", display: "block" });
const righteous = Righteous({ subsets: ["latin"], weight: "400", display: "block" });
const bungee = Bungee({ subsets: ["latin"], weight: "400", display: "block" });
const fugaz = Fugaz_One({ subsets: ["latin"], weight: "400", display: "block" });
const chakra = Chakra_Petch({ subsets: ["latin"], weight: "700", display: "block" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: "700", display: "block" });
const robotoslab = Roboto_Slab({ subsets: ["latin"], weight: "700", display: "block" });
const kanit = Kanit({ subsets: ["latin"], weight: "700", display: "block" });

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
  teko: { label: "Teko", family: teko.style.fontFamily, className: teko.className, weight: 700 },
  barlow: {
    label: "Barlow Condensed",
    family: barlow.style.fontFamily,
    className: barlow.className,
    weight: 700,
  },
  archivo: {
    label: "Archivo Black",
    family: archivo.style.fontFamily,
    className: archivo.className,
    weight: 400,
  },
  staatliches: {
    label: "Staatliches",
    family: staatliches.style.fontFamily,
    className: staatliches.className,
    weight: 400,
  },
  russo: {
    label: "Russo One",
    family: russo.style.fontFamily,
    className: russo.className,
    weight: 400,
  },
  pacifico: {
    label: "Pacifico",
    family: pacifico.style.fontFamily,
    className: pacifico.className,
    weight: 400,
  },
  alfa: {
    label: "Alfa Slab",
    family: alfa.style.fontFamily,
    className: alfa.className,
    weight: 400,
  },
  blackops: {
    label: "Black Ops",
    family: blackops.style.fontFamily,
    className: blackops.className,
    weight: 400,
  },
  bangers: {
    label: "Bangers",
    family: bangers.style.fontFamily,
    className: bangers.className,
    weight: 400,
  },
  fjalla: {
    label: "Fjalla One",
    family: fjalla.style.fontFamily,
    className: fjalla.className,
    weight: 400,
  },
  passion: {
    label: "Passion One",
    family: passion.style.fontFamily,
    className: passion.className,
    weight: 700,
  },
  racing: {
    label: "Racing Sans",
    family: racing.style.fontFamily,
    className: racing.className,
    weight: 400,
  },
  squada: {
    label: "Squada One",
    family: squada.style.fontFamily,
    className: squada.className,
    weight: 400,
  },
  saira: {
    label: "Saira Condensed",
    family: saira.style.fontFamily,
    className: saira.className,
    weight: 700,
  },
  rajdhani: {
    label: "Rajdhani",
    family: rajdhani.style.fontFamily,
    className: rajdhani.className,
    weight: 700,
  },
  orbitron: {
    label: "Orbitron",
    family: orbitron.style.fontFamily,
    className: orbitron.className,
    weight: 700,
  },
  audiowide: {
    label: "Audiowide",
    family: audiowide.style.fontFamily,
    className: audiowide.className,
    weight: 400,
  },
  marker: {
    label: "Permanent Marker",
    family: marker.style.fontFamily,
    className: marker.className,
    weight: 400,
  },
  lobster: {
    label: "Lobster",
    family: lobster.style.fontFamily,
    className: lobster.className,
    weight: 400,
  },
  righteous: {
    label: "Righteous",
    family: righteous.style.fontFamily,
    className: righteous.className,
    weight: 400,
  },
  bungee: {
    label: "Bungee",
    family: bungee.style.fontFamily,
    className: bungee.className,
    weight: 400,
  },
  fugaz: {
    label: "Fugaz One",
    family: fugaz.style.fontFamily,
    className: fugaz.className,
    weight: 400,
  },
  chakra: {
    label: "Chakra Petch",
    family: chakra.style.fontFamily,
    className: chakra.className,
    weight: 700,
  },
  playfair: {
    label: "Playfair Display",
    family: playfair.style.fontFamily,
    className: playfair.className,
    weight: 700,
  },
  robotoslab: {
    label: "Roboto Slab",
    family: robotoslab.style.fontFamily,
    className: robotoslab.className,
    weight: 700,
  },
  kanit: {
    label: "Kanit",
    family: kanit.style.fontFamily,
    className: kanit.className,
    weight: 700,
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
