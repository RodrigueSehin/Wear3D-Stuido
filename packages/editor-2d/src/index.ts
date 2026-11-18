/**
 * @wear3d/editor-2d — composition de l'atlas par zone, géométrie des calques,
 * historique undo/redo (CDC §4.1, F-23 à F-27).
 *
 * Phase 1 : composition en Canvas 2D natif (même code en studio et en export).
 * La vue 2D à plat avec poignées de transformation (Konva) arrive en phase 2.
 */
export * from "./geometry";
export * from "./compose";
export * from "./history";
