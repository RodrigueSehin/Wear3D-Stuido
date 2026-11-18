/**
 * Persistance locale du studio (IndexedDB). Le brouillon fonctionne sans compte
 * (CDC §3) ; il sera repris dans Supabase à l'inscription (phase 3).
 */
import { parseDesignDocument, type DesignDocument } from "@wear3d/design-schema";
import { createStore, del, get, keys, set, values } from "idb-keyval";

const designs = () => createStore("wear3d-studio", "designs");
const assets = () => createStore("wear3d-assets", "assets");

export interface StoredDesign {
  id: string;
  name: string;
  document: DesignDocument;
  updatedAt: string;
}

export async function loadDesign(id: string): Promise<StoredDesign | undefined> {
  const raw = await get<StoredDesign>(id, designs());
  if (!raw) return undefined;
  // Valide et migre le document : un brouillon ancien ou corrompu ne casse pas le studio.
  return { ...raw, document: parseDesignDocument(raw.document) };
}

export async function saveDesign(design: StoredDesign): Promise<void> {
  await set(design.id, design, designs());
}

export async function listDesignIds(): Promise<string[]> {
  return (await keys(designs())).map(String);
}

export async function deleteDesign(id: string): Promise<void> {
  await del(id, designs());
}

export interface StoredAsset {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  width: number;
  height: number;
}

export async function saveAsset(asset: StoredAsset): Promise<void> {
  await set(asset.id, asset, assets());
}

export async function loadAsset(id: string): Promise<StoredAsset | undefined> {
  return get<StoredAsset>(id, assets());
}

/** Logos et images importés localement (bibliothèque « Logos »). */
export async function listAssets(): Promise<StoredAsset[]> {
  return values<StoredAsset>(assets());
}
