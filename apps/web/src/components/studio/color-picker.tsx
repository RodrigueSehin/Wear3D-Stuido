"use client";

import { cn } from "@wear3d/ui";
import { useEffect, useState } from "react";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/**
 * Sélecteur de couleur (CDC F-13) : couleurs récentes, sélecteur natif, saisie HEX.
 * `onChange(color, live)` : live = true pendant le glisser (regroupé dans l'historique).
 */
export function ColorPicker({
  value,
  recent,
  onChange,
  onCommit,
}: {
  value: string;
  recent: readonly string[];
  onChange: (color: string, live: boolean) => void;
  onCommit: (color: string) => void;
}) {
  const [hex, setHex] = useState(value.toUpperCase());
  useEffect(() => setHex(value.toUpperCase()), [value]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">Couleurs récentes</p>
        <div className="flex flex-wrap gap-2">
          {recent.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c, false);
                onCommit(c);
              }}
              className={cn(
                "border-border focus-visible:ring-ring size-7 rounded-md border shadow-sm focus-visible:outline-none focus-visible:ring-2",
                c.toUpperCase() === value.toUpperCase() && "ring-action ring-2 ring-offset-2",
              )}
              style={{ background: c }}
              aria-label={`Couleur ${c}`}
            />
          ))}
        </div>
      </div>
      <label className="relative block h-28 overflow-hidden rounded-lg">
        <span className="sr-only">Choisir une couleur</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase(), true)}
          onBlur={(e) => onCommit(e.target.value.toUpperCase())}
          className="absolute inset-0 size-full cursor-pointer border-0 p-0"
        />
      </label>
      <label className="border-border bg-surface flex items-center gap-2 rounded-md border px-3">
        <span className="size-4 rounded-sm" style={{ background: value }} aria-hidden />
        <span className="sr-only">Code HEX</span>
        <input
          value={hex}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setHex(v);
            if (HEX_RE.test(v)) onChange(v, false);
          }}
          onBlur={() => (HEX_RE.test(hex) ? onCommit(hex) : setHex(value.toUpperCase()))}
          className="h-10 w-full bg-transparent font-mono text-sm focus:outline-none"
          maxLength={7}
          spellCheck={false}
        />
      </label>
    </div>
  );
}
