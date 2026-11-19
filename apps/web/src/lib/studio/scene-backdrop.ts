/**
 * Décor d'arrière-plan d'une scène : intégré (dessiné par code) ou importé (IndexedDB).
 */
import { useEffect, useState } from "react";
import { loadSceneImage } from "./persistence";
import { CUSTOM_SCENE_PREFIX, sceneBackdrop, sceneById } from "./scenes";

const objectUrls = new Map<string, string>();

/** URL du décor (data URL ou object URL), ou null si la scène importée est introuvable ici. */
export async function resolveBackdropUrl(sceneId: string): Promise<string | null> {
  const builtin = sceneById(sceneId);
  if (builtin) return sceneBackdrop(builtin);
  if (!sceneId.startsWith(CUSTOM_SCENE_PREFIX)) return null;
  const id = sceneId.slice(CUSTOM_SCENE_PREFIX.length);
  const hit = objectUrls.get(id);
  if (hit) return hit;
  const image = await loadSceneImage(id).catch(() => undefined);
  if (!image) return null;
  const url = URL.createObjectURL(image.blob);
  objectUrls.set(id, url);
  return url;
}

export function useSceneBackdrop(sceneId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!sceneId) {
      setUrl(null);
      return;
    }
    void resolveBackdropUrl(sceneId).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [sceneId]);
  return url;
}

export const MAX_SCENE_BYTES = 10 * 1024 * 1024;
