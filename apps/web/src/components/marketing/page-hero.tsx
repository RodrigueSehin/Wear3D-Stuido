import { Badge } from "@wear3d/ui";
import Image from "next/image";
import type { ReactNode } from "react";

/** Bandeau navy des pages publiques : badge, titre à mot-clé coloré, sous-titre, vêtements. */
export function PageHero({
  badge,
  title,
  highlight,
  subtitle,
  children,
  showJerseys = true,
}: {
  badge: string;
  title: string;
  /** Fin du titre affichée en bleu clair. */
  highlight: string;
  subtitle: string;
  children?: ReactNode;
  showJerseys?: boolean;
}) {
  return (
    <section className="bg-brand-navy-950 relative overflow-hidden rounded-b-[2.5rem] text-white">
      <Image
        src="/hero/background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[75%_bottom]"
      />
      <div
        aria-hidden
        className="from-brand-navy-950 via-brand-navy-950/70 absolute inset-0 bg-gradient-to-r to-transparent"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-14 pt-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Badge variant="outline" className="bg-brand-navy-800/60 border-white/25 text-white">
            {badge}
          </Badge>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            {title} <span className="text-brand-sky">{highlight}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">{subtitle}</p>
          {children && <div className="mt-6">{children}</div>}
        </div>
        {showJerseys && (
          <div aria-hidden className="relative hidden h-72 lg:block">
            <div className="ring-brand-sky/60 absolute inset-x-4 bottom-0 h-16 rounded-[50%] ring-2 [box-shadow:0_0_40px_rgba(76,141,255,.45)]" />
            <Image
              src="/vetements/polo-hd.webp"
              alt=""
              width={260}
              height={240}
              className="absolute bottom-3 left-0 h-52 w-auto drop-shadow-[0_18px_28px_rgb(0_10_50/0.55)]"
            />
            <Image
              src="/hero/jersey-football.png"
              alt=""
              width={280}
              height={330}
              className="absolute bottom-3 left-1/2 z-10 h-72 w-auto -translate-x-1/2 drop-shadow-[0_18px_28px_rgb(0_10_50/0.55)]"
            />
            <Image
              src="/vetements/hoodie-hd.webp"
              alt=""
              width={260}
              height={240}
              className="absolute bottom-3 right-0 h-52 w-auto drop-shadow-[0_18px_28px_rgb(0_10_50/0.55)]"
            />
          </div>
        )}
      </div>
    </section>
  );
}
