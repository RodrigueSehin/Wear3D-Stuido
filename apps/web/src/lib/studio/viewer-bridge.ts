/**
 * Pont entre l'interface (barres, menus) et le viewer 3D chargé à la demande.
 * Le viewport enregistre ses fonctions ici à son montage.
 */
import type { ViewPreset } from "@wear3d/garment-engine";
import type { GarmentViewerHandle } from "@wear3d/garment-engine/react";

export interface ViewerBridge {
  viewer: GarmentViewerHandle | null;
  /** Rendu HD : atlas 4096 px recomposé, capture 3840 px. */
  renderHd: (() => Promise<Blob>) | null;
}

export const viewerBridge: ViewerBridge = { viewer: null, renderHd: null };

export function setView(view: ViewPreset): void {
  viewerBridge.viewer?.setView(view);
}

export type ExportFormat = "png" | "jpg";

/** Capture du rendu courant, au format demandé. */
export async function captureImage(format: ExportFormat, hd = false): Promise<Blob> {
  const png =
    hd && viewerBridge.renderHd
      ? await viewerBridge.renderHd()
      : await (viewerBridge.viewer?.capture(2048) ??
          Promise.reject(new Error("Vue 3D indisponible")));
  if (format === "png") return png;
  // JPG : fond blanc (pas de transparence).
  const bitmap = await createImageBitmap(png);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export JPG impossible"))),
      "image/jpeg",
      0.92,
    ),
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
