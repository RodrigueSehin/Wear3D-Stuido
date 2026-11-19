"use client";

import { cn } from "@wear3d/ui";
import {
  BadgeCheck,
  Box,
  Palette,
  Scissors,
  Settings,
  Shapes,
  Shirt,
  Type,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useStudio, type RailItem } from "@/lib/studio/store";

const ITEMS: { id: RailItem; label: string; icon: LucideIcon }[] = [
  { id: "design", label: "Design", icon: Palette },
  { id: "textures", label: "Textures", icon: Waves },
  { id: "logos", label: "Logos", icon: BadgeCheck },
  { id: "texts", label: "Textes", icon: Type },
  { id: "elements", label: "Éléments", icon: Shapes },
  { id: "mockups", label: "Maquettes", icon: Shirt },
  { id: "scenes", label: "Scènes", icon: Box },
  { id: "pattern", label: "Patron", icon: Scissors },
  { id: "settings", label: "Paramètres", icon: Settings },
];

/** Rail gauche de la maquette Studio : icône au-dessus du libellé, élément actif en bleu. */
export function LeftRail() {
  const rail = useStudio((s) => s.rail);
  const open = useStudio((s) => s.libraryOpen);
  const openRail = useStudio((s) => s.openRail);
  return (
    <nav
      aria-label="Outils du studio"
      className="flex w-[92px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-[#0a1638] py-4"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const active = rail === id && open;
        return (
          <button
            key={id}
            type="button"
            onClick={() => openRail(id)}
            aria-pressed={active}
            className={cn(
              "flex w-[76px] flex-col items-center gap-1.5 rounded-xl py-3 text-[13px] text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              active && "bg-action shadow-glow hover:bg-action text-white",
            )}
          >
            <Icon className="size-7" strokeWidth={1.5} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
