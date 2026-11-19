"use client";

import { Box, Download, Layers, Palette, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const JERSEYS = [
  { src: "/hero/jersey-football.png", label: "Maillot de football" },
  { src: "/hero/jersey-polo.png", label: "Polo" },
  { src: "/hero/jersey-hoodie.png", label: "Hoodie" },
] as const;

const TOOLS = [
  { icon: Box, label: "3D 360°" },
  { icon: Palette, label: "Personnalisation" },
  { icon: Sparkles, label: "Génération IA" },
  { icon: Layers, label: "Calques" },
  { icon: Download, label: "Export HD" },
] as const;

const INTERVAL_MS = 4500;

/**
 * Vitrine du hero : les trois vêtements se relaient sur le podium central.
 * Le vêtement actif entre par la droite, le précédent sort par la gauche.
 */
export function HeroShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % JERSEYS.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const previous = (active + JERSEYS.length - 1) % JERSEYS.length;

  return (
    <div
      className="relative mx-auto h-[26rem] w-full max-w-[34rem] sm:h-[34rem] lg:mx-0 lg:h-[34rem] lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {JERSEYS.map((j, i) => {
        const state = i === active ? "active" : i === previous ? "out" : "wait";
        return (
          <div
            key={j.src}
            data-state={state}
            aria-hidden={state !== "active"}
            className="hero-relay absolute inset-x-0 bottom-[13%] top-0 flex items-end justify-center xl:pr-24"
          >
            <div className={state === "active" ? "hero-float" : undefined}>
              <Image
                src={j.src}
                alt={j.label}
                width={1086}
                height={1448}
                priority={i === 0}
                sizes="(min-width: 1024px) 420px, 70vw"
                className="h-auto max-h-[22rem] w-auto drop-shadow-[0_24px_40px_rgb(0_10_50/0.6)] sm:max-h-[30rem] lg:max-h-[27rem]"
              />
            </div>
          </div>
        );
      })}

      {/* Panneau d'outils */}
      <ul
        aria-hidden
        className="bg-brand-navy-900/70 absolute right-0 top-4 hidden w-44 flex-col gap-1 rounded-xl border border-white/15 p-2 text-sm backdrop-blur xl:flex"
      >
        {TOOLS.map(({ icon: Icon, label }, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-500 ${
              i === active ? "bg-white/10 text-white" : "text-white/75"
            }`}
          >
            <Icon className="size-5" strokeWidth={1.5} />
            {label}
          </li>
        ))}
      </ul>

      {/* Indicateurs */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3">
        <span className="min-w-28 text-right text-xs font-medium text-white/80" aria-live="polite">
          {JERSEYS[active]!.label}
        </span>
        {JERSEYS.map((j, i) => (
          <button
            key={j.src}
            type="button"
            aria-label={`Afficher : ${j.label}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === active ? "w-6 bg-sky-400" : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
