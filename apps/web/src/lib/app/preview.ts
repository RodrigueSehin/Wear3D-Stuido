type Zones = Record<string, { color?: string }> | undefined;

export interface PreviewColors {
  body: string;
  sleeves: string;
  collar: string;
}

/** Couleurs d'aperçu d'un design : corps, manches, col (zones du document). */
export function previewColors(document: unknown): PreviewColors {
  const zones = (document as { zones?: Zones } | null)?.zones;
  const body = zones?.BODY_FRONT?.color ?? "#FFFFFF";
  return {
    body,
    sleeves: zones?.SLEEVE_LEFT?.color ?? body,
    collar: zones?.COLLAR?.color ?? body,
  };
}
