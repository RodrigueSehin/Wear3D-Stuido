"use client";

import {
  createNumberLayer,
  createTextLayer,
  layerLabel,
  PREVIEW_PLAYER,
  resolveTokens,
  type Layer,
} from "@wear3d/design-schema";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wear3d/ui";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Hash,
  ImageIcon,
  Lock,
  LockOpen,
  MoreHorizontal,
  MoveRight,
  Plus,
  Shapes,
  Trash2,
  Type,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getCachedImage } from "@/lib/studio/assets";
import { useAtlas } from "@/lib/studio/atlas";
import { resolveNumberFont, STUDIO_FONTS, type StudioFontKey } from "@/lib/studio/fonts";
import { patternPreview } from "@/lib/studio/patterns";
import { useSceneBackdrop } from "@/lib/studio/scene-backdrop";
import { effectiveColors, MOCKUPS } from "@/lib/studio/mockups";
import { sceneById } from "@/lib/studio/scenes";
import { moveLayerToZone, zoneAccepts } from "@/lib/studio/interaction";
import { placementZone, revealZone } from "@/lib/studio/placement";
import { PatternLayers } from "./pattern-panels";
import { contrastColor } from "@/lib/studio/textures";
import { patternZones, useStudio } from "@/lib/studio/store";
import { PanelCard, PanelTitle } from "./controls";

function Thumb({ layer }: { layer: Layer }) {
  const box =
    "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/5 bg-white";
  if (layer.type === "image") {
    const src = getCachedImage(layer.assetId);
    return (
      <span className={box}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(src.image as HTMLImageElement).src}
            alt=""
            className="max-h-8 max-w-8 object-contain"
          />
        ) : (
          <ImageIcon className="size-4" aria-hidden />
        )}
      </span>
    );
  }
  if (layer.type === "number") {
    return (
      <span
        className={cn(box, "text-[22px] leading-none text-[#0b1530]")}
        style={{ fontFamily: resolveNumberFont(layer.number.style) }}
      >
        {resolveTokens(layer.number.value, PREVIEW_PLAYER) || "#"}
      </span>
    );
  }
  const font = STUDIO_FONTS[layer.text.font as StudioFontKey] ?? STUDIO_FONTS.anton;
  return (
    <span className={cn(box, "text-[11px] font-bold leading-none text-[#0b1530]", font.className)}>
      {(resolveTokens(layer.text.value, PREVIEW_PLAYER) || "T").slice(0, 4)}
    </span>
  );
}

function RowMenu({ layer }: { layer: Layer }) {
  const zones = useStudio((st) => st.definition?.zones ?? []);
  // Zones qui acceptent ce calque, hors sa zone actuelle (devant, dos, manches, col).
  const targets = zones.filter((z) => z.code !== layer.zone && zoneAccepts(z.code, layer));
  const { duplicateLayer, removeLayer, reorderLayer, updateLayer, seal } = useStudio.getState();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions du calque ${layerLabel(layer)}`}
          className="rounded-md p-1 text-[#0b1530] hover:bg-white"
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => duplicateLayer(layer.id)}>
          <Copy /> Dupliquer
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => reorderLayer(layer.id, "up")}>
          <ArrowUp /> Monter
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => reorderLayer(layer.id, "down")}>
          <ArrowDown /> Descendre
        </DropdownMenuItem>
        {targets.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
            {targets.map((z) => (
              <DropdownMenuItem key={z.code} onSelect={() => moveLayerToZone(layer.id, z.code)}>
                <MoveRight /> {z.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuItem
          onSelect={() => {
            seal();
            updateLayer(layer.id, (l) => ({ ...l, locked: !l.locked }), `lock:${layer.id}`);
            seal();
          }}
        >
          {layer.locked ? <LockOpen /> : <Lock />} {layer.locked ? "Déverrouiller" : "Verrouiller"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => removeLayer(layer.id)}>
          <Trash2 /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const row = "group flex h-[54px] items-center gap-2 rounded-xl px-2 transition";

/** Panneau Calques (maquette Studio) : ordre par glisser-déposer, visibilité, actions. */
/** Calques : ceux du design, ou les pièces en vue Patron. */
export function LayersPanel() {
  const patternMode = useStudio((s) => s.viewMode === "pattern");
  return patternMode ? <PatternLayers /> : <DesignLayersPanel />;
}

function DesignLayersPanel() {
  // Rafraîchit les vignettes quand les images finissent de charger (l'atlas est recomposé).
  useAtlas((s) => s.version);
  const doc = useStudio((s) => s.doc);
  const selection = useStudio((s) => s.selection);
  const definition = useStudio((s) => s.definition);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const layers = doc?.layers ?? [];
  const ordered = [...layers].reverse(); // le plus haut en premier
  const patterned = patternZones(doc);
  const scene = doc?.scene;
  const viewMode = useStudio((st) => st.viewMode);
  const mockup = doc?.mockup;
  const mockupColors = mockup ? effectiveColors(mockup) : null;
  const sceneThumb = useSceneBackdrop(scene?.id);
  const firstPattern = patterned[0] ? doc?.zones[patterned[0]]?.pattern : undefined;
  const baseColor = doc?.zones[definition?.zones[0]?.code ?? ""]?.color ?? "#1D4ED8";
  const patternImg = useMemo(
    () => (firstPattern ? patternPreview(firstPattern.assetId, firstPattern.color, baseColor) : ""),
    [firstPattern, baseColor],
  );
  const { select, updateLayer, seal, addLayer, openRail, setLibraryTab, moveLayerTo } =
    useStudio.getState();

  const toggleVisible = (layer: Layer) => {
    seal();
    updateLayer(layer.id, (l) => ({ ...l, visible: !l.visible }), `visible:${layer.id}`);
    seal();
  };

  /** Ajoute un calque sur le côté visible du vêtement, puis le montre. */
  const addVisible = (make: (zone: string) => Parameters<typeof addLayer>[0]) => {
    const layer = make(placementZone("text"));
    addLayer(layer);
    revealZone(layer.zone);
  };

  return (
    <PanelCard className="w-[272px] shrink-0">
      <PanelTitle
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Ajouter un calque"
                className="hover:bg-surface-muted rounded-md p-1 text-[#0b1530]"
              >
                <Plus className="size-6" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  addVisible((zone) => ({ ...createTextLayer(zone, "WEAR3D"), name: undefined }))
                }
              >
                <Type /> Texte
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  addVisible((zone) => {
                    const body = zone.startsWith("BODY") ? zone : "BODY_FRONT";
                    const layer = createNumberLayer(body, "10");
                    const fabric = useStudio.getState().doc?.zones[body]?.color ?? "#FFFFFF";
                    layer.number.color = contrastColor(fabric);
                    return layer;
                  })
                }
              >
                <Hash /> Numéro
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openRail("logos")}>
                <ImageIcon /> Logo ou image
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  openRail("design");
                  setLibraryTab("patterns");
                }}
              >
                <Shapes /> Motif graphique
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {viewMode === "2d" ? "Calques (2D)" : "Calques"}
      </PanelTitle>

      <ul
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-4"
        onDragLeave={() => setOverIndex(null)}
      >
        {scene && (
          <li
            className={cn(
              row,
              selection?.kind === "scene" ? "bg-[#e3ecff]" : "hover:bg-surface-muted",
            )}
          >
            <GripVertical className="size-4 shrink-0 text-[#0b1530]/20" aria-hidden />
            <Eye className="size-5 text-[#0b1530]/40" aria-hidden />
            <button
              type="button"
              onClick={() => select({ kind: "scene" })}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#0a1638]">
                {sceneThumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sceneThumb} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="truncate text-[15px] text-[#0b1530]">
                Scène : {sceneById(scene.id)?.label ?? "importée"}
              </span>
            </button>
            <Lock className="mr-1.5 size-4 text-[#0b1530]/40" aria-label="Décor de présentation" />
          </li>
        )}

        {ordered.map((layer, i) => {
          const selected = selection?.kind === "layer" && selection.id === layer.id;
          const docIndex = layers.length - 1 - i;
          return (
            <li
              key={layer.id}
              draggable
              onDragStart={(e) => {
                setDragId(layer.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveLayerTo(dragId, docIndex);
                setDragId(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverIndex(null);
              }}
              className={cn(
                row,
                selected ? "bg-[#e3ecff]" : "hover:bg-surface-muted",
                overIndex === i && dragId !== layer.id && "ring-action ring-2",
                dragId === layer.id && "opacity-50",
              )}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-[#0b1530]/50" aria-hidden />
              <button
                type="button"
                onClick={() => toggleVisible(layer)}
                aria-label={layer.visible ? "Masquer" : "Afficher"}
                className="rounded p-0.5 text-[#0b1530] hover:bg-white"
              >
                {layer.visible ? (
                  <Eye className="size-5" aria-hidden />
                ) : (
                  <EyeOff className="size-5 opacity-50" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => select({ kind: "layer", id: layer.id })}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <Thumb layer={layer} />
                <span
                  className={cn(
                    "truncate text-[15px] text-[#0b1530]",
                    !layer.visible && "opacity-50",
                  )}
                >
                  {layerLabel(layer)}
                </span>
                {layer.locked && <Lock className="size-3.5 shrink-0 opacity-60" aria-hidden />}
              </button>
              <RowMenu layer={layer} />
            </li>
          );
        })}

        {mockup && (
          <li
            className={cn(
              row,
              selection?.kind === "mockup" ? "bg-[#e3ecff]" : "hover:bg-surface-muted",
            )}
          >
            <GripVertical className="size-4 shrink-0 text-[#0b1530]/20" aria-hidden />
            <Eye className="size-5 text-[#0b1530]/40" aria-hidden />
            <button
              type="button"
              onClick={() => select({ kind: "mockup" })}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <span
                className="size-10 shrink-0 rounded-lg border border-black/5"
                style={{
                  background: `linear-gradient(135deg, ${mockupColors![0]} 55%, ${mockupColors![1]} 55%, ${mockupColors![1]} 72%, ${mockupColors![2]} 72%)`,
                }}
              />
              <span className="truncate text-[15px] text-[#0b1530]">
                Maquette ({MOCKUPS.find((m) => m.id === mockup.id)?.label ?? "importée"})
              </span>
            </button>
            <Lock className="mr-1.5 size-4 text-[#0b1530]/40" aria-label="Maquette de base" />
          </li>
        )}

        {patterned.length > 0 && (
          <li
            className={cn(
              row,
              selection?.kind === "pattern" ? "bg-[#e3ecff]" : "hover:bg-surface-muted",
            )}
          >
            <GripVertical className="size-4 shrink-0 text-[#0b1530]/20" aria-hidden />
            <button
              type="button"
              aria-label={
                firstPattern && firstPattern.opacity > 0 ? "Masquer le motif" : "Afficher le motif"
              }
              onClick={() => {
                const s = useStudio.getState();
                for (const z of patterned) {
                  const p = s.doc?.zones[z]?.pattern;
                  if (p) s.setZonesPattern([z], { ...p, opacity: p.opacity > 0 ? 0 : 0.85 });
                }
              }}
              className="rounded p-0.5 text-[#0b1530] hover:bg-white"
            >
              {firstPattern && firstPattern.opacity > 0 ? (
                <Eye className="size-5" aria-hidden />
              ) : (
                <EyeOff className="size-5 opacity-50" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => select({ kind: "pattern" })}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={patternImg} alt="" className="size-10 rounded-lg border border-black/5" />
              <span className="truncate text-[15px] text-[#0b1530]">Motif graphique</span>
            </button>
            <span className="w-7" />
          </li>
        )}

        <li
          className={cn(
            row,
            selection?.kind === "base" ? "bg-[#e3ecff]" : "hover:bg-surface-muted",
          )}
        >
          <GripVertical className="size-4 shrink-0 text-[#0b1530]/20" aria-hidden />
          <Eye className="size-5 text-[#0b1530]/40" aria-hidden />
          <button
            type="button"
            onClick={() => select({ kind: "base" })}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <span
              className="size-10 rounded-lg border border-black/5"
              style={{ background: baseColor }}
            />
            <span className="truncate text-[15px] text-[#0b1530]">Couleur de base</span>
          </button>
          <Lock className="mr-1.5 size-4 text-[#0b1530]/40" aria-label="Calque de fond" />
        </li>
      </ul>
    </PanelCard>
  );
}
