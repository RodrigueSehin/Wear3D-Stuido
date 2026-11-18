# WEAR3D STUDIO

SaaS web de conception de vêtements personnalisés en 3D à 360°.

- Cahier des charges : [docs/Cahier des charges — WEAR3D STUDIO.md](docs/Cahier%20des%20charges%20—%20WEAR3D%20STUDIO.md)
- Plan de développement : [PLAN.md](PLAN.md)
- Maquettes : [docs/maquette/](docs/maquette/)

## Prérequis

- Node.js 22 ou plus
- pnpm 10 (`npm i -g pnpm@10`)
- Un projet Supabase en ligne (région UE)

## Démarrage

```bash
pnpm install
cp .env.example .env                  # renseigner l'URL et la clé publique Supabase
pnpm dev                               # http://localhost:3000
```

## Base de données (Supabase en ligne)

```bash
pnpm db:link -- --project-ref <ref>   # une fois
pnpm db:push                          # applique supabase/migrations
pnpm db:types                         # régénère packages/db/src/database.types.ts
```

## Scripts

| Commande                                     | Rôle                         |
| -------------------------------------------- | ---------------------------- |
| `pnpm dev`                                   | Lance l'app web et le worker |
| `pnpm build`                                 | Build de production          |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Qualité (exécutés en CI)     |
| `pnpm format`                                | Prettier                     |

## Structure

```
apps/
  web/              Next.js 15 : (marketing) (auth) (onboarding) (app) studio org admin
  worker/           Consommateur pgmq : export, ia, images
packages/
  ui/               Tokens (maquettes) + composants shadcn
  garment-engine/   Scène R3F, GLB, zones, matériaux
  editor-2d/        Canvas par zone, calques, undo/redo
  design-schema/    Schéma Zod du document de design (contrat central)
  ai-engine/        Adaptateurs IA, crédits, modération
  billing/          Plans, quotas, paiement
  db/               Types Supabase, helpers
supabase/           migrations, tests pgTAP, seed
pipeline/blender/   Validation et export des modèles 3D
```
