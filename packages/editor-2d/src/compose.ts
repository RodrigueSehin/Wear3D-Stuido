/**
 * Composition de l'atlas UV (CDC §4.3) : couleurs de zone, puis calques dans l'ordre.
 * Une seule texture pour le studio et l'export → rendu identique.
 *
 * Fonctionne avec tout contexte compatible Canvas 2D (DOM, OffscreenCanvas).
 */
import type { DesignDocument, Layer } from "@wear3d/design-schema";
import { layerSizePx, numberFontPx, zoneRectPx, type PxRect, type ZoneRect } from "./geometry";

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface ImageSource {
  image: CanvasImageSource;
  width: number;
  height: number;
}

export interface ComposeOptions {
  atlasSize: number;
  zones: readonly ZoneRect[];
  /** Image chargée pour un assetId (undefined = pas encore prête). */
  resolveImage: (assetId: string) => ImageSource | undefined;
  /** Famille CSS d'une police du catalogue (ex. "anton" → "'Anton', sans-serif"). */
  resolveFont: (fontKey: string) => string;
  /** Famille CSS d'un style de numéro. */
  resolveNumberFont: (style: string) => string;
  /** Couleur hors des zones (bords d'îles). */
  background?: string;
  /** Contour de surbrillance d'une zone (studio). */
  highlightZone?: string;
}

export function composeAtlas(ctx: Ctx2D, doc: DesignDocument, opts: ComposeOptions): void {
  const { atlasSize: size } = opts;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = opts.background ?? "#808080";
  ctx.fillRect(0, 0, size, size);

  const rects = new Map<string, PxRect>();
  for (const zone of opts.zones) {
    const px = zoneRectPx(zone, size);
    rects.set(zone.code, px);
    const style = doc.zones[zone.code];
    ctx.fillStyle = style?.color ?? "#FFFFFF";
    // Léger débord pour éviter les liserés au filtrage (mipmaps).
    ctx.fillRect(px.x - 4, px.y - 4, px.w + 8, px.h + 8);
  }

  for (const layer of doc.layers) {
    if (!layer.visible) continue;
    const px = rects.get(layer.zone);
    if (!px) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px.x, px.y, px.w, px.h);
    ctx.clip();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(px.x + layer.transform.x * px.w, px.y + layer.transform.y * px.h);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);
    drawLayer(ctx, layer, px, opts);
    ctx.restore();
  }

  if (opts.highlightZone) {
    const px = rects.get(opts.highlightZone);
    if (px) {
      ctx.strokeStyle = "rgba(31, 94, 255, 0.9)";
      ctx.lineWidth = Math.max(2, size / 512);
      ctx.setLineDash([size / 128, size / 256]);
      ctx.strokeRect(px.x + 2, px.y + 2, px.w - 4, px.h - 4);
    }
  }
  ctx.restore();
}

function drawLayer(ctx: Ctx2D, layer: Layer, zonePx: PxRect, opts: ComposeOptions): void {
  switch (layer.type) {
    case "text": {
      const { text } = layer;
      const fontPx = text.size * zonePx.h;
      const maxWidth = layer.transform.w * zonePx.w;
      ctx.font = `${text.weight} ${fontPx}px ${opts.resolveFont(text.font)}`;
      setLetterSpacing(ctx, text.letterSpacing * fontPx);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (text.stroke && text.stroke.width > 0) {
        ctx.lineJoin = "round";
        ctx.strokeStyle = text.stroke.color;
        ctx.lineWidth = text.stroke.width * zonePx.h * 2;
        ctx.strokeText(text.value, 0, 0, maxWidth);
      }
      ctx.fillStyle = text.color;
      ctx.fillText(text.value, 0, 0, maxWidth);
      setLetterSpacing(ctx, 0);
      return;
    }
    case "number": {
      const { number } = layer;
      const boxW = layer.transform.w * zonePx.w;
      const fontPx = numberFontPx(boxW);
      ctx.font = `700 ${fontPx}px ${opts.resolveNumberFont(number.style)}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (number.stroke && number.stroke.width > 0) {
        ctx.lineJoin = "round";
        ctx.strokeStyle = number.stroke.color;
        ctx.lineWidth = number.stroke.width * zonePx.h * 2;
        ctx.strokeText(number.value, 0, 0, boxW);
      }
      ctx.fillStyle = number.color;
      ctx.fillText(number.value, 0, 0, boxW);
      return;
    }
    case "image": {
      const src = opts.resolveImage(layer.assetId);
      if (!src) return;
      const { w, h } = layerSizePx(layer, zonePx, () => src.width / src.height);
      ctx.drawImage(src.image, -w / 2, -h / 2, w, h);
      return;
    }
  }
}

function setLetterSpacing(ctx: Ctx2D, px: number): void {
  // Propriété récente (Chrome 99+, Safari 17+, Firefox 115+) : ignorée ailleurs.
  if ("letterSpacing" in ctx) (ctx as { letterSpacing: string }).letterSpacing = `${px}px`;
}
