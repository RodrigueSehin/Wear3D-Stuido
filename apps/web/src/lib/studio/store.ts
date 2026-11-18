/**
 * État client du studio (CDC §4.1 : Zustand + historique undo/redo).
 * Le document de design est immuable : chaque modification produit un nouvel objet,
 * l'ancien est poussé dans l'historique (gestes continus regroupés).
 */
import type { DesignDocument, Layer, MaterialCode, Pattern } from "@wear3d/design-schema";
import { SnapshotHistory } from "@wear3d/editor-2d";
import type { GarmentDefinition, LightingPreset, ViewPreset } from "@wear3d/garment-engine";
import { create } from "zustand";

/** Entrées du rail gauche (maquette Studio). */
export type RailItem =
  "design" | "textures" | "logos" | "texts" | "elements" | "mockups" | "scenes" | "settings";
export type LibraryTab = "models" | "colors" | "patterns" | "fabrics";
export type ViewerTool = "select" | "move" | "pan" | "orbit";
export type SaveState = "idle" | "saving" | "saved" | "offline" | "error";

/**
 * Sélection de l'inspecteur : un calque, la couleur de base (zones) ou le motif graphique.
 */
export type Selection =
  { kind: "layer"; id: string } | { kind: "base" } | { kind: "pattern" } | null;

const history = new SnapshotHistory<DesignDocument>();

interface StudioState {
  designId: string | null;
  name: string;
  definition: GarmentDefinition | null;
  doc: DesignDocument | null;
  /** Incrémenté à chaque modification du document (déclenche l'autosave). */
  revision: number;

  selection: Selection;
  selectedZone: string | null;
  hoveredZone: string | null;
  rail: RailItem;
  libraryOpen: boolean;
  libraryTab: LibraryTab;
  inspectorOpen: boolean;
  viewMode: "3d" | "2d";
  tool: ViewerTool;
  preview: boolean;
  lighting: LightingPreset;
  showPodium: boolean;
  dragging: boolean;
  /** Vue la plus proche de la caméra (miniatures, barre « Vue »). */
  activeView: ViewPreset;
  recentColors: string[];
  saveState: SaveState;
  lastSavedAt: Date | null;
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
  setZonesColor(zones: readonly string[], color: string): void;
  setZoneMaterial(zone: string, material: MaterialCode): void;
  setZonesMaterial(zones: readonly string[], material: MaterialCode): void;
  setZonesPattern(
    zones: readonly string[],
    pattern: Pattern | undefined,
    coalesceKey?: string,
  ): void;
  addLayer(layer: Layer): void;
  updateLayer(id: string, patch: (layer: Layer) => Layer, coalesceKey?: string): void;
  removeLayer(id: string): void;
  duplicateLayer(id: string): void;
  reorderLayer(id: string, direction: "up" | "down"): void;
  /** Place le calque à l'index donné (0 = tout en dessous). */
  moveLayerTo(id: string, index: number): void;

  select(selection: Selection): void;
  selectZone(zone: string | null): void;
  setHoveredZone(zone: string | null): void;
  openRail(item: RailItem): void;
  setLibraryOpen(open: boolean): void;
  setLibraryTab(tab: LibraryTab): void;
  setInspectorOpen(open: boolean): void;
  setViewMode(mode: "3d" | "2d"): void;
  setTool(tool: ViewerTool): void;
  setPreview(preview: boolean): void;
  setLighting(lighting: LightingPreset): void;
  setShowPodium(show: boolean): void;
  setDragging(dragging: boolean): void;
  setActiveView(view: ViewPreset): void;
  pushRecentColor(color: string): void;
  setSaveState(state: SaveState): void;
}

const flags = () => ({ canUndo: history.canUndo, canRedo: history.canRedo });

/** Zones portant un motif (pour le calque « Motif graphique »). */
export function patternZones(doc: DesignDocument | null): string[] {
  return doc
    ? Object.entries(doc.zones)
        .filter(([, z]) => z.pattern)
        .map(([code]) => code)
    : [];
}

export const useStudio = create<StudioState>()((set, get) => ({
  designId: null,
  name: "Sans titre",
  definition: null,
  doc: null,
  revision: 0,
  selection: null,
  selectedZone: null,
  hoveredZone: null,
  rail: "design",
  libraryOpen: true,
  libraryTab: "models",
  inspectorOpen: true,
  viewMode: "3d",
  tool: "select",
  preview: false,
  lighting: "studio",
  showPodium: true,
  dragging: false,
  activeView: "front",
  recentColors: ["#1D4ED8", "#FFFFFF", "#0B1530", "#DC2626", "#16A34A", "#F5B70A", "#7C3AED"],
  saveState: "idle",
  lastSavedAt: null,
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
      selection: null,
      selectedZone: definition.zones[0]?.code ?? null,
      saveState: "saved",
      lastSavedAt: new Date(),
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
    get().setZonesMaterial([zone], material);
  },

  setZonesMaterial(zones, material) {
    get().seal();
    get().update((doc) => {
      const next = { ...doc.zones };
      let changed = false;
      for (const z of zones) {
        if (next[z] && next[z].material !== material) {
          next[z] = { ...next[z], material };
          changed = true;
        }
      }
      return changed ? { ...doc, zones: next } : doc;
    });
    get().seal();
  },

  setZonesPattern(zones, pattern, coalesceKey) {
    if (!coalesceKey) get().seal();
    get().update((doc) => {
      const next = { ...doc.zones };
      for (const z of zones) {
        const style = next[z];
        if (!style) continue;
        if (pattern) next[z] = { ...style, pattern };
        else {
          const { pattern: _removed, ...rest } = style;
          next[z] = rest;
        }
      }
      return { ...doc, zones: next };
    }, coalesceKey);
    if (!coalesceKey) get().seal();
  },

  addLayer(layer) {
    get().seal();
    get().update((doc) => ({ ...doc, layers: [...doc.layers, layer] }));
    set({ selection: { kind: "layer", id: layer.id }, selectedZone: layer.zone });
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
    const sel = get().selection;
    if (sel?.kind === "layer" && sel.id === id) set({ selection: null });
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
    const layers = get().doc?.layers ?? [];
    const i = layers.findIndex((l) => l.id === id);
    if (i < 0) return;
    get().moveLayerTo(id, direction === "up" ? i + 1 : i - 1);
  },

  moveLayerTo(id, index) {
    get().seal();
    get().update((doc) => {
      const from = doc.layers.findIndex((l) => l.id === id);
      const to = Math.max(0, Math.min(doc.layers.length - 1, index));
      if (from < 0 || from === to) return doc;
      const layers = [...doc.layers];
      const [moved] = layers.splice(from, 1);
      layers.splice(to, 0, moved!);
      return { ...doc, layers };
    });
  },

  select(selection) {
    history.seal();
    const layer =
      selection?.kind === "layer"
        ? get().doc?.layers.find((l) => l.id === selection.id)
        : undefined;
    set({
      selection,
      ...(layer ? { selectedZone: layer.zone } : {}),
      ...(selection ? { inspectorOpen: true } : {}),
    });
  },
  selectZone(zone) {
    history.seal();
    set({ selectedZone: zone });
  },
  setHoveredZone(zone) {
    if (get().hoveredZone !== zone) set({ hoveredZone: zone });
  },
  openRail(item) {
    set((s) => ({
      rail: item,
      libraryOpen: s.rail === item ? !s.libraryOpen : true,
      ...(item === "design" && s.rail !== "design" ? { libraryTab: "models" as const } : {}),
      ...(item === "textures" ? { libraryTab: "fabrics" as const } : {}),
    }));
  },
  setLibraryOpen(libraryOpen) {
    set({ libraryOpen });
  },
  setLibraryTab(libraryTab) {
    set({ libraryTab });
  },
  setInspectorOpen(inspectorOpen) {
    set({ inspectorOpen });
  },
  setViewMode(viewMode) {
    set({ viewMode });
  },
  setTool(tool) {
    set({ tool });
  },
  setPreview(preview) {
    set({ preview, hoveredZone: null });
  },
  setLighting(lighting) {
    set({ lighting });
  },
  setShowPodium(showPodium) {
    set({ showPodium });
  },
  setDragging(dragging) {
    set({ dragging });
  },
  setActiveView(activeView) {
    if (get().activeView !== activeView) set({ activeView });
  },
  pushRecentColor(color) {
    const c = color.toUpperCase();
    set((s) => ({ recentColors: [c, ...s.recentColors.filter((x) => x !== c)].slice(0, 8) }));
  },
  setSaveState(saveState) {
    set(saveState === "saved" ? { saveState, lastSavedAt: new Date() } : { saveState });
  },
}));

function keepSelection(s: StudioState, doc: DesignDocument) {
  return s.selection?.kind === "layer" &&
    !doc.layers.some((l) => l.id === (s.selection as { id: string }).id)
    ? { selection: null }
    : {};
}

/** Calque sélectionné (sélecteur dérivé). */
export function useSelectedLayer(): Layer | undefined {
  return useStudio((s) =>
    s.selection?.kind === "layer"
      ? s.doc?.layers.find((l) => l.id === (s.selection as { id: string }).id)
      : undefined,
  );
}

export function selectedLayerId(): string | null {
  const sel = useStudio.getState().selection;
  return sel?.kind === "layer" ? sel.id : null;
}
