/** Préréglages de vue et d'éclairage — sans dépendance à three.js (importables partout). */

export type LightingPreset = "studio" | "outdoor" | "showroom" | "sunset" | "boutique" | "night";

export const LIGHTING_LABELS: Record<LightingPreset, string> = {
  studio: "Studio",
  outdoor: "Extérieur",
  showroom: "Vitrine",
  sunset: "Coucher de soleil",
  boutique: "Boutique",
  night: "Nuit",
};

export type ViewPreset = "front" | "back" | "left" | "right" | "three-quarter";

export const VIEW_LABELS: Record<ViewPreset, string> = {
  front: "Avant",
  back: "Arrière",
  left: "Gauche",
  right: "Droite",
  "three-quarter": "3/4",
};

const D = 3.05;
const Y = 0.16;
const T = -0.14; // cible un peu basse : le vêtement et son podium sont cadrés ensemble

/** Position caméra et cible pour chaque vue (le porteur regarde vers +Z, sa gauche = +X). */
export const VIEW_POSES: Record<
  ViewPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, Y, D], target: [0, T, 0] },
  back: { position: [0, Y, -D], target: [0, T, 0] },
  left: { position: [D, Y, 0], target: [0, T, 0] },
  right: { position: [-D, Y, 0], target: [0, T, 0] },
  "three-quarter": { position: [D * 0.72, Y + 0.15, D * 0.72], target: [0, T, 0] },
};

/** Azimut (degrés) de chaque vue, pour le curseur 360°. */
export const VIEW_AZIMUTH: Record<ViewPreset, number> = {
  front: 0,
  "three-quarter": 45,
  left: 90,
  back: 180,
  right: 270,
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
