/**
 * Composition de l'atlas UV (CDC §4.3) : couleur de base et motif de chaque zone,
 * puis calques dans l'ordre. Une seule texture pour le studio et l'export.
 *
 * Fonctionne avec tout contexte compatible Canvas 2D (DOM, OffscreenCanvas).
 */
import type { BlendMode, DesignDocument, Layer, Pattern, TextLayer } from "@wear3d/design-schema";
import {
  layerSizePx,
  naturalSizePx,
  numberFontPx,
  zoneRectPx,
  type PxRect,
  type ZoneRect,
} from "./geometry";

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
  /** Tuile de motif dans la couleur demandée (motifs intégrés ou importés). */
  resolvePattern?: (assetId: string, color: string) => ImageSource | undefined;
  /** Famille CSS d'une police du catalogue (ex. "anton" → "'Anton', sans-serif"). */
  resolveFont: (fontKey: string) => string;
  /** Famille CSS d'un style de numéro. */
  resolveNumberFont: (style: string) => string;
  /** Couleur hors des zones (bords d'îles). */
  background?: string;
  /** Bords de manche du modèle (bande au poignet). */
  cuffs?: { zones: readonly string[]; edge: "top" | "bottom" };
  /** Crée un canvas de travail (contours d'images). Absent = contour d'image ignoré. */
  createCanvas?: (w: number, h: number) => HTMLCanvasElement | OffscreenCanvas;
}

const COMPOSITE: Record<BlendMode, GlobalCompositeOperation> = {
  normal: "source-over",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
  darken: "darken",
  lighten: "lighten",
};

export function composeAtlas(ctx: Ctx2D, doc: DesignDocument, opts: ComposeOptions): void {
  const { atlasSize: size } = opts;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
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
    if (style?.pattern) drawPattern(ctx, style.pattern, px, opts);
  }

  // Bords de manche : bande de finition au poignet, au-dessus du motif, sous les calques.
  const cuff = doc.trims?.cuffs;
  if (cuff?.enabled && opts.cuffs) {
    for (const code of opts.cuffs.zones) {
      const px = rects.get(code);
      if (px) drawCuff(ctx, px, cuff, opts.cuffs.edge);
    }
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
    ctx.globalCompositeOperation = COMPOSITE[layer.blendMode] ?? "source-over";
    ctx.translate(px.x + layer.transform.x * px.w, px.y + layer.transform.y * px.h);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);
    drawLayer(ctx, layer, px, opts);
    ctx.restore();
  }
  ctx.restore();
}

function drawCuff(
  ctx: Ctx2D,
  px: PxRect,
  cuff: NonNullable<NonNullable<DesignDocument["trims"]>["cuffs"]>,
  edge: "top" | "bottom",
): void {
  const h = cuff.width * px.h;
  // Déborde de la zone (comme la couleur de fond) pour éviter tout liseré au filtrage.
  const y = edge === "bottom" ? px.y + px.h - h : px.y - 4;
  ctx.save();
  ctx.fillStyle = cuff.color;
  ctx.fillRect(px.x - 4, y, px.w + 8, h + 4);
  if (cuff.stripes > 0) {
    // Rayures fines régulièrement espacées dans la bande.
    const sh = Math.max(2, h * 0.12);
    ctx.fillStyle = cuff.stripeColor;
    for (let i = 1; i <= cuff.stripes; i++) {
      const sy =
        (edge === "bottom" ? px.y + px.h - h : px.y) + (h * i) / (cuff.stripes + 1) - sh / 2;
      ctx.fillRect(px.x - 4, sy, px.w + 8, sh);
    }
  }
  ctx.restore();
}

/** Motif de zone : répété (tuile) ou placé (une fois, couvrant la zone). */
function drawPattern(ctx: Ctx2D, pattern: Pattern, px: PxRect, opts: ComposeOptions): void {
  const tile =
    opts.resolvePattern?.(pattern.assetId, pattern.color) ?? opts.resolveImage(pattern.assetId);
  if (!tile) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px.x - 4, px.y - 4, px.w + 8, px.h + 8);
  ctx.clip();
  ctx.globalAlpha = pattern.opacity;
  ctx.globalCompositeOperation = COMPOSITE[pattern.blendMode ?? "normal"] ?? "source-over";
  const cx = px.x + px.w / 2 + pattern.offsetX * px.w;
  const cy = px.y + px.h / 2 + pattern.offsetY * px.h;
  ctx.translate(cx, cy);
  ctx.rotate((pattern.rotation * Math.PI) / 180);
  if (pattern.mode === "placed") {
    // Couvre la zone (diagonale) à l'échelle 1.
    const cover = Math.hypot(px.w, px.h) * pattern.scale;
    const ratio = tile.width / tile.height;
    const w = ratio >= 1 ? cover : cover * ratio;
    const h = ratio >= 1 ? cover / ratio : cover;
    ctx.drawImage(tile.image, -w / 2, -h / 2, w, h);
  } else {
    const fill = ctx.createPattern(tile.image, "repeat");
    if (fill) {
      // Une tuile = 1/4 de la largeur de zone à l'échelle 1.
      const k = ((px.w / 4) * pattern.scale) / tile.width;
      ctx.scale(k, k);
      ctx.fillStyle = fill;
      const r = Math.hypot(px.w, px.h) / k;
      ctx.fillRect(-r, -r, 2 * r, 2 * r);
    }
  }
  ctx.restore();
}

function applyShadow(ctx: Ctx2D, color: string, blur: number, dx: number, dy: number): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = dx;
  ctx.shadowOffsetY = dy;
}

function clearShadow(ctx: Ctx2D): void {
  ctx.shadowColor = "rgba(0,0,0,0)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawLayer(ctx: Ctx2D, layer: Layer, zonePx: PxRect, opts: ComposeOptions): void {
  const { transform: t, effects } = layer;
  const aspect = (id: string) => {
    const src = opts.resolveImage(id);
    return src ? src.width / src.height : undefined;
  };
  const natural = naturalSizePx(layer, zonePx, aspect);
  const shown = layerSizePx(layer, zonePx, aspect);
  // Hauteur libre et symétries : mise à l'échelle autour du centre.
  ctx.scale(t.flipX ? -1 : 1, (t.flipY ? -1 : 1) * (natural.h > 0 ? shown.h / natural.h : 1));

  const H = zonePx.h;
  const passes: (() => void)[] = [];
  if (effects.glow.enabled) {
    passes.push(() => applyShadow(ctx, effects.glow.color, effects.glow.blur * H, 0, 0));
  }
  if (effects.shadow.enabled) {
    const o = effects.shadow.offset * H;
    passes.push(() =>
      applyShadow(ctx, hexAlpha(effects.shadow.color, 0.55), effects.shadow.blur * H, o, o),
    );
  }

  // Les effets d'ombre et de lueur sont dessinés en passes successives sous l'élément.
  for (const pass of passes) {
    ctx.save();
    pass();
    drawContent(ctx, layer, zonePx, opts, natural, true);
    ctx.restore();
  }
  clearShadow(ctx);
  drawContent(ctx, layer, zonePx, opts, natural, false);
}

function drawContent(
  ctx: Ctx2D,
  layer: Layer,
  zonePx: PxRect,
  opts: ComposeOptions,
  natural: { w: number; h: number },
  effectPass: boolean,
): void {
  const outline = layer.effects.outline;
  const H = zonePx.h;
  switch (layer.type) {
    case "text": {
      drawText(ctx, layer, H, opts, natural, outline);
      return;
    }
    case "number": {
      const { number } = layer;
      const boxW = natural.w;
      ctx.font = `700 ${numberFontPx(boxW)}px ${opts.resolveNumberFont(number.style)}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      strokeText(ctx, number.value, 0, 0, boxW, [
        outline.enabled
          ? {
              color: outline.color,
              width: outline.width * H * 2 + (number.stroke?.width ?? 0) * H * 4,
            }
          : null,
        number.stroke && number.stroke.width > 0
          ? { color: number.stroke.color, width: number.stroke.width * H * 2 }
          : null,
      ]);
      ctx.fillStyle = number.color;
      ctx.fillText(number.value, 0, 0, boxW);
      return;
    }
    case "image": {
      const src = opts.resolveImage(layer.assetId);
      if (!src) return;
      const { w, h } = natural;
      if (outline.enabled && !effectPass && opts.createCanvas) {
        drawImageOutline(ctx, src, w, h, outline.color, outline.width * H, opts.createCanvas);
      }
      const tinted =
        layer.tint && opts.createCanvas
          ? tintedImage(src, w, h, layer.tint, opts.createCanvas)
          : null;
      ctx.drawImage(tinted ?? src.image, -w / 2, -h / 2, w, h);
      return;
    }
  }
}

function strokeText(
  ctx: Ctx2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number | undefined,
  strokes: ({ color: string; width: number } | null)[],
): void {
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (!s || s.width <= 0) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.strokeText(value, x, y, maxWidth);
  }
}

function textGradient(
  ctx: Ctx2D,
  g: NonNullable<TextLayer["text"]["gradient"]>,
  w: number,
  h: number,
): CanvasGradient {
  const a = (g.angle * Math.PI) / 180;
  const vx = Math.cos(a);
  const vy = Math.sin(a);
  const r = (Math.abs(w * vx) + Math.abs(h * vy)) / 2;
  const grad = ctx.createLinearGradient(-vx * r, -vy * r, vx * r, vy * r);
  grad.addColorStop(0, g.from);
  grad.addColorStop(1, g.to);
  return grad;
}

/**
 * Texte éditable : toujours dessiné depuis les données du calque (jamais converti en image),
 * avec italique, souligné, alignement, interligne, dégradé, relief, angles arrondis et arc.
 */
function drawText(
  ctx: Ctx2D,
  layer: TextLayer,
  H: number,
  opts: ComposeOptions,
  natural: { w: number; h: number },
  outline: Layer["effects"]["outline"],
): void {
  const { text } = layer;
  const fontPx = text.size * H;
  const maxW = natural.w;
  const lineStep = fontPx * 1.15 * text.lineHeight;
  const lines = text.value.split("\n");
  const arcRad = (Math.abs(text.arc) * Math.PI) / 180;
  ctx.font = `${text.italic ? "italic " : ""}${text.weight} ${fontPx}px ${opts.resolveFont(text.font)}`;
  ctx.textBaseline = "middle";
  const fill: string | CanvasGradient = text.gradient
    ? textGradient(ctx, text.gradient, maxW, natural.h)
    : text.color;
  const strokes = [
    outline.enabled
      ? { color: outline.color, width: outline.width * H * 2 + (text.stroke?.width ?? 0) * H * 4 }
      : null,
    text.stroke && text.stroke.width > 0
      ? { color: text.stroke.color, width: text.stroke.width * H * 2 }
      : null,
  ];
  const d = fontPx * 0.03;

  const paint = (s: string, x: number, y: number, maxWidth: number | undefined) => {
    strokeText(ctx, s, x, y, maxWidth, strokes);
    if (text.rounded) {
      ctx.lineJoin = "round";
      ctx.strokeStyle = fill;
      ctx.lineWidth = fontPx * 0.07;
      ctx.strokeText(s, x, y, maxWidth);
    }
    if (text.relief) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillText(s, x + d, y + d, maxWidth);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText(s, x - d, y - d, maxWidth);
    }
    ctx.fillStyle = fill;
    ctx.fillText(s, x, y, maxWidth);
  };

  lines.forEach((line, i) => {
    const y = (i - (lines.length - 1) / 2) * lineStep;
    if (arcRad > 0.001 && line.length > 0) {
      // Texte arqué : chaque lettre posée sur un cercle, orientée selon la tangente.
      setLetterSpacing(ctx, 0);
      ctx.textAlign = "center";
      const spacing = text.letterSpacing * fontPx;
      const adv = [...line].map((ch) => ctx.measureText(ch).width + spacing);
      const total = adv.reduce((a, b) => a + b, 0);
      const R = total / arcRad;
      const chord = 2 * R * Math.sin(Math.min(arcRad, Math.PI) / 2);
      const k = Math.min(1, maxW / Math.max(1, chord));
      const sign = text.arc > 0 ? 1 : -1;
      let s = -total / 2;
      [...line].forEach((ch, n) => {
        const a = adv[n]!;
        const th = (s + a / 2) / R;
        ctx.save();
        ctx.translate(R * Math.sin(th) * k, y + sign * R * (1 - Math.cos(th)) * k);
        ctx.rotate(sign * th);
        ctx.scale(k, k);
        paint(ch, 0, 0, undefined);
        ctx.restore();
        s += a;
      });
      return;
    }
    setLetterSpacing(ctx, text.letterSpacing * fontPx);
    ctx.textAlign = text.align;
    const x = text.align === "left" ? -maxW / 2 : text.align === "right" ? maxW / 2 : 0;
    paint(line, x, y, maxW);
    if (text.underline && line.length > 0) {
      const w = Math.min(ctx.measureText(line).width, maxW);
      const x0 = text.align === "left" ? x : text.align === "right" ? x - w : x - w / 2;
      ctx.fillStyle = fill;
      ctx.fillRect(x0, y + fontPx * 0.4, w, Math.max(1, fontPx * 0.06));
    }
    setLetterSpacing(ctx, 0);
  });
}

/** Image recolorée d'une seule couleur (silhouette), ou null si impossible. */
function tintedImage(
  src: ImageSource,
  w: number,
  h: number,
  color: string,
  createCanvas: NonNullable<ComposeOptions["createCanvas"]>,
): CanvasImageSource | null {
  const cw = Math.max(1, Math.ceil(w));
  const ch = Math.max(1, Math.ceil(h));
  const canvas = createCanvas(cw, ch);
  const c = canvas.getContext("2d") as Ctx2D | null;
  if (!c) return null;
  c.drawImage(src.image, 0, 0, cw, ch);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = color;
  c.fillRect(0, 0, cw, ch);
  return canvas;
}

/** Contour d'image : silhouette colorée dessinée autour (8 directions). */
function drawImageOutline(
  ctx: Ctx2D,
  src: ImageSource,
  w: number,
  h: number,
  color: string,
  width: number,
  createCanvas: NonNullable<ComposeOptions["createCanvas"]>,
): void {
  if (width <= 0) return;
  const cw = Math.max(1, Math.ceil(w));
  const ch = Math.max(1, Math.ceil(h));
  const canvas = createCanvas(cw, ch);
  const c = canvas.getContext("2d") as Ctx2D | null;
  if (!c) return;
  c.drawImage(src.image, 0, 0, cw, ch);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = color;
  c.fillRect(0, 0, cw, ch);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.drawImage(canvas, -w / 2 + Math.cos(a) * width, -h / 2 + Math.sin(a) * width, w, h);
  }
}

function hexAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function setLetterSpacing(ctx: Ctx2D, px: number): void {
  // Propriété récente (Chrome 99+, Safari 17+, Firefox 115+) : ignorée ailleurs.
  if ("letterSpacing" in ctx) (ctx as { letterSpacing: string }).letterSpacing = `${px}px`;
}
