# Pipeline Blender

Préparation des modèles 3D (CDC §4.4).

## Conventions

- Échelle en mètres, vêtement en taille M.
- Meshes : `Zone_<Code>` (ex. `Zone_Body_Front`), une île UV par zone, marges de 16 px.
- Matériaux : `Mat_<Code>`. Plis : morph targets `Morph_<Etat>` (`Posed`, `Worn`, `Motion`).
- 60 000 triangles maximum ; UV sans chevauchement.

## Validation

```bash
blender -b modele.blend --python validate.py
```

Le script quitte avec un code non nul si une règle est violée.

## Export

GLB, puis compression `gltf-transform` (Meshopt + KTX2), gabarit UV SVG et miniature (phase 1).
