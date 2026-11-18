/**
 * Jetons d'effectif : `{player.name}` et `{player.number}` sont remplacés par les
 * données de chaque joueur (design_variants, CDC F-30).
 */
import type { DesignDocument } from "./migrations";

export interface PlayerData {
  name?: string;
  number?: string;
  [key: string]: string | undefined;
}

const TOKEN_RE = /\{player\.([a-zA-Z0-9_]+)\}/g;

export function hasPlayerTokens(value: string): boolean {
  TOKEN_RE.lastIndex = 0;
  return TOKEN_RE.test(value);
}

/** Remplace les jetons ; un champ absent devient une chaîne vide. */
export function resolveTokens(value: string, player: PlayerData): string {
  return value.replace(TOKEN_RE, (_, key: string) => player[key] ?? "");
}

/** Aperçu dans le studio quand aucun joueur n'est sélectionné. */
export const PREVIEW_PLAYER: PlayerData = { name: "NOM", number: "10" };

/** Renvoie une copie du document avec les jetons résolus pour un joueur. */
export function applyPlayer(doc: DesignDocument, player: PlayerData): DesignDocument {
  return {
    ...doc,
    layers: doc.layers.map((layer) => {
      if (layer.type === "text") {
        return {
          ...layer,
          text: { ...layer.text, value: resolveTokens(layer.text.value, player) },
        };
      }
      if (layer.type === "number") {
        return {
          ...layer,
          number: { ...layer.number, value: resolveTokens(layer.number.value, player) },
        };
      }
      return layer;
    }),
  };
}
