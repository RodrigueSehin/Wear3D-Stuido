"use client";

import { cn } from "@wear3d/ui";
import {
  Box,
  Hash,
  ImageIcon,
  Layers3,
  Palette,
  Sparkles,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useStudio, type ToolId } from "@/lib/studio/store";

const TOOLS: { id: ToolId; label: string; icon: LucideIcon; disabled?: boolean }[] = [
  { id: "model", label: "Modèle", icon: Box },
  { id: "colors", label: "Couleurs", icon: Palette },
  { id: "materials", label: "Matières", icon: Layers3 },
  { id: "texts", label: "Textes", icon: Type },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "numbers", label: "Numéros", icon: Hash },
  { id: "ai", label: "IA", icon: Sparkles, disabled: true },
];

/** Rail d'outils (56 px, CDC §7.2) ; un clic ouvre ou ferme le panneau de l'outil. */
export function ToolRail() {
  const tool = useStudio((s) => s.tool);
  const setTool = useStudio((s) => s.setTool);
  return (
    <nav
      className="bg-brand-navy-900 flex w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto py-3"
      aria-label="Outils"
    >
      {TOOLS.map(({ id, label, icon: Icon, disabled }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTool(id)}
          disabled={disabled}
          aria-pressed={tool === id}
          title={disabled ? "Assistant IA : phase 7" : label}
          className={cn(
            "flex w-14 flex-col items-center gap-1 rounded-md py-2 text-[11px] text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40",
            tool === id && "bg-action hover:bg-action text-white",
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
}
