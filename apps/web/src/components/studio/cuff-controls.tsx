"use client";

import { Slider, Switch } from "@wear3d/ui";
import { useStudio } from "@/lib/studio/store";
import { cuffHeightCm, cuffState, patchCuffs } from "@/lib/studio/trims";
import { ColorField } from "./controls";

/**
 * Réglages des bords de manche (activation, couleur, hauteur, rayures). Ne s'affiche
 * que si le modèle sélectionné a des bords de manche.
 */
export function CuffControls({ title = true }: { title?: boolean }) {
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const recent = useStudio((s) => s.recentColors);
  const cuff = cuffState(doc, definition);
  if (!cuff) return null;
  const commit = (c: string) => {
    useStudio.getState().pushRecentColor(c);
    useStudio.getState().seal();
  };
  const cm = cuffHeightCm(cuff.width, definition);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-between gap-3 text-sm font-semibold text-[#0b1530]">
        {title ? "Bords de manche" : "Bord visible sur le vêtement"}
        <Switch
          checked={cuff.enabled}
          aria-label="Afficher les bords de manche"
          onCheckedChange={(enabled) => patchCuffs({ enabled })}
        />
      </label>
      {cuff.enabled && (
        <>
          <ColorField
            label="Couleur du bord"
            value={cuff.color}
            recent={recent}
            onChange={(color) => patchCuffs({ color }, "cuff-color")}
            onCommit={commit}
          />
          <div>
            <div className="flex justify-between text-sm text-[#0b1530]">
              <span>Hauteur</span>
              <span className="font-mono text-xs">
                {cm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} cm
              </span>
            </div>
            <Slider
              value={[cuff.width]}
              min={0.04}
              max={0.35}
              step={0.01}
              aria-label="Hauteur du bord de manche"
              onValueChange={([v]) => patchCuffs({ width: v ?? cuff.width }, "cuff-width")}
              onValueCommit={() => useStudio.getState().seal()}
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-[#0b1530]">
            <span>Rayures</span>
            <div className="flex gap-1" role="radiogroup" aria-label="Nombre de rayures">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={cuff.stripes === n}
                  onClick={() => patchCuffs({ stripes: n })}
                  className={
                    cuff.stripes === n
                      ? "bg-action size-8 rounded-lg text-sm font-semibold text-white"
                      : "border-border hover:bg-surface-muted size-8 rounded-lg border bg-white text-sm"
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {cuff.stripes > 0 && (
            <ColorField
              label="Couleur des rayures"
              value={cuff.stripeColor}
              recent={recent}
              onChange={(stripeColor) => patchCuffs({ stripeColor }, "cuff-stripe")}
              onCommit={commit}
            />
          )}
        </>
      )}
    </div>
  );
}
