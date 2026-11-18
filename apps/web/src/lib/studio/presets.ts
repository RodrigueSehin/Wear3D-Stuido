/**
 * Modèles de design prêts à l'emploi (onglet « Modèles » de la bibliothèque) :
 * couleurs par zone et motif graphique, appliqués au vêtement courant.
 */
import type { MaterialCode, Pattern } from "@wear3d/design-schema";

export type PresetStyle = "sport" | "classic" | "retro";

export interface DesignPreset {
  id: string;
  label: string;
  style: PresetStyle;
  body: string;
  sleeves: string;
  collar: string;
  material: MaterialCode;
  pattern?: Pick<Pattern, "assetId" | "color" | "opacity" | "rotation" | "scale" | "mode">;
}

export const PRESET_STYLES: Record<PresetStyle, string> = {
  sport: "Sport",
  classic: "Classique",
  retro: "Rétro",
};

export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: "royal",
    label: "Royal",
    style: "sport",
    body: "#1D4ED8",
    sleeves: "#1D4ED8",
    collar: "#FFFFFF",
    material: "poly-sport",
    pattern: {
      assetId: "pattern:band-diagonal",
      mode: "placed",
      color: "#FFFFFF",
      opacity: 0.85,
      rotation: 0,
      scale: 1,
    },
  },
  {
    id: "blanc-bleu",
    label: "Blanc & bleu",
    style: "sport",
    body: "#FFFFFF",
    sleeves: "#1D4ED8",
    collar: "#1D4ED8",
    material: "poly-sport",
  },
  {
    id: "nuit",
    label: "Nuit",
    style: "sport",
    body: "#0F172A",
    sleeves: "#0F172A",
    collar: "#1D4ED8",
    material: "poly-sport",
    pattern: {
      assetId: "pattern:band-diagonal",
      mode: "placed",
      color: "#2563EB",
      opacity: 1,
      rotation: 0,
      scale: 1,
    },
  },
  {
    id: "soleil",
    label: "Soleil",
    style: "classic",
    body: "#FACC15",
    sleeves: "#FACC15",
    collar: "#111827",
    material: "cotton",
  },
  {
    id: "eclair",
    label: "Éclair",
    style: "sport",
    body: "#FFFFFF",
    sleeves: "#1D4ED8",
    collar: "#1D4ED8",
    material: "poly-sport",
    pattern: {
      assetId: "pattern:shards",
      mode: "placed",
      color: "#1D4ED8",
      opacity: 0.9,
      rotation: 0,
      scale: 1,
    },
  },
  {
    id: "violet",
    label: "Violet",
    style: "sport",
    body: "#6D28D9",
    sleeves: "#6D28D9",
    collar: "#111827",
    material: "poly-sport",
    pattern: {
      assetId: "pattern:diagonal",
      mode: "repeat",
      color: "#4C1D95",
      opacity: 0.6,
      rotation: 0,
      scale: 1,
    },
  },
  {
    id: "retro-rayures",
    label: "Rayures rétro",
    style: "retro",
    body: "#B91C1C",
    sleeves: "#B91C1C",
    collar: "#FFFFFF",
    material: "cotton",
    pattern: {
      assetId: "pattern:stripes",
      mode: "repeat",
      color: "#FFFFFF",
      opacity: 1,
      rotation: 0,
      scale: 1,
    },
  },
  {
    id: "marine",
    label: "Marine",
    style: "classic",
    body: "#14243B",
    sleeves: "#14243B",
    collar: "#F5B70A",
    material: "cotton",
  },
];

/** Codes de zone du corps / des manches / du col pour les vêtements du catalogue. */
export function presetZoneColor(preset: DesignPreset, zone: string): string {
  if (zone.startsWith("SLEEVE")) return preset.sleeves;
  if (zone === "COLLAR") return preset.collar;
  return preset.body;
}
