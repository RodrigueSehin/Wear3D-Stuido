import type { DesignDocument } from "./migrations";
import {
  DEFAULT_EFFECTS,
  type ImageLayer,
  type Layer,
  type MaterialCode,
  type NumberLayer,
  type TextLayer,
  type Transform,
} from "./v2";

export interface GarmentZoneDefaults {
  code: string;
  color: string;
  material: MaterialCode;
}

/** Document vierge pour un modèle : chaque zone reçoit sa couleur et sa matière par défaut. */
export function createEmptyDocument(
  versionId: string,
  zones: readonly GarmentZoneDefaults[],
  size = "M",
): DesignDocument {
  return {
    schemaVersion: 2,
    model: { versionId, size, morph: "posed" },
    zones: Object.fromEntries(zones.map((z) => [z.code, { color: z.color, material: z.material }])),
    layers: [],
  };
}

let counter = 0;
/** Identifiant court et unique de calque (el_xxxxxx). */
export function newLayerId(): string {
  counter = (counter + 1) % 0xfff;
  const rand = Math.floor(Math.random() * 0xffffff).toString(36);
  return `el_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

const transform = (x: number, y: number, w: number): Transform => ({
  x,
  y,
  w,
  rotation: 0,
  flipX: false,
  flipY: false,
});

const base = (zone: string) => ({
  id: newLayerId(),
  zone,
  locked: false,
  visible: true,
  opacity: 1,
  blendMode: "normal" as const,
  effects: structuredClone(DEFAULT_EFFECTS),
});

export function createTextLayer(zone: string, value = "TEXTE"): TextLayer {
  return {
    ...base(zone),
    type: "text",
    transform: transform(0.5, 0.3, 0.5),
    text: {
      value,
      font: "anton",
      size: 0.08,
      color: "#FFFFFF",
      weight: 700,
      letterSpacing: 0,
      arc: 0,
    },
  };
}

export function createNumberLayer(zone: string, value = "10"): NumberLayer {
  return {
    ...base(zone),
    type: "number",
    transform: transform(0.5, 0.5, 0.4),
    number: { value, style: "block-classic", color: "#FFFFFF" },
  };
}

export function createImageLayer(zone: string, assetId: string): ImageLayer {
  return {
    ...base(zone),
    type: "image",
    assetId,
    transform: transform(0.7, 0.22, 0.2),
  };
}

export function layerLabel(layer: Layer): string {
  if (layer.name) return layer.name;
  if (layer.type === "text") return layer.text.value || "Texte";
  if (layer.type === "number") return `Numéro (${layer.number.value})`;
  return "Image";
}
