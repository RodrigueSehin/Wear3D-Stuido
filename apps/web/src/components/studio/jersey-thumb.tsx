"use client";

import { useEffect, useId, useState } from "react";
import { patternPreview } from "@/lib/studio/patterns";

/** Vignette de maillot (vue de face) aux couleurs d'un design : corps, manches, col, motif. */
export function JerseyThumb({
  body,
  sleeves,
  collar,
  pattern,
  className,
}: {
  body: string;
  sleeves: string;
  collar: string;
  pattern?: { assetId: string; color: string; opacity: number };
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  // Le motif est dessiné dans un canvas : uniquement dans le navigateur (jamais au rendu serveur).
  const [patternUrl, setPatternUrl] = useState<string | null>(null);
  const assetId = pattern?.assetId;
  const patternColor = pattern?.color;
  useEffect(() => {
    setPatternUrl(
      assetId && patternColor ? patternPreview(assetId, patternColor, "rgba(0,0,0,0)") : null,
    );
  }, [assetId, patternColor]);
  const torso = "M30 17 L41 11 Q50 17 59 11 L70 17 L72 40 L72 89 Q50 94 28 89 L28 40 Z";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <clipPath id={`b${id}`}>
          <path d={torso} />
        </clipPath>
        <linearGradient id={`s${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.65" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Manches */}
      <path d="M30 17 L12 29 L19 46 L29 41 Z" fill={sleeves} />
      <path d="M70 17 L88 29 L81 46 L71 41 Z" fill={sleeves} />
      <path d="M12 29 L19 46 L21 45 L14 28 Z" fill={collar} opacity="0.9" />
      <path d="M88 29 L81 46 L79 45 L86 28 Z" fill={collar} opacity="0.9" />
      {/* Corps */}
      <path d={torso} fill={body} />
      {patternUrl && (
        <image
          href={patternUrl}
          x="18"
          y="8"
          width="64"
          height="88"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#b${id})`}
          opacity={pattern?.opacity ?? 1}
        />
      )}
      <path d={torso} fill={`url(#s${id})`} />
      {/* Col en V */}
      <path
        d="M41 11 L50 25 L59 11"
        fill="none"
        stroke={collar}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path d="M12 29 L19 46 M88 29 L81 46" stroke="#000" strokeOpacity="0.15" strokeWidth="0.6" />
    </svg>
  );
}
