"use client";

import { MATERIAL_CODES, type Grainline, type SewingPiece } from "@wear3d/design-schema";
import { FABRIC_NAMES } from "@wear3d/garment-engine";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@wear3d/ui";
import { ChevronDown, Download, Eye, EyeOff, FileBox, FileText, PenTool } from "lucide-react";
import { useMemo } from "react";
import {
  cutPlanLayout,
  exportGeometry,
  formatLength,
  GRAIN_LABELS,
  patternPdf,
  patternPlt,
  patternSvg,
  pieceSettings,
  pieceSize,
  availablePieces,
  sheetLayout,
  type PieceDef,
} from "@/lib/studio/sewing";
import { useStudio } from "@/lib/studio/store";
import { fabricSwatch } from "@/lib/studio/swatches";
import { downloadBlob, slugify } from "@/lib/studio/viewer-bridge";
import { ColorField, PanelCard, PanelTitle, Section, SelectBox } from "./controls";
import { CuffControls } from "./cuff-controls";

/** Met à jour les réglages de fabrication d'une pièce (une étape d'historique). */
function patchPiece(id: string, patch: Partial<SewingPiece>, coalesceKey?: string) {
  const s = useStudio.getState();
  if (!coalesceKey) s.seal();
  s.update((d) => {
    const sewing = d.sewing ?? { fabricWidth: 150, pieces: {} };
    const current = sewing.pieces[id] ?? { seam: 1, grain: "vertical", comment: "", hidden: false };
    return {
      ...d,
      sewing: { ...sewing, pieces: { ...sewing.pieces, [id]: { ...current, ...patch } } },
    };
  }, coalesceKey);
  if (!coalesceKey) s.seal();
}

/** Aperçu de pièce : couleur de la zone (ou de sa pièce unie). */
function PieceSwatch({ piece }: { piece: PieceDef }) {
  const color = useStudio((s) => s.doc?.zones[piece.colorZone]?.color ?? "#ffffff");
  const round = piece.id.startsWith("collar")
    ? "rounded-b-full"
    : piece.id === "cuff"
      ? "rounded-sm"
      : "rounded-md";
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-black/5 bg-white">
      <span
        className={cn(
          "block border border-black/10",
          round,
          piece.id === "cuff" || piece.id.startsWith("collar") ? "h-3 w-8" : "h-7 w-6",
        )}
        style={{ background: color }}
      />
    </span>
  );
}

/* ---------- Calques (Patron) ---------- */

export function PatternLayers() {
  const sewing = useStudio((s) => s.doc?.sewing);
  const definition = useStudio((s) => s.definition);
  const selected = useStudio((s) => s.selectedPiece);
  const row = "flex h-14 items-center gap-2 rounded-xl px-2 transition";
  return (
    <PanelCard className="w-[272px] shrink-0">
      <PanelTitle>Calques (Patron)</PanelTitle>
      <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-4">
        {availablePieces(definition).map((p) => {
          const st = pieceSettings(sewing, p);
          return (
            <li
              key={p.id}
              className={cn(row, selected === p.id ? "bg-[#e3ecff]" : "hover:bg-surface-muted")}
            >
              <button
                type="button"
                onClick={() => patchPiece(p.id, { hidden: !st.hidden })}
                aria-label={st.hidden ? `Afficher ${p.label}` : `Masquer ${p.label}`}
                className="rounded p-0.5 text-[#0b1530] hover:bg-white"
              >
                {st.hidden ? (
                  <EyeOff className="size-5 opacity-50" aria-hidden />
                ) : (
                  <Eye className="size-5" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => useStudio.getState().selectPiece(p.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <PieceSwatch piece={p} />
                <span
                  className={cn("truncate text-[15px] text-[#0b1530]", st.hidden && "opacity-50")}
                >
                  {p.label}
                  {st.cut > 1 ? ` (×${st.cut})` : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground px-4 pb-4 text-xs">
        Les logos, textes et motifs se modifient depuis les autres menus ; ils apparaissent sur les
        pièces et sur l&apos;aperçu 3D.
      </p>
    </PanelCard>
  );
}

/* ---------- Inspecteur de pièce ---------- */

const SEAMS = [0, 0.5, 0.7, 1, 1.5, 2];

export function PieceInspector() {
  const id = useStudio((s) => s.selectedPiece);
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const unit = useStudio((s) => s.patternUnit);
  const tab = useStudio((s) => s.patternTab);
  const recent = useStudio((s) => s.recentColors);
  const piece = availablePieces(definition).find((p) => p.id === id);
  const size = doc?.model.size ?? "L";
  const sewing = doc?.sewing;

  // Position dans la mise en page affichée (patron ou plan de coupe).
  const position = useMemo(() => {
    if (!piece) return null;
    const pieces = availablePieces(definition);
    const sheet =
      tab === "cutplan" ? cutPlanLayout(sewing, size, pieces) : sheetLayout(sewing, size, pieces);
    return sheet.placed.find((pl) => pl.piece.id === piece.id && pl.copy === 0) ?? null;
  }, [piece, tab, sewing, size, definition]);

  if (!piece || !doc) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-muted-foreground px-5 text-sm">
          Sélectionnez une pièce du patron pour voir ses dimensions et ses réglages de coupe.
        </p>
        <div className="mt-auto p-5">
          <ExportPatternButton />
        </div>
      </div>
    );
  }

  const st = pieceSettings(sewing, piece);
  const dims = pieceSize(piece, size);
  const zone = definition?.zones.find((z) => z.code === piece.colorZone);
  const material = doc.zones[piece.colorZone]?.material ?? "cotton";
  const color = doc.zones[piece.colorZone]?.color ?? "#FFFFFF";
  const s = useStudio.getState();
  const box =
    "border-border flex h-10 items-center justify-between gap-2 whitespace-nowrap rounded-lg border bg-white px-3 text-sm";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="flex items-center gap-3 px-5 pb-4">
          <PieceSwatch piece={piece} />
          <span className="truncate text-[17px] font-semibold text-[#0b1530]">{piece.label}</span>
        </div>

        <Section title="Dimensions">
          <div className="flex flex-col gap-2">
            <div className={box}>
              <span className="text-muted-foreground">Largeur</span>
              <span className="font-medium text-[#0b1530]">{formatLength(dims.w, unit)}</span>
            </div>
            <div className={box}>
              <span className="text-muted-foreground">Hauteur</span>
              <span className="font-medium text-[#0b1530]">{formatLength(dims.h, unit)}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Taille {size} — la gradation se règle dans « Tailles &amp; Gradation ».
          </p>
        </Section>

        {position && (
          <Section title="Position">
            <div className="flex flex-col gap-2">
              <div className={box}>
                <span className="text-muted-foreground">X</span>
                <span className="font-medium text-[#0b1530]">{formatLength(position.x, unit)}</span>
              </div>
              <div className={box}>
                <span className="text-muted-foreground">Y</span>
                <span className="font-medium text-[#0b1530]">{formatLength(position.y, unit)}</span>
              </div>
            </div>
          </Section>
        )}

        <Section title="Marges & Coupe">
          <span className="text-sm text-[#0b1530]">Marge de couture</span>
          <SelectBox
            ariaLabel="Marge de couture"
            value={String(st.seam)}
            onChange={(v) => patchPiece(piece.id, { seam: Number(v) })}
            options={SEAMS.map((m) => ({
              value: String(m),
              label: m === 0 ? "Aucune (coupe franche)" : `${m.toLocaleString("fr-FR")} cm`,
            }))}
          />
          <span className="text-sm text-[#0b1530]">Type de coupe</span>
          <SelectBox
            ariaLabel="Type de coupe"
            value={String(st.cut)}
            onChange={(v) => patchPiece(piece.id, { cut: Number(v) })}
            options={[
              { value: "1", label: "Couper 1 fois" },
              { value: "2", label: "Couper 2 fois (en miroir)" },
              { value: "3", label: "Couper 3 fois" },
              { value: "4", label: "Couper 4 fois" },
            ]}
          />
        </Section>

        <Section title="Propriétés">
          <span className="text-sm text-[#0b1530]">Tissu</span>
          <SelectBox
            ariaLabel="Tissu de la pièce"
            value={material}
            onChange={(v) => {
              if (zone?.allows.includes("material"))
                s.setZonesMaterial([piece.colorZone], v as (typeof MATERIAL_CODES)[number]);
            }}
            options={MATERIAL_CODES.filter((m) => definition?.materials.includes(m)).map((m) => ({
              value: m,
              label: `${FABRIC_NAMES[m].name} — ${FABRIC_NAMES[m].subtitle}`,
            }))}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fabricSwatch(material, color, 96)}
            alt=""
            className="h-8 w-full rounded-md object-cover"
          />
          {piece.id === "cuff" && (
            <div className="border-border rounded-xl border bg-white/60 p-3">
              <CuffControls title={false} />
            </div>
          )}
          {piece.id !== "cuff" && (
            <ColorField
              label="Couleur"
              value={color}
              recent={recent}
              onChange={(c) => s.setZoneColor(piece.colorZone, c, `color:${piece.colorZone}`)}
              onCommit={(c) => {
                s.pushRecentColor(c);
                s.seal();
              }}
            />
          )}
          {!piece.zone && piece.id !== "cuff" && (
            <p className="text-muted-foreground text-xs">
              Pièce unie : elle reprend la couleur et le tissu du col (zone partagée).
            </p>
          )}
          <span className="text-sm text-[#0b1530]">Droit-fil</span>
          <SelectBox
            ariaLabel="Droit-fil"
            value={st.grain}
            onChange={(v) => patchPiece(piece.id, { grain: v as Grainline })}
            options={Object.entries(GRAIN_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <span className="text-sm text-[#0b1530]">Commentaire</span>
          <textarea
            value={st.comment}
            maxLength={200}
            rows={2}
            placeholder={`${piece.label.replace(" (corps)", "")} – ${useStudio.getState().name}`}
            aria-label="Commentaire de la pièce"
            onChange={(e) =>
              patchPiece(piece.id, { comment: e.target.value }, `comment:${piece.id}`)
            }
            onBlur={() => s.seal()}
            className="border-border focus:border-action resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          />
        </Section>
      </div>
      <div className="border-border border-t p-4">
        <ExportPatternButton />
      </div>
    </div>
  );
}

/* ---------- Export du patron ---------- */

function ExportPatternButton() {
  const run = (format: "pdf" | "plt" | "svg") => {
    const s = useStudio.getState();
    if (!s.doc) return;
    const size = s.doc.model.size;
    // Fabrication : le plan de coupe (toutes les coupes, marges comprises) à l'échelle 1:1.
    const sheet = cutPlanLayout(s.doc.sewing, size, availablePieces(s.definition));
    const pieces = exportGeometry(sheet, s.doc.sewing, size);
    const base = `${slugify(s.name) || "wear3d"}-patron-${size}`;
    if (format === "pdf")
      downloadBlob(patternPdf(pieces, sheet.width, sheet.height), `${base}.pdf`);
    if (format === "svg")
      downloadBlob(
        new Blob([patternSvg(pieces, sheet.width, sheet.height)], { type: "image/svg+xml" }),
        `${base}.svg`,
      );
    if (format === "plt")
      downloadBlob(
        new Blob([patternPlt(pieces, sheet.height)], { type: "application/vnd.hp-hpgl" }),
        `${base}.plt`,
      );
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="bg-action hover:bg-action-hover flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white"
        >
          <Download className="size-5" aria-hidden /> Exporter le patron (PDF/PLT)
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Plan de coupe à l&apos;échelle 1:1</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => run("pdf")}>
          <FileText /> PDF — impression grand format (traceur)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run("plt")}>
          <PenTool /> PLT (HPGL) — table de coupe / traceur
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run("svg")}>
          <FileBox /> SVG — logiciels de patronage (mm)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
