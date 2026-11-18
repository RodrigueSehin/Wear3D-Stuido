/**
 * Atlas UV partagé par la vue 3D (texture) et la vue 2D à plat (affichage direct).
 * Un seul canvas, recomposé à chaque modification du document.
 */
import { applyPlayer, PREVIEW_PLAYER, type DesignDocument } from "@wear3d/design-schema";
import { composeAtlas, type ZoneRect } from "@wear3d/editor-2d";
import { ATLAS_SIZE, type GarmentDefinition } from "@wear3d/garment-engine";
import { create } from "zustand";
import { getCachedImage } from "./assets";
import { resolveFont, resolveNumberFont } from "./fonts";
import { resolvePattern } from "./patterns";

let studioCanvas: HTMLCanvasElement | null = null;

export function getAtlasCanvas(): HTMLCanvasElement {
  if (!studioCanvas) {
    studioCanvas = document.createElement("canvas");
    studioCanvas.width = studioCanvas.height = ATLAS_SIZE.studio;
  }
  return studioCanvas;
}

export function zoneRects(definition: GarmentDefinition): ZoneRect[] {
  return definition.zones.map((z) => ({ code: z.code, ...z.uvRect }));
}

/** Compose le document dans un canvas à la taille voulue (studio 2048, export 4096). */
export function composeInto(
  canvas: HTMLCanvasElement,
  doc: DesignDocument,
  definition: GarmentDefinition,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const zones = zoneRects(definition);
  // Aperçu studio : les jetons d'effectif sont remplacés par un joueur type (NOM, 10).
  composeAtlas(ctx, applyPlayer(doc, PREVIEW_PLAYER), {
    atlasSize: canvas.width,
    zones,
    resolveImage: getCachedImage,
    resolvePattern,
    resolveFont,
    resolveNumberFont,
    background: doc.zones[zones[0]?.code ?? ""]?.color,
    createCanvas: (w, h) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    },
  });
}

/** Version de l'atlas : incrémentée après chaque composition (texture à rafraîchir). */
export const useAtlas = create<{ version: number; bump: () => void }>()((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
