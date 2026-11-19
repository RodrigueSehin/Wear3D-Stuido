/**
 * Scènes de présentation (menu « Scènes ») : décor d'arrière-plan dessiné par code,
 * éclairage associé et réglages par défaut. Les décors sont générés en canvas (aucune
 * photo requise) et mis en cache sous forme de data URL.
 */
import type { Ambiance, Scene } from "@wear3d/design-schema";
import type { LightingPreset } from "@wear3d/garment-engine";

export type SceneCategory = "sport" | "studio" | "lifestyle" | "event";

export const SCENE_CATEGORIES: { id: SceneCategory | "all"; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "sport", label: "Sport" },
  { id: "studio", label: "Studio" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "event", label: "Événement" },
];

export const CUSTOM_SCENE_PREFIX = "custom:";

export interface SceneDef {
  id: string;
  label: string;
  categories: readonly SceneCategory[];
  /** Environnement d'éclairage (reflets) du moteur 3D. */
  environment: LightingPreset;
  ambiance: Ambiance;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

/* ---------- Outils de dessin ---------- */

function rng(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296;
    return t / 4294967296;
  };
}

function vGradient(
  ctx: CanvasRenderingContext2D,
  y0: number,
  y1: number,
  stops: [number, string][],
) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}

/** Pelouse rayée vue en perspective (bandes de tonte de plus en plus hautes). */
function pitch(ctx: CanvasRenderingContext2D, w: number, h: number, top: number, dark = false) {
  const base = dark ? ["#1d5a23", "#236b2a"] : ["#3f9a3a", "#4fae46"];
  let y = top;
  let band = h * 0.025;
  let i = 0;
  while (y < h) {
    ctx.fillStyle = base[i % 2]!;
    ctx.fillRect(0, y, w, band + 1);
    y += band;
    band *= 1.28;
    i++;
  }
  ctx.fillStyle = vGradient(ctx, top, h, [
    [0, dark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.25)"],
    [0.4, "rgba(0,0,0,0)"],
    [1, "rgba(0,0,0,0.25)"],
  ]);
  ctx.fillRect(0, top, w, h - top);
}

/* ---------- Décors ---------- */

export const SCENES: readonly SceneDef[] = [
  {
    id: "stadium",
    label: "Stade",
    categories: ["sport", "event"],
    environment: "showroom",
    ambiance: "night",
    draw(ctx, w, h) {
      ctx.fillStyle = vGradient(ctx, 0, h * 0.55, [
        [0, "#030820"],
        [1, "#16336e"],
      ]);
      ctx.fillRect(0, 0, w, h);
      // Tribunes : foule en points colorés.
      const rand = rng(5);
      ctx.fillStyle = "#0b1636";
      ctx.fillRect(0, h * 0.36, w, h * 0.26);
      for (let i = 0; i < 2600; i++) {
        const y = h * (0.37 + rand() * 0.24);
        ctx.fillStyle = ["#2e4a8f", "#5a6fa8", "#c8d2ec", "#1f5eff", "#8a97bd"][
          Math.floor(rand() * 5)
        ]!;
        ctx.globalAlpha = 0.35 + rand() * 0.5;
        ctx.fillRect(rand() * w, y, 2.2, 2.2);
      }
      ctx.globalAlpha = 1;
      // Projecteurs.
      for (const x of [0.12, 0.3, 0.7, 0.88]) {
        glow(ctx, w * x, h * 0.1, h * 0.32, "rgba(190,215,255,0.55)");
        glow(ctx, w * x, h * 0.1, h * 0.05, "rgba(255,255,255,0.95)");
      }
      pitch(ctx, w, h, h * 0.62, true);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(0, h * 0.7, w, h * 0.006);
    },
  },
  {
    id: "studio-pro",
    label: "Studio Pro",
    categories: ["studio"],
    environment: "studio",
    ambiance: "day",
    draw(ctx, w, h) {
      ctx.fillStyle = vGradient(ctx, 0, h, [
        [0, "#3a3f4b"],
        [0.65, "#16181f"],
        [1, "#0b0c10"],
      ]);
      ctx.fillRect(0, 0, w, h);
      // Cônes de lumière depuis les projecteurs.
      for (const x of [0.25, 0.5, 0.75]) {
        const g = ctx.createLinearGradient(0, 0, 0, h * 0.85);
        g.addColorStop(0, "rgba(255,255,255,0.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(w * x - w * 0.02, 0);
        ctx.lineTo(w * x + w * 0.02, 0);
        ctx.lineTo(w * x + w * 0.16, h * 0.85);
        ctx.lineTo(w * x - w * 0.16, h * 0.85);
        ctx.closePath();
        ctx.fill();
        glow(ctx, w * x, h * 0.02, h * 0.08, "rgba(255,255,255,0.9)");
      }
      glow(ctx, w * 0.5, h * 0.86, w * 0.35, "rgba(200,210,230,0.25)");
    },
  },
  {
    id: "field",
    label: "Terrain",
    categories: ["sport", "lifestyle"],
    environment: "outdoor",
    ambiance: "day",
    draw(ctx, w, h) {
      ctx.fillStyle = vGradient(ctx, 0, h * 0.5, [
        [0, "#6fa8e8"],
        [1, "#d6e8f7"],
      ]);
      ctx.fillRect(0, 0, w, h);
      // Rangée d'arbres.
      const rand = rng(9);
      for (let i = 0; i < 60; i++) {
        const x = (i / 60) * w + rand() * 20;
        const r = h * (0.05 + rand() * 0.05);
        ctx.fillStyle = ["#2f5a2a", "#3c6e33", "#274d24"][i % 3]!;
        ctx.beginPath();
        ctx.arc(x, h * 0.47, r, 0, Math.PI * 2);
        ctx.fill();
      }
      pitch(ctx, w, h, h * 0.5);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(0, h * 0.6, w, h * 0.006);
    },
  },
  {
    id: "locker-room",
    label: "Vestiaire",
    categories: ["sport", "lifestyle"],
    environment: "boutique",
    ambiance: "evening",
    draw(ctx, w, h) {
      ctx.fillStyle = "#2a1a10";
      ctx.fillRect(0, 0, w, h);
      const n = 7;
      const lw = w / n;
      for (let i = 0; i < n; i++) {
        const x = i * lw;
        ctx.fillStyle = vGradient(ctx, 0, h * 0.78, [
          [0, "#7a4d2c"],
          [1, "#4a2c18"],
        ]);
        ctx.fillRect(x + lw * 0.05, h * 0.06, lw * 0.9, h * 0.72);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x + lw * 0.1, h * 0.12, lw * 0.8, h * 0.5);
        // Maillot suspendu.
        const cx = x + lw / 2;
        const top = h * 0.2;
        ctx.fillStyle = i % 2 ? "#1f5eff" : "#e8eef8";
        ctx.beginPath();
        ctx.moveTo(cx - lw * 0.3, top);
        ctx.lineTo(cx + lw * 0.3, top);
        ctx.lineTo(cx + lw * 0.38, top + h * 0.08);
        ctx.lineTo(cx + lw * 0.24, top + h * 0.1);
        ctx.lineTo(cx + lw * 0.24, top + h * 0.34);
        ctx.lineTo(cx - lw * 0.24, top + h * 0.34);
        ctx.lineTo(cx - lw * 0.24, top + h * 0.1);
        ctx.lineTo(cx - lw * 0.38, top + h * 0.08);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = vGradient(ctx, h * 0.78, h, [
        [0, "#3a3f47"],
        [1, "#1b1d22"],
      ]);
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      glow(ctx, w * 0.5, 0, h * 0.6, "rgba(255,200,140,0.35)");
    },
  },
  {
    id: "outdoor",
    label: "Extérieur",
    categories: ["lifestyle"],
    environment: "sunset",
    ambiance: "day",
    draw(ctx, w, h) {
      ctx.fillStyle = vGradient(ctx, 0, h * 0.7, [
        [0, "#8cc1f0"],
        [1, "#eef5fb"],
      ]);
      ctx.fillRect(0, 0, w, h);
      const rand = rng(21);
      // Immeubles.
      let x = 0;
      while (x < w) {
        const bw = w * (0.06 + rand() * 0.07);
        const bh = h * (0.25 + rand() * 0.3);
        const shade = 150 + Math.floor(rand() * 50);
        ctx.fillStyle = `rgb(${shade - 30},${shade - 15},${shade + 10})`;
        ctx.fillRect(x, h * 0.7 - bh, bw, bh);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        for (let wy = h * 0.7 - bh + 10; wy < h * 0.68; wy += 18)
          for (let wx = x + 6; wx < x + bw - 8; wx += 14) ctx.fillRect(wx, wy, 6, 9);
        x += bw + 4;
      }
      // Arbres.
      for (let i = 0; i < 14; i++) {
        const tx = rand() * w;
        ctx.fillStyle = "#4a3320";
        ctx.fillRect(tx - 4, h * 0.62, 8, h * 0.1);
        ctx.fillStyle = ["#3f7a35", "#4f8f3f"][i % 2]!;
        ctx.beginPath();
        ctx.arc(tx, h * 0.6, h * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = vGradient(ctx, h * 0.7, h, [
        [0, "#9aa3ae"],
        [1, "#6d747e"],
      ]);
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
    },
  },
  {
    id: "dark",
    label: "Fond sombre",
    categories: ["studio"],
    environment: "night",
    ambiance: "night",
    draw(ctx, w, h) {
      const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.7);
      g.addColorStop(0, "#14275e");
      g.addColorStop(1, "#040817");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Néons verticaux.
      for (const x of [0.22, 0.78]) {
        glow(ctx, w * x, h * 0.4, h * 0.3, "rgba(60,120,255,0.35)");
        ctx.fillStyle = "#8fb6ff";
        ctx.fillRect(w * x - 2, h * 0.08, 4, h * 0.68);
      }
      ctx.fillStyle = "rgba(76,141,255,0.6)";
      ctx.fillRect(0, h * 0.78, w, 2);
    },
  },
  {
    id: "light",
    label: "Fond clair",
    categories: ["studio"],
    environment: "studio",
    ambiance: "day",
    draw(ctx, w, h) {
      const g = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.75);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, "#d7dee9");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      glow(ctx, w / 2, h * 0.85, w * 0.3, "rgba(150,165,190,0.25)");
    },
  },
  {
    id: "event",
    label: "Événement",
    categories: ["event"],
    environment: "showroom",
    ambiance: "evening",
    draw(ctx, w, h) {
      ctx.fillStyle = vGradient(ctx, 0, h, [
        [0, "#1c0b45"],
        [1, "#07041a"],
      ]);
      ctx.fillRect(0, 0, w, h);
      // Écrans LED latéraux.
      for (const [x, c] of [
        [0.04, "#7c3aed"],
        [0.82, "#3b5bff"],
      ] as const) {
        glow(ctx, w * (x + 0.07), h * 0.4, h * 0.4, `${c}55`);
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(w * x, h * 0.12, w * 0.14, h * 0.55);
        ctx.globalAlpha = 1;
      }
      // Faisceau doré central.
      const beam = ctx.createLinearGradient(0, 0, 0, h * 0.8);
      beam.addColorStop(0, "rgba(255,200,90,0.55)");
      beam.addColorStop(1, "rgba(255,200,90,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(w * 0.47, 0);
      ctx.lineTo(w * 0.53, 0);
      ctx.lineTo(w * 0.68, h * 0.8);
      ctx.lineTo(w * 0.32, h * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = vGradient(ctx, h * 0.8, h, [
        [0, "#2a1660"],
        [1, "#0c0624"],
      ]);
      ctx.fillRect(0, h * 0.8, w, h * 0.2);
    },
  },
];

export function sceneById(id: string): SceneDef | undefined {
  return SCENES.find((s) => s.id === id);
}

export function filterScenes(category: SceneCategory | "all", query: string): SceneDef[] {
  const q = query.trim().toLowerCase();
  return SCENES.filter(
    (s) =>
      (category === "all" || s.categories.includes(category)) &&
      (!q || s.label.toLowerCase().includes(q)),
  );
}

const cache = new Map<string, string>();

/** Décor d'une scène intégrée (data URL JPEG, mis en cache). */
export function sceneBackdrop(def: SceneDef, width = 1600, height = 1000): string {
  if (typeof document === "undefined") return "";
  const key = `${def.id}|${width}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  def.draw(ctx, width, height);
  const url = canvas.toDataURL("image/jpeg", 0.9);
  cache.set(key, url);
  return url;
}

/** Réglages d'une scène nouvellement choisie (l'ambiance suit le décor). */
export function newScene(id: string, ambiance: Ambiance = "day", prev?: Scene): Scene {
  return {
    id,
    intensity: prev?.intensity ?? 1,
    angle: prev?.angle ?? 330,
    ambiance,
    brightness: prev?.brightness ?? 0,
    contrast: prev?.contrast ?? 0,
    saturation: prev?.saturation ?? 0,
    groundShadow: prev?.groundShadow ?? true,
    reflection: prev?.reflection ?? false,
    backgroundBlur: prev?.backgroundBlur ?? false,
    includeInExport: prev?.includeInExport ?? true,
  };
}

/** Teinte et exposition de la lumière selon l'ambiance. */
export const AMBIANCE_LIGHT: Record<Ambiance, { color: string; exposure: number; label: string }> =
  {
    day: { color: "#ffffff", exposure: 1, label: "Jour" },
    evening: { color: "#ffc48a", exposure: 0.92, label: "Soir" },
    night: { color: "#a9c2ff", exposure: 0.8, label: "Nuit" },
  };

/** Filtre CSS / Canvas des ajustements (luminosité, contraste, saturation). */
export function sceneFilter(scene: Scene | undefined): string {
  if (!scene) return "none";
  const f = (v: number) => (1 + v).toFixed(2);
  return `brightness(${f(scene.brightness)}) contrast(${f(scene.contrast)}) saturate(${f(scene.saturation)})`;
}
