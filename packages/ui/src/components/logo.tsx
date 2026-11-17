import { cn } from "../lib/cn";

/** Logo WEAR3D STUDIO : « W » bleu en deux traits + nom sur deux lignes. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label="WEAR3D STUDIO">
      <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
        <defs>
          <linearGradient id="w3d-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4C8DFF" />
            <stop offset="1" stopColor="#1F5EFF" />
          </linearGradient>
        </defs>
        <path d="M0 2h9l6 18 6-18h6l6 18 6-18h9L36 30h-7l-5.5-15L18 30h-7Z" fill="url(#w3d-logo)" />
      </svg>
      <span
        className={cn(
          "font-display text-sm font-extrabold leading-[1.05] tracking-wide",
          inverted ? "text-white" : "text-brand-navy-900",
        )}
      >
        WEAR3D
        <br />
        STUDIO
      </span>
    </span>
  );
}
