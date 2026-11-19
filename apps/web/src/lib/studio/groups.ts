/**
 * Groupes de calques : un groupe réunit des calques pour les masquer, verrouiller, dupliquer
 * ou supprimer ensemble. L'état (visible / verrouillé) reste porté par chaque calque, donc
 * le compositeur et le moteur n'ont rien à savoir des groupes.
 */
import type { DesignDocument, Layer } from "@wear3d/design-schema";
import { useStudio } from "./store";

export interface LayerGroup {
  id: string;
  name: string;
  /** Membres, du plus haut au plus bas. */
  layers: Layer[];
}

/** Retire les groupes vides. */
export function pruneGroups(doc: DesignDocument): DesignDocument {
  if (!doc.groups) return doc;
  const used = new Set(doc.layers.map((l) => l.group).filter(Boolean));
  const groups = Object.fromEntries(Object.entries(doc.groups).filter(([id]) => used.has(id)));
  const { groups: _old, ...rest } = doc;
  return Object.keys(groups).length ? { ...rest, groups } : rest;
}

export function groupsOf(doc: DesignDocument | null): LayerGroup[] {
  if (!doc?.groups) return [];
  return Object.entries(doc.groups)
    .map(([id, g]) => ({
      id,
      name: g.name,
      layers: doc.layers.filter((l) => l.group === id).reverse(),
    }))
    .filter((g) => g.layers.length > 0);
}

function edit(recipe: (doc: DesignDocument) => DesignDocument) {
  const s = useStudio.getState();
  s.seal();
  s.update((doc) => pruneGroups(recipe(doc)));
  s.seal();
}

const newId = () => `g_${Math.random().toString(36).slice(2, 8)}`;

/** Met le calque dans un nouveau groupe, ou dans `groupId` ; `null` le sort de son groupe. */
export function assignGroup(layerId: string, groupId: string | null | "new"): string | null {
  let created: string | null = null;
  edit((doc) => {
    let gid: string | null = groupId === "new" ? newId() : groupId;
    let groups = doc.groups;
    if (groupId === "new" && gid) {
      created = gid;
      const n = Object.keys(doc.groups ?? {}).length + 1;
      groups = { ...doc.groups, [gid]: { name: `Groupe ${n}` } };
    }
    if (gid && !groups?.[gid]) gid = null;
    return {
      ...doc,
      ...(groups ? { groups } : {}),
      layers: doc.layers.map((l) => {
        if (l.id !== layerId) return l;
        const { group: _g, ...rest } = l;
        return (gid ? { ...rest, group: gid } : rest) as Layer;
      }),
    };
  });
  return created;
}

export function renameGroup(groupId: string, name: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  edit((doc) =>
    doc.groups?.[groupId] ? { ...doc, groups: { ...doc.groups, [groupId]: { name: clean } } } : doc,
  );
}

export function setGroupVisible(groupId: string, visible: boolean) {
  edit((doc) => ({
    ...doc,
    layers: doc.layers.map((l) => (l.group === groupId ? { ...l, visible } : l)),
  }));
}

export function setGroupLocked(groupId: string, locked: boolean) {
  edit((doc) => ({
    ...doc,
    layers: doc.layers.map((l) => (l.group === groupId ? { ...l, locked } : l)),
  }));
}

/** Dissout le groupe : les calques sont conservés. */
export function ungroup(groupId: string) {
  edit((doc) => ({
    ...doc,
    layers: doc.layers.map((l) => {
      if (l.group !== groupId) return l;
      const { group: _g, ...rest } = l;
      return rest as Layer;
    }),
  }));
}

export function removeGroup(groupId: string) {
  edit((doc) => ({ ...doc, layers: doc.layers.filter((l) => l.group !== groupId) }));
}

export function duplicateGroup(groupId: string) {
  edit((doc) => {
    const id = newId();
    const members = doc.layers.filter((l) => l.group === groupId);
    if (!members.length) return doc;
    const copies = members.map(
      (l) =>
        ({
          ...structuredClone(l),
          id: `${l.id}_${Math.random().toString(36).slice(2, 7)}`,
          group: id,
          transform: { ...l.transform, x: l.transform.x + 0.03, y: l.transform.y + 0.03 },
        }) as Layer,
    );
    return {
      ...doc,
      groups: {
        ...doc.groups,
        [id]: { name: `${doc.groups?.[groupId]?.name ?? "Groupe"} (copie)` },
      },
      layers: [...doc.layers, ...copies],
    };
  });
}
