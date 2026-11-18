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
    const missing = doc.layers.flatMap((l) =>
      l.type === "image" && !getCachedImage(l.assetId) ? [l.assetId] : [],
    );
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
