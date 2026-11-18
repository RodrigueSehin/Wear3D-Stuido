/**
 * Écriture d'un fichier GLB (glTF 2.0 binaire) minimal : un nœud, un mesh et un
 * matériau par zone. Suffisant pour les modèles procéduraux ; les modèles Blender
 * passeront par gltf-transform (pipeline/blender).
 */
import type { MeshData } from "./mesh";

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const FLOAT = 5126;
const UINT16 = 5123;
const UINT32 = 5125;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;

const pad4 = (n: number) => (n + 3) & ~3;

function minMax3(a: Float32Array): { min: number[]; max: number[] } {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < a.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, a[i + k]!);
      max[k] = Math.max(max[k]!, a[i + k]!);
    }
  }
  return { min, max };
}

/** Nom de matériau normalisé : Zone_Body_Front → Mat_Body_Front. */
export const materialNameFor = (meshName: string) => meshName.replace(/^Zone_/, "Mat_");

export function writeGlb(meshes: readonly MeshData[], generator = "wear3d-procedural"): Uint8Array {
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  const bufferViews: object[] = [];
  const accessors: object[] = [];

  const addView = (data: ArrayBufferView, target: number): number => {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const offset = byteLength;
    const padded = new Uint8Array(pad4(bytes.byteLength));
    padded.set(bytes);
    chunks.push(padded);
    byteLength += padded.byteLength;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, target });
    return bufferViews.length - 1;
  };

  const addAccessor = (accessor: object): number => {
    accessors.push(accessor);
    return accessors.length - 1;
  };

  const gltfMeshes: object[] = [];
  const materials: object[] = [];
  const nodes: object[] = [];

  meshes.forEach((mesh, index) => {
    const vertexCount = mesh.positions.length / 3;
    const { min, max } = minMax3(mesh.positions);
    const position = addAccessor({
      bufferView: addView(mesh.positions, ARRAY_BUFFER),
      componentType: FLOAT,
      count: vertexCount,
      type: "VEC3",
      min,
      max,
    });
    const normal = addAccessor({
      bufferView: addView(mesh.normals, ARRAY_BUFFER),
      componentType: FLOAT,
      count: vertexCount,
      type: "VEC3",
    });
    const texcoord = addAccessor({
      bufferView: addView(mesh.uvs, ARRAY_BUFFER),
      componentType: FLOAT,
      count: vertexCount,
      type: "VEC2",
    });
    const small = vertexCount < 65536;
    const indexData = small ? Uint16Array.from(mesh.indices) : mesh.indices;
    const indices = addAccessor({
      bufferView: addView(indexData, ELEMENT_ARRAY_BUFFER),
      componentType: small ? UINT16 : UINT32,
      count: mesh.indices.length,
      type: "SCALAR",
    });

    materials.push({
      name: materialNameFor(mesh.name),
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 0,
        roughnessFactor: 0.9,
      },
    });
    gltfMeshes.push({
      name: mesh.name,
      primitives: [
        {
          attributes: { POSITION: position, NORMAL: normal, TEXCOORD_0: texcoord },
          indices,
          material: index,
        },
      ],
    });
    nodes.push({ name: mesh.name, mesh: index });
  });

  const json = {
    asset: { version: "2.0", generator },
    scene: 0,
    scenes: [{ name: "Garment", nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes: gltfMeshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength }],
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPadded = new Uint8Array(pad4(jsonBytes.byteLength)).fill(0x20); // espaces
  jsonPadded.set(jsonBytes);

  const total = 12 + 8 + jsonPadded.byteLength + 8 + byteLength;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonPadded.byteLength, true);
  view.setUint32(16, CHUNK_JSON, true);
  out.set(jsonPadded, 20);
  let offset = 20 + jsonPadded.byteLength;
  view.setUint32(offset, byteLength, true);
  view.setUint32(offset + 4, CHUNK_BIN, true);
  offset += 8;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/** Lit l'en-tête et le JSON d'un GLB (tests et validation). */
export function readGlbJson(glb: Uint8Array): { version: number; json: Record<string, unknown> } {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error("Fichier GLB invalide");
  const jsonLength = view.getUint32(12, true);
  const text = new TextDecoder().decode(glb.subarray(20, 20 + jsonLength));
  return { version: view.getUint32(4, true), json: JSON.parse(text) as Record<string, unknown> };
}
