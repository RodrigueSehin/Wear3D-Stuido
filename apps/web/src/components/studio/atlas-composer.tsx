"use client";

import { useEffect, useState } from "react";
import { getCachedImage, ensureImage } from "@/lib/studio/assets";
import { composeInto, getAtlasCanvas, useAtlas } from "@/lib/studio/atlas";
import { loadStudioFonts } from "@/lib/studio/fonts";
import { useStudio } from "@/lib/studio/store";

/**
 * Recompose l'atlas partagé à chaque modification du document, quand les polices
 * et les images nécessaires sont chargées. Ne rend rien.
 */
export function AtlasComposer() {
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const [fontsReady, setFontsReady] = useState(false);
  const [assetsVersion, setAssetsVersion] = useState(0);

  useEffect(() => {
    void loadStudioFonts().then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    if (!doc) return;
    // Images des calques et motifs importés (maquettes) : chargées avant composition.
    const patternAssets = Object.values(doc.zones).flatMap((z) =>
      z.pattern && !z.pattern.assetId.startsWith("pattern:") ? [z.pattern.assetId] : [],
    );
    const missing = [
      ...doc.layers.flatMap((l) => (l.type === "image" ? [l.assetId] : [])),
      ...patternAssets,
    ].filter((id, i, all) => all.indexOf(id) === i && !getCachedImage(id));
    if (missing.length)
      void Promise.all(missing.map(ensureImage)).then(() => setAssetsVersion((v) => v + 1));
  }, [doc]);

  useEffect(() => {
    if (!doc || !definition) return;
    composeInto(getAtlasCanvas(), doc, definition);
    useAtlas.getState().bump();
  }, [doc, definition, fontsReady, assetsVersion]);

  return null;
}
