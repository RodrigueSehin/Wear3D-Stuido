/** Préréglages de vue et d'éclairage — sans dépendance à three.js (importables partout). */

export type LightingPreset = "studio" | "outdoor" | "showroom";

export const LIGHTING_LABELS: Record<LightingPreset, string> = {
  studio: "Studio",
  outdoor: "Extérieur",
  showroom: "Vitrine",
};

export type ViewPreset = "front" | "back" | "left" | "right" | "three-quarter";

export const VIEW_LABELS: Record<ViewPreset, string> = {
  front: "Avant",
  back: "Arrière",
  left: "Gauche",
  right: "Droite",
  "three-quarter": "3/4",
};

const D = 2.1;
const Y = 0.04;

/** Position caméra et cible pour chaque vue (le porteur regarde vers +Z, sa gauche = +X). */
export const VIEW_POSES: Record<
  ViewPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, Y, D], target: [0, Y, 0] },
  back: { position: [0, Y, -D], target: [0, Y, 0] },
  left: { position: [D, Y, 0], target: [0, Y, 0] },
  right: { position: [-D, Y, 0], target: [0, Y, 0] },
  "three-quarter": { position: [D * 0.72, Y + 0.18, D * 0.72], target: [0, Y, 0] },
};

/** WebGL 2 requis (CDC §6.4). */
export function isWebGL2Available(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}
