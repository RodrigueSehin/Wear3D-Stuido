/**
 * État client du studio (CDC §4.1 : Zustand + historique undo/redo).
 * Le document de design est immuable : chaque modification produit un nouvel objet,
 * l'ancien est poussé dans l'historique (gestes continus regroupés).
 */
import type { DesignDocument, Layer, MaterialCode } from "@wear3d/design-schema";
import { SnapshotHistory } from "@wear3d/editor-2d";
import type { GarmentDefinition, LightingPreset } from "@wear3d/garment-engine";
import { create } from "zustand";

export type ToolId = "model" | "colors" | "materials" | "texts" | "images" | "numbers" | "ai";
export type StudioMode = "design" | "simulation";
export type SaveState = "idle" | "saving" | "saved" | "offline" | "error";

const history = new SnapshotHistory<DesignDocument>();

interface StudioState {
  designId: string | null;
  name: string;
  definition: GarmentDefinition | null;
  doc: DesignDocument | null;
  /** Incrémenté à chaque modification du document (déclenche l'autosave). */
  revision: number;

  selectedZone: string | null;
  selectedLayerId: string | null;
  hoveredZone: string | null;
  tool: ToolId | null;
  mode: StudioMode;
  lighting: LightingPreset;
  recentColors: string[];
  saveState: SaveState;
  canUndo: boolean;
  canRedo: boolean;

  init(input: {
    designId: string;
    name: string;
    definition: GarmentDefinition;
    doc: DesignDocument;
  }): void;
  rename(name: string): void;
  /** Applique une modification au document ; `coalesceKey` regroupe un geste continu. */
  update(recipe: (doc: DesignDocument) => DesignDocument, coalesceKey?: string): void;
  seal(): void;
  undo(): void;
  redo(): void;

  setZoneColor(zone: string, color: string, coalesceKey?: string): void;
  setZonesColor(zones: string[], color: string): void;
  setZoneMaterial(zone: string, material: MaterialCode): void;
  addLayer(layer: Layer): void;
  updateLayer(id: string, patch: (layer: Layer) => Layer, coalesceKey?: string): void;
  removeLayer(id: string): void;
  duplicateLayer(id: string): void;
  reorderLayer(id: string, direction: "up" | "down"): void;

  selectZone(zone: string | null): void;
  selectLayer(id: string | null): void;
  setHoveredZone(zone: string | null): void;
  setTool(tool: ToolId | null): void;
  setMode(mode: StudioMode): void;
  setLighting(lighting: LightingPreset): void;
  pushRecentColor(color: string): void;
  setSaveState(state: SaveState): void;
}

const flags = () => ({ canUndo: history.canUndo, canRedo: history.canRedo });

export const useStudio = create<StudioState>()((set, get) => ({
  designId: null,
  name: "Sans titre",
  definition: null,
  doc: null,
  revision: 0,
  selectedZone: null,
  selectedLayerId: null,
  hoveredZone: null,
  tool: "colors",
  mode: "design",
  lighting: "studio",
  recentColors: ["#14243B", "#FFFFFF", "#1F5EFF", "#111827", "#6A3CF0", "#E5484D", "#F5B70A"],
  saveState: "idle",
  canUndo: false,
  canRedo: false,

  init({ designId, name, definition, doc }) {
    history.clear();
    set({
      designId,
      name,
      definition,
      doc,
      revision: 0,
      selectedZone: definition.zones[0]?.code ?? null,
      selectedLayerId: null,
      saveState: "saved",
      ...flags(),
    });
  },

  rename(name) {
    set((s) => ({ name, revision: s.revision + 1 }));
  },

  update(recipe, coalesceKey) {
    const { doc } = get();
    if (!doc) return;
    const next = recipe(doc);
    if (next === doc) return;
    history.record(doc, coalesceKey);
    set((s) => ({ doc: next, revision: s.revision + 1, ...flags() }));
  },

  seal() {
    history.seal();
  },

  undo() {
    const { doc } = get();
    if (!doc) return;
    const prev = history.undo(doc);
    if (prev)
      set((s) => ({ doc: prev, revision: s.revision + 1, ...flags(), ...keepSelection(s, prev) }));
  },

  redo() {
    const { doc } = get();
    if (!doc) return;
    const next = history.redo(doc);
    if (next)
      set((s) => ({ doc: next, revision: s.revision + 1, ...flags(), ...keepSelection(s, next) }));
  },

  setZoneColor(zone, color, coalesceKey) {
    get().update(
      (doc) => {
        const style = doc.zones[zone];
        if (!style || style.color === color) return doc;
        return { ...doc, zones: { ...doc.zones, [zone]: { ...style, color } } };
      },
      coalesceKey ?? `color:${zone}`,
    );
  },

  setZonesColor(zones, color) {
    get().seal();
    get().update((doc) => {
      const next = { ...doc.zones };
      for (const z of zones) if (next[z]) next[z] = { ...next[z], color };
      return { ...doc, zones: next };
    });
    get().seal();
  },

  setZoneMaterial(zone, material) {
    get().seal();
    get().update((doc) => {
      const style = doc.zones[zone];
      if (!style || style.material === material) return doc;
      return { ...doc, zones: { ...doc.zones, [zone]: { ...style, material } } };
    });
  },

  addLayer(layer) {
    get().seal();
    get().update((doc) => ({ ...doc, layers: [...doc.layers, layer] }));
    set({ selectedLayerId: layer.id, selectedZone: layer.zone });
  },

  updateLayer(id, patch, coalesceKey) {
    get().update(
      (doc) => ({ ...doc, layers: doc.layers.map((l) => (l.id === id ? patch(l) : l)) }),
      coalesceKey ?? `layer:${id}`,
    );
  },

  removeLayer(id) {
    get().seal();
    get().update((doc) => ({ ...doc, layers: doc.layers.filter((l) => l.id !== id) }));
    if (get().selectedLayerId === id) set({ selectedLayerId: null });
  },

  duplicateLayer(id) {
    const layer = get().doc?.layers.find((l) => l.id === id);
    if (!layer) return;
    const copy: Layer = {
      ...structuredClone(layer),
      id: `${layer.id}_${Math.random().toString(36).slice(2, 7)}`,
      transform: { ...layer.transform, x: layer.transform.x + 0.03, y: layer.transform.y + 0.03 },
    };
    get().addLayer(copy);
  },

  reorderLayer(id, direction) {
    get().seal();
    get().update((doc) => {
      const i = doc.layers.findIndex((l) => l.id === id);
      const j = direction === "up" ? i + 1 : i - 1;
      if (i < 0 || j < 0 || j >= doc.layers.length) return doc;
      const layers = [...doc.layers];
      [layers[i], layers[j]] = [layers[j]!, layers[i]!];
      return { ...doc, layers };
    });
  },

  selectZone(zone) {
    history.seal();
    set({ selectedZone: zone });
  },
  selectLayer(id) {
    history.seal();
    const layer = id ? get().doc?.layers.find((l) => l.id === id) : undefined;
    set({ selectedLayerId: id, ...(layer ? { selectedZone: layer.zone } : {}) });
  },
  setHoveredZone(zone) {
    if (get().hoveredZone !== zone) set({ hoveredZone: zone });
  },
  setTool(tool) {
    set((s) => ({ tool: s.tool === tool ? null : tool }));
  },
  setMode(mode) {
    set({ mode, hoveredZone: null });
  },
  setLighting(lighting) {
    set({ lighting });
  },
  pushRecentColor(color) {
    const c = color.toUpperCase();
    set((s) => ({ recentColors: [c, ...s.recentColors.filter((x) => x !== c)].slice(0, 8) }));
  },
  setSaveState(saveState) {
    set({ saveState });
  },
}));

function keepSelection(s: StudioState, doc: DesignDocument) {
  return s.selectedLayerId && !doc.layers.some((l) => l.id === s.selectedLayerId)
    ? { selectedLayerId: null }
    : {};
}

/** Calque sélectionné (sélecteur dérivé). */
export function useSelectedLayer(): Layer | undefined {
  return useStudio((s) => s.doc?.layers.find((l) => l.id === s.selectedLayerId));
}
