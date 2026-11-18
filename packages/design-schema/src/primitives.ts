import { z } from "zod";

/** Codes de zone : majuscules et underscores, ex. BODY_FRONT. */
export const zoneCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Code de zone invalide");

/** Couleur HEX #RRGGBB. */
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur HEX invalide");

/** Fraction relative à la zone (0..1). Légère tolérance pour les éléments qui débordent. */
export const unitSchema = z.number().min(-1).max(2);

export type ZoneCode = z.infer<typeof zoneCodeSchema>;
export type HexColor = z.infer<typeof hexColorSchema>;
