"use client";

import { cn } from "@wear3d/ui";
import { Box, Square } from "lucide-react";
import dynamic from "next/dynamic";
import { useStudio } from "@/lib/studio/store";
import { FlatView } from "./flat-view";
import { FloatingToolbar } from "./floating-toolbar";

const Viewport3D = dynamic(() => import("./viewport-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-72 w-56 animate-pulse rounded-[42%_42%_14%_14%] bg-[#0a1638]/10" />
    </div>
  ),
});

/** Zone centrale : barre d'outils flottante, vue 3D ou 2D, bascule 3D/2D. */
export function Stage() {
  const viewMode = useStudio((s) => s.viewMode);
  const setViewMode = useStudio((s) => s.setViewMode);
  const preview = useStudio((s) => s.preview);
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      {!preview && (
        <div className="absolute left-0 top-6 z-10">
          <FloatingToolbar />
        </div>
      )}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {viewMode === "3d" ? <Viewport3D /> : <FlatView />}
        <div
          role="tablist"
          aria-label="Mode de vue"
          className="absolute right-3 top-4 flex rounded-full border border-white/80 bg-white/90 p-1 shadow-[0_8px_24px_rgba(15,35,90,0.10)]"
        >
          {(
            [
              ["3d", "3D", Box],
              ["2d", "2D", Square],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={viewMode === id}
              onClick={() => setViewMode(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[15px] font-semibold",
                viewMode === id ? "bg-action text-white" : "hover:bg-surface-muted text-[#0b1530]",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
