/**
 * Où déposer un nouvel élément, et glisser-déposer depuis les panneaux vers le vêtement.
 *
 * Règle de placement : le côté que l'utilisateur regarde (vue 3D tournée vers le dos →
 * dos ; vue 2D affichée), sauf s'il a explicitement choisi une manche ou le col.
 * La zone du dernier calque sélectionné n'entre plus en compte : elle envoyait tout au dos.
 */
import {
  createImageLayer,
  createTextLayer,
  type Ambiance,
  type Mockup,
  type TextLayer,
} from "@wear3d/design-schema";
import { atlasUvToZone } from "@wear3d/editor-2d";
import { withMockup } from "./mockups";
import { newScene } from "./scenes";
import { useStudio } from "./store";
import { contrastColor, TEXTURES, withTexture } from "./textures";
import { viewerBridge } from "./viewer-bridge";

type Capability = "image" | "text";

const FLAT_ZONE = {
  both: "BODY_FRONT",
  front: "BODY_FRONT",
  back: "BODY_BACK",
  left: "SLEEVE_LEFT",
  right: "SLEEVE_RIGHT",
} as const;

function allows(code: string | null | undefined, cap: Capability): code is string {
  const z = useStudio.getState().definition?.zones.find((d) => d.code === code);
  return Boolean(z?.allows.includes(cap));
}

/** Zone face à l'utilisateur dans la vue courante. */
export function facingZone(): string {
  const s = useStudio.getState();
  if (s.viewMode === "2d") return FLAT_ZONE[s.flatMode];
  return s.activeView === "back" ? "BODY_BACK" : "BODY_FRONT";
}

/** Zone d'accueil d'un nouvel élément ajouté depuis un panneau. */
export function placementZone(cap: Capability): string {
  const s = useStudio.getState();
  const facing = facingZone();
  // Une manche ou le col choisis explicitement (clic sur la zone) restent prioritaires.
  const explicit = s.selection?.kind === "base" ? s.selectedZone : null;
  if (explicit && !explicit.startsWith("BODY") && allows(explicit, cap)) return explicit;
  // Vue 2D « Face + Dos » : le corps cliqué (devant ou dos) indique le côté voulu.
  if (s.viewMode === "2d" && s.flatMode === "both" && allows(explicit, cap)) return explicit!;
  return allows(facing, cap) ? facing : "BODY_FRONT";
}

/** Montre le côté où un élément vient d'être ajouté, s'il n'est pas visible. */
export function revealZone(zone: string): void {
  const s = useStudio.getState();
  if (s.viewMode === "2d") {
    // « Face + Dos » montre toutes les zones ; une vue seule ne montre que la sienne.
    const shown = s.flatMode === "both" || FLAT_ZONE[s.flatMode] === zone;
    if (!shown) {
      s.setFlatMode(zone === "SLEEVE_LEFT" ? "left" : zone === "SLEEVE_RIGHT" ? "right" : "both");
    }
    return;
  }
  if (zone === "BODY_BACK" && s.activeView !== "back") viewerBridge.viewer?.setView("back");
  if (zone === "BODY_FRONT" && s.activeView === "back") viewerBridge.viewer?.setView("front");
}

/* ---------- Glisser-déposer depuis les panneaux ---------- */

export type DragPayload =
  | {
      kind: "image";
      assetId: string;
      name: string;
      /** "auto" : teinte lisible sur la couleur de la zone (éléments monochromes). */
      tint?: "auto";
      width?: number;
    }
  | { kind: "text"; layer: TextLayer; width: number }
  | { kind: "texture"; textureId: string }
  | { kind: "mockup"; mockup: Mockup }
  | { kind: "scene"; id: string; ambiance: Ambiance }
  | { kind: "color"; color: string };

export const DRAG_MIME = "application/x-wear3d";

let payload: DragPayload | null = null;

/** À appeler dans onDragStart d'une vignette de panneau. */
export function startPanelDrag(e: React.DragEvent, p: DragPayload): void {
  payload = p;
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData(DRAG_MIME, p.kind);
  e.dataTransfer.setData("text/plain", "");
}

export function endPanelDrag(): void {
  payload = null;
}

/** Vrai si le glisser en cours vient d'un panneau du studio. */
export function isPanelDrag(e: React.DragEvent): boolean {
  return payload !== null && e.dataTransfer.types.includes(DRAG_MIME);
}

/** Le dépôt a-t-il besoin d'une zone précise sous le pointeur ? */
export function dropNeedsZone(): boolean {
  return payload?.kind === "texture" || payload?.kind === "color";
}

/** Props à étaler sur une vignette pour la rendre glissable vers le vêtement. */
export function draggable(p: DragPayload) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => startPanelDrag(e, p),
    onDragEnd: endPanelDrag,
  };
}

const clamp = (v: number) => Math.min(0.95, Math.max(0.05, v));

/**
 * Applique le glisser en cours au point déposé (zone + UV de l'atlas), ou à la zone
 * d'accueil par défaut si le point n'est pas sur le vêtement. Renvoie false si rien n'a été fait.
 */
export function applyDrop(hit: { zone: string; u: number; v: number } | null): boolean {
  const p = payload;
  payload = null;
  const s = useStudio.getState();
  if (!p || !s.doc || !s.definition) return false;
  const def = s.definition;

  // Position dans la zone touchée (coordonnées 0..1), si elle accepte ce type de contenu.
  const at = (cap: Capability) => {
    if (hit && allows(hit.zone, cap)) {
      const rect = def.zones.find((z) => z.code === hit.zone)!.uvRect;
      const local = atlasUvToZone({ code: hit.zone, ...rect }, hit.u, hit.v);
      return { zone: hit.zone, x: clamp(local.x), y: clamp(local.y) };
    }
    return { zone: placementZone(cap), x: 0.5, y: 0.35 };
  };

  switch (p.kind) {
    case "image": {
      const { zone, x, y } = at("image");
      const layer = createImageLayer(zone, p.assetId);
      layer.name = p.name;
      layer.transform = { ...layer.transform, x, y, w: p.width ?? layer.transform.w };
      if (p.tint === "auto") layer.tint = contrastColor(s.doc.zones[zone]?.color ?? "#FFFFFF");
      s.addLayer(layer);
      revealZone(zone);
      return true;
    }
    case "text": {
      const { zone, x, y } = at("text");
      const fresh = createTextLayer(zone, p.layer.text.value);
      s.addLayer({
        ...fresh,
        text: { ...p.layer.text },
        effects: structuredClone(p.layer.effects),
        transform: { ...fresh.transform, x, y, w: p.width },
      });
      revealZone(zone);
      return true;
    }
    case "texture": {
      const tex = TEXTURES.find((t) => t.id === p.textureId);
      if (!tex || !hit) return false;
      s.seal();
      s.update((d) => withTexture(d, def, tex, [hit.zone]));
      s.seal();
      return true;
    }
    case "color": {
      if (!hit) return false;
      s.setZonesColor([hit.zone], p.color);
      return true;
    }
    case "mockup": {
      s.seal();
      s.update((d) => withMockup(d, def, p.mockup));
      s.seal();
      return true;
    }
    case "scene": {
      s.setScene(newScene(p.id, p.ambiance, s.doc.scene));
      return true;
    }
  }
}
