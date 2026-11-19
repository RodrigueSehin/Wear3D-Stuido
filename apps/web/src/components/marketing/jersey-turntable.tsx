"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SIDES = [
  {
    id: "face",
    label: "Face",
    src: "/hero/jersey-football.png",
    alt: "Maillot de football, vue de face",
  },
  {
    id: "dos",
    label: "Dos",
    src: "/produit/maillot-dos.webp",
    alt: "Maillot de football, vue de dos",
  },
] as const;

/** Durée d'affichage de chaque face avant la rotation (ms). */
const INTERVAL_MS = 5000;

/**
 * Maillot de face et de dos : celui de devant pivote vers l'arrière tandis que l'autre vient
 * au premier plan, toutes les 5 s. Pause au survol ; sans animation si l'utilisateur la réduit.
 */
export function JerseyTurntable() {
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setFront((i) => (i + 1) % SIDES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, front]);

  return (
    <div
      className="relative h-full w-full [perspective:1400px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SIDES.map((s, i) => {
        const isFront = i === front;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setFront(i)}
            aria-label={
              isFront ? `${s.label} (affichée)` : `Afficher la vue de ${s.label.toLowerCase()}`
            }
            aria-pressed={isFront}
            tabIndex={isFront ? -1 : 0}
            className={`absolute bottom-0 left-1/2 h-[88%] origin-center cursor-pointer transition-all duration-[1400ms] ease-in-out [transform-style:preserve-3d] motion-reduce:transition-none ${
              isFront
                ? "z-20 [transform:translateX(-72%)_rotateY(0deg)_scale(1)]"
                : "z-10 brightness-75 [transform:translateX(-8%)_rotateY(-28deg)_scale(0.82)]"
            }`}
          >
            <Image
              src={s.src}
              alt={s.alt}
              width={380}
              height={470}
              priority={i === 0}
              sizes="(min-width: 1024px) 320px, 60vw"
              className="h-full w-auto drop-shadow-[0_24px_40px_rgb(0_10_50/0.6)]"
            />
          </button>
        );
      })}

      <div className="absolute inset-x-0 -bottom-1 z-30 flex items-center justify-center gap-2 text-xs font-medium">
        {SIDES.map((s, i) => (
          <span
            key={s.id}
            aria-hidden
            className={`rounded-full px-3 py-1 transition-colors duration-500 ${
              i === front ? "text-brand-navy-950 bg-sky-400" : "bg-white/15 text-white/80"
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
