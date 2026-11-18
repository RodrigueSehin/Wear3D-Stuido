"use client";

import { cn, Popover, PopoverContent, PopoverTrigger } from "@wear3d/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/** Carte de panneau (bibliothèque, calques, inspecteur). */
export function PanelCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-2xl border border-white/70 bg-white/85 shadow-[0_8px_30px_rgba(15,35,90,0.08)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pb-3 pt-5">
      <h2 className="font-display text-[22px] font-bold text-[#0b1530]">{children}</h2>
      {action}
    </div>
  );
}

/** Section repliable de l'inspecteur (Transformation, Apparence, Effets, Couleur). */
export function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-border border-t px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-lg font-bold text-[#0b1530]">{title}</span>
        {open ? (
          <ChevronUp className="size-5" aria-hidden />
        ) : (
          <ChevronDown className="size-5" aria-hidden />
        )}
      </button>
      {open && <div className="mt-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

/** Champ numérique encadré avec libellé à gauche et unité à droite (X, Y, W, H). */
export function NumberBox({
  label,
  value,
  unit,
  onChange,
  step = 1,
  min,
  max,
  className,
}: {
  label?: ReactNode;
  value: number;
  unit?: string;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const v = Number(text.replace(",", "."));
    if (!Number.isFinite(v)) return setText(String(value));
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
    onChange(clamped);
  };
  return (
    <label
      className={cn(
        "border-border focus-within:border-action flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm",
        className,
      )}
    >
      {label && <span className="text-muted-foreground shrink-0">{label}</span>}
      <input
        value={text}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const v = value + (e.key === "ArrowUp" ? step : -step) * (e.shiftKey ? 10 : 1);
            onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)));
          }
        }}
        className="w-full min-w-0 bg-transparent text-right font-medium text-[#0b1530] outline-none"
      />
      {unit && <span className="text-[#0b1530]">{unit}</span>}
    </label>
  );
}

/** Liste déroulante native stylée comme la maquette. */
export function SelectBox({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  className?: string;
  ariaLabel: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className="border-border focus:border-action h-10 w-full appearance-none rounded-lg border bg-white pl-3 pr-9 text-sm text-[#0b1530] outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
        aria-hidden
      />
    </div>
  );
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** Sélecteur de couleur : nuancier natif + saisie HEX + couleurs récentes. */
export function ColorPickerPanel({
  value,
  recent,
  onChange,
  onCommit,
}: {
  value: string;
  recent: readonly string[];
  onChange: (color: string) => void;
  onCommit: (color: string) => void;
}) {
  const [hex, setHex] = useState(value.toUpperCase());
  useEffect(() => setHex(value.toUpperCase()), [value]);
  return (
    <div className="flex flex-col gap-3">
      <label className="relative block h-32 overflow-hidden rounded-lg">
        <span className="sr-only">Nuancier</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onBlur={(e) => onCommit(e.target.value.toUpperCase())}
          className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer border-0 p-0"
        />
      </label>
      <label className="border-border flex h-10 items-center gap-2 rounded-lg border bg-white px-3">
        <span
          className="size-5 rounded-md border border-black/10"
          style={{ background: value }}
          aria-hidden
        />
        <span className="sr-only">Code HEX</span>
        <input
          value={hex}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setHex(v);
            if (HEX_RE.test(v)) onChange(v);
          }}
          onBlur={() => (HEX_RE.test(hex) ? onCommit(hex) : setHex(value.toUpperCase()))}
          className="w-full bg-transparent font-mono text-sm outline-none"
        />
      </label>
      {recent.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recent.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c);
                onCommit(c);
              }}
              className="size-7 rounded-full border border-black/10 shadow-sm"
              style={{ background: c }}
              aria-label={`Couleur ${c}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Pastille de couleur qui ouvre le sélecteur dans un popover. */
export function ColorField({
  value,
  recent,
  onChange,
  onCommit,
  label,
}: {
  value: string;
  recent: readonly string[];
  onChange: (c: string) => void;
  onCommit: (c: string) => void;
  label: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-border hover:border-action flex h-10 w-full items-center gap-3 rounded-lg border bg-white px-3 text-sm"
        >
          <span
            className="size-6 rounded-md border border-black/10"
            style={{ background: value }}
            aria-hidden
          />
          <span className="text-muted-foreground">{label}</span>
          <span className="ml-auto font-mono text-xs">{value.toUpperCase()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <ColorPickerPanel value={value} recent={recent} onChange={onChange} onCommit={onCommit} />
      </PopoverContent>
    </Popover>
  );
}
