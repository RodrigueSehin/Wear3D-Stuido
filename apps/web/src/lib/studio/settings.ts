/**
 * Préférences du Studio 3D (panneau « Paramètres »), propres à l'utilisateur et à son
 * matériel : enregistrées automatiquement dans le navigateur, indépendantes du design.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type DefaultView = "3d" | "2d" | "360";
export type ViewportResolution = "standard" | "high";
export type LengthUnit = "px" | "mm" | "cm";
export type StudioTheme = "light" | "dark" | "auto";
export type RenderQuality = "low" | "medium" | "high";
export type ExportFormatPref = "png" | "jpg";

export interface RenderSize {
  w: number;
  h: number;
}

export const RENDER_SIZES: { id: string; label: string; size: RenderSize }[] = [
  { id: "1080", label: "1920 × 1080 (Full HD)", size: { w: 1920, h: 1080 } },
  { id: "1440", label: "2560 × 1440 (2K)", size: { w: 2560, h: 1440 } },
  { id: "2160", label: "3840 × 2160 (4K)", size: { w: 3840, h: 2160 } },
  { id: "square", label: "2048 × 2048 (carré)", size: { w: 2048, h: 2048 } },
];

export const EXPORT_RESOLUTIONS: { width: number; label: string }[] = [
  { width: 1920, label: "HD (1920 px)" },
  { width: 2560, label: "2K (2560 px)" },
  { width: 3840, label: "4K (3840 × 2160)" },
];

export const ACCENTS = ["#1F5EFF", "#7C3AED", "#E11D48", "#F97316", "#16A34A"] as const;

export interface StudioSettings {
  defaultView: DefaultView;
  resolution: ViewportResolution;
  antialias: boolean;
  hdTextures: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showInfo: boolean;
  unit: LengthUnit;
  /** Échelle d'affichage du modèle 3D, en % (n'affecte pas l'export du design). */
  modelScale: number;
  theme: StudioTheme;
  accent: string;
  renderSize: string;
  quality: RenderQuality;
  shadows: boolean;
  fabricSheen: boolean;
  fabricRelief: boolean;
  exportFormat: ExportFormatPref;
  exportWidth: number;
}

export const DEFAULT_SETTINGS: StudioSettings = {
  defaultView: "3d",
  resolution: "high",
  antialias: true,
  hdTextures: true,
  showGrid: false,
  showAxes: false,
  showInfo: false,
  unit: "px",
  modelScale: 100,
  theme: "light",
  accent: "#1F5EFF",
  renderSize: "2160",
  quality: "high",
  shadows: true,
  fabricSheen: true,
  fabricRelief: true,
  exportFormat: "png",
  exportWidth: 3840,
};

/** Stockage tolérant : navigation privée ou stockage bloqué → préférences par défaut. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* préférences non persistées : sans conséquence */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* idem */
    }
  },
};

interface SettingsState extends StudioSettings {
  set<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]): void;
  reset(): void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<StudioSettings>),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "wear3d-studio-settings",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Une préférence inconnue ou manquante reprend sa valeur par défaut.
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<StudioSettings>) }),
    },
  ),
);

export function renderSizeOf(id: string): RenderSize {
  return (RENDER_SIZES.find((r) => r.id === id) ?? RENDER_SIZES[2]!).size;
}

export const JPG_QUALITY: Record<RenderQuality, number> = { low: 0.75, medium: 0.88, high: 0.95 };

/** Facteurs de conversion d'une zone : unité choisie par fraction de zone (axe X, axe Y). */
export function unitScale(
  unit: LengthUnit,
  zonePx: { w: number; h: number },
  printMm?: { w: number; h: number },
): { x: number; y: number; decimals: number } {
  if (unit === "px" || !printMm) return { x: zonePx.w, y: zonePx.h, decimals: 0 };
  const k = unit === "mm" ? 1 : 0.1;
  return { x: printMm.w * k, y: printMm.h * k, decimals: unit === "cm" ? 1 : 0 };
}

/** Variables CSS de la couleur d'accent (bouton, sélection, curseurs). */
export function accentVars(hex: string): Record<string, string> {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const dark = (c: number) => Math.round(c * 0.85);
  return {
    "--action": hex,
    "--action-hover": `rgb(${dark(r)} ${dark(g)} ${dark(b)})`,
    "--action-soft": `rgb(${r} ${g} ${b} / 0.12)`,
    "--ring": hex,
  };
}
