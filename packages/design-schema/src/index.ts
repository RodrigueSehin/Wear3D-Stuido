/**
 * @wear3d/design-schema — contrat central du produit (CDC §4.2, §5.4).
 * Partagé par le studio, le serveur et les workers.
 *
 * Phase 0 : constantes et squelette. Le schéma complet (zones, calques, migrations)
 * est implémenté en phase 1.
 */
import { z } from "zod";

export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Codes de zone : majuscules et underscores, ex. BODY_FRONT. */
export const zoneCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Code de zone invalide");

/** Couleur HEX #RRGGBB. */
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur HEX invalide");

export type ZoneCode = z.infer<typeof zoneCodeSchema>;
export type HexColor = z.infer<typeof hexColorSchema>;
