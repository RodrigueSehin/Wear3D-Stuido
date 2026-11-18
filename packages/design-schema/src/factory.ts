import type { DesignDocument } from "./migrations";
import type { ImageLayer, Layer, MaterialCode, NumberLayer, TextLayer } from "./v1";

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
    schemaVersion: 1,
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

export function createTextLayer(zone: string, value = "TEXTE"): TextLayer {
  return {
    id: newLayerId(),
    type: "text",
    zone,
    locked: false,
    visible: true,
    opacity: 1,
    transform: { x: 0.5, y: 0.3, w: 0.5, rotation: 0 },
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
    id: newLayerId(),
    type: "number",
    zone,
    locked: false,
    visible: true,
    opacity: 1,
    transform: { x: 0.5, y: 0.5, w: 0.4, rotation: 0 },
    number: { value, style: "block-classic", color: "#FFFFFF" },
  };
}

export function createImageLayer(zone: string, assetId: string): ImageLayer {
  return {
    id: newLayerId(),
    type: "image",
    zone,
    assetId,
    locked: false,
    visible: true,
    opacity: 1,
    transform: { x: 0.7, y: 0.22, w: 0.2, rotation: 0 },
  };
}

export function layerLabel(layer: Layer): string {
  if (layer.name) return layer.name;
  if (layer.type === "text") return layer.text.value || "Texte";
  if (layer.type === "number") return `N° ${layer.number.value}`;
  return "Image";
}
