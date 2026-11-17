"""Validation d'un modèle WEAR3D dans Blender (CDC §4.4).

Usage : blender -b modele.blend --python validate.py
Phase 0 : nommage et budget de triangles. Contrôles UV en phase 1.
"""

import re
import sys

MAX_TRIANGLES = 60_000
ZONE_RE = re.compile(r"^Zone_[A-Za-z0-9]+(_[A-Za-z0-9]+)*$")
MAT_RE = re.compile(r"^Mat_[A-Za-z0-9_]+$")


def validate() -> list[str]:
    import bpy  # disponible uniquement dans Blender

    errors: list[str] = []
    triangles = 0

    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if not ZONE_RE.match(obj.name):
            errors.append(f"Mesh mal nommé : {obj.name} (attendu Zone_<Code>)")
        mesh = obj.data
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        if not mesh.uv_layers:
            errors.append(f"{obj.name} : aucune carte UV")

    for mat in bpy.data.materials:
        if mat.users and not MAT_RE.match(mat.name):
            errors.append(f"Matériau mal nommé : {mat.name} (attendu Mat_<Code>)")

    if triangles > MAX_TRIANGLES:
        errors.append(f"{triangles} triangles (maximum {MAX_TRIANGLES})")

    return errors


if __name__ == "__main__":
    problems = validate()
    for p in problems:
        print(f"[ERREUR] {p}")
    print("OK" if not problems else f"{len(problems)} erreur(s)")
    sys.exit(1 if problems else 0)
