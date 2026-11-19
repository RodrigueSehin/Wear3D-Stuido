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
    <section className="bg-hero relative overflow-hidden rounded-b-[2.5rem] text-white">
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
          <div aria-hidden className="relative hidden h-64 lg:block">
            <Image
              src="/hero/jersey-polo.png"
              alt=""
              width={220}
              height={260}
              className="absolute bottom-0 left-0 h-56 w-auto"
            />
            <Image
              src="/hero/jersey-football.png"
              alt=""
              width={260}
              height={300}
              className="absolute bottom-0 left-1/2 h-64 w-auto -translate-x-1/2"
            />
            <Image
              src="/hero/jersey-hoodie.png"
              alt=""
              width={220}
              height={260}
              className="absolute bottom-0 right-0 h-56 w-auto"
            />
          </div>
        )}
      </div>
    </section>
  );
}
