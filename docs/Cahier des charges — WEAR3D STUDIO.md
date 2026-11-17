# Cahier des charges — WEAR3D STUDIO

Nov 17, 2026 · @Rodrigue Sehin

## 1. Vision et cadrage

WEAR3D STUDIO est un SaaS web (Next.js) qui permet à des particuliers comme à des organisations de concevoir, visualiser en 3D à 360° et exporter des vêtements personnalisés, sans logiciel à installer. La V1 doit prouver qu'un utilisateur part d'un T-shirt vierge et obtient en moins de 10 minutes un rendu 3D convaincant, exportable et sauvegardé.

| Choix | Décision validée |
| --- | --- |
| Modèle économique | SaaS par abonnement (Free, Creator, Business, Enterprise) + crédits IA |
| Cible | B2C (particuliers, créateurs) et B2B (clubs, entreprises, associations, marques, ateliers) |
| Familles de vêtements | T-shirts, maillots de football, polos, hoodies, tenues de sport, maillots de basketball, uniformes professionnels, shorts et pantalons, vestes |
| Fonctionnalités | Éditeur 3D 360°, import de logos et images, textes et numéros, exports, génération IA, simulation réaliste du tissu |
| Technologie | Next.js + TypeScript, React Three Fiber, Supabase (PostgreSQL, Auth, Storage) |

**Objectifs mesurables à 12 mois après lancement**

- Temps médian entre inscription et premier export : moins de 10 minutes.
- Taux de conversion Free vers payant : 4 % minimum.
- Catalogue : 9 familles et au moins 30 modèles actifs.
- Disponibilité du service : 99,5 % par mois.

**Segments et besoin principal**

| Segment | Besoin principal | Offre visée |
| --- | --- | --- |
| Particuliers | Un vêtement unique, vite | Free, Creator |
| Créateurs indépendants | Collections, exports HD | Creator |
| Clubs sportifs | Maillots numérotés pour tout l'effectif | Business |
| Associations | Vêtements aux couleurs de l'organisation | Business |
| Entreprises | Uniformes cohérents, validation interne | Business, Enterprise |
| Marques textiles | Prototypage et présentation de collections | Enterprise |
| Ateliers de confection | Fichiers prêts pour la fabrication (V2) | Enterprise |

Hors périmètre V1 : vente et fabrication des vêtements, marketplace de designs, application mobile native.

## 2. Périmètre fonctionnel

Le périmètre couvre 8 modules. Chaque exigence porte un identifiant (F-xx) et une priorité : MVP (V1), V2 ou V3.

### 2.1 Catalogue de vêtements

| Famille | Variantes | Zones spécifiques | Priorité |
| --- | --- | --- | --- |
| T-shirts | Col rond, col V, oversize, manches longues | Col, manches, poitrine, dos | MVP |
| Maillots football | Domicile, extérieur, gardien | Panneaux latéraux, zone sponsor, numéro | MVP |
| Hoodies | Avec ou sans zip, oversize | Capuche, poche kangourou, poignets | MVP |
| Polos | Classique, manches longues | Col, patte de boutonnage | V1.1 |
| Maillots basketball | Sans manches, réversibles | Emmanchures, face A/B | V1.1 |
| Shorts et pantalons | Sport, casual, professionnel | Jambes, ceinture, bandes latérales | V1.1 |
| Tenues de sport | Ensembles, survêtements | Ensemble haut + bas lié | V1.2 |
| Vestes | Sport, coupe-vent, professionnelle | Zip, capuche, bandes réfléchissantes | V1.2 |
| Uniformes professionnels | Industrie, transport, restauration, médical | Badges, bandes haute visibilité | V1.2 |

- **F-01** Chaque modèle porte : référence unique, famille, description, coupes, zones personnalisables, matériaux et couleurs autorisés, tailles, fichier GLB, textures, gabarit UV (SVG), configuration JSON.
- **F-02** Filtres par famille, usage (sport, pro, casual), matériau et offre requise ; recherche texte.
- **F-03** Fiche modèle avec aperçu 3D léger et bouton « Personnaliser ».
- **F-04** Un modèle peut être réservé à une offre (ex. uniformes en Business).

### 2.2 Studio 3D

- **F-10** Rotation libre 360°, vues prédéfinies (avant, arrière, gauche, droite, 3/4), zoom, panoramique, réinitialisation.
- **F-11** Affichage sur mannequin ou vêtement seul ; 3 environnements d'éclairage (studio, extérieur, vitrine).
- **F-12** Sélection d'une zone par clic sur le modèle ou dans la liste ; survol = surbrillance.
- **F-13** Couleur par zone : palette, sélecteur, HEX/RGB, couleurs favorites, palette de marque de l'organisation, application à plusieurs zones.
- **F-14** Matériau par zone parmi ceux autorisés : coton, polyester, polyester respirant, élasthanne, maille sportive, tissus techniques.
- **F-15** Motif par zone (répété ou placé) avec échelle, rotation et décalage.
- **F-16** Sauvegarde automatique toutes les 5 s après modification et indicateur d'état (« Sauvegardé », « En cours », « Hors ligne »).

### 2.3 Éditeur graphique (logos, images, textes, numéros)

- **F-20** Import PNG, JPG, SVG, jusqu'à 20 Mo ; détourage automatique du fond (V1.1).
- **F-21** Texte libre : police (catalogue de 30 polices sous licence web), taille, couleur, contour, espacement, arc.
- **F-22** Numéros sportifs : styles de numérotation prédéfinis, nom + numéro au dos, règles par famille (taille minimale d'un numéro de maillot).
- **F-23** Placement direct sur le modèle 3D (glisser sur la surface) et dans une vue 2D à plat de la zone.
- **F-24** Déplacer, redimensionner, pivoter, aligner, distribuer, dupliquer, supprimer, verrouiller, masquer.
- **F-25** Panneau de calques avec ordre, renommage et groupes.
- **F-26** Annuler / rétablir sur 100 actions ; raccourcis clavier (Ctrl+Z, Ctrl+D, Suppr, flèches).
- **F-27** Alerte si une image est en résolution insuffisante pour l'impression (moins de 150 dpi à la taille placée).

### 2.4 Variantes d'équipe (B2B)

- **F-30** Liste d'effectif (import CSV : nom, numéro, taille) appliquée à un design maître ; aperçu de chaque joueur.
- **F-31** Export groupé des variantes (planche PDF + images).

### 2.5 Assistant IA

- **F-40** Génération conceptuelle : prompt texte (+ image de référence facultative) donne 4 images de concept. MVP.
- **F-41** Génération de motifs textiles raccordables (seamless) appliqués à une zone. MVP.
- **F-42** Proposition de palettes (5 couleurs) depuis un prompt ou un logo. MVP.
- **F-43** Génération exploitable : le prompt produit une configuration structurée (couleurs par zone, motifs, placements) appliquée directement au modèle. V2.
- **F-44** Suggestions d'amélioration d'un design existant (contraste, lisibilité du numéro). V2.
- **F-45** Historique des générations, coût en crédits affiché avant lancement, modération des prompts et des images importées.

### 2.6 Simulation textile

- **F-50** Rendu physique temps réel (PBR) : couleur, normal map, rugosité, sheen (aspect tissu), transparence pour les mailles ajourées. MVP.
- **F-51** Plis et tombé pré-calculés dans Blender par modèle et par taille (morph targets), sélectionnables : « posé », « porté », « en mouvement ». V1.1.
- **F-52** Simulation physique interactive (gravité, élasticité) côté navigateur ou serveur. V2.

### 2.7 Sauvegarde, export et partage

- **F-60** Projet = conteneur de plusieurs designs ; duplication, archivage, corbeille 30 jours.
- **F-61** Versions : snapshot manuel nommé + snapshot automatique quotidien ; restauration.
- **F-62** Exports : PNG (fond transparent, jusqu'à 4K), JPG, PDF fiche produit (vues, couleurs, matériaux, éléments), GLB, pack ZIP (images + JSON + assets). MVP pour PNG/JPG/PDF ; GLB et pack en V1.1.
- **F-63** Export fabrication : gabarits par pièce à plat, aux cotes, par taille (SVG/PDF). V2.
- **F-64** Partage par lien public, privé (jeton) ou réservé à l'organisation ; lien expirable ; visualiseur 3D en lecture seule.
- **F-65** Commentaires épinglés sur le modèle 3D (V1.1).

### 2.8 Organisations et collaboration

- **F-70** Création d'une organisation (club, entreprise, association, marque), invitation par email, rôles : owner, admin, designer, reviewer, viewer.
- **F-71** Équipes internes et projets partagés.
- **F-72** Kit de marque : logos, couleurs, polices imposées aux membres.
- **F-73** Circuit de validation : brouillon, soumis, approuvé ou à corriger, avec commentaire.
- **F-74** Statistiques : designs créés, exports, crédits IA consommés par membre.

## 3. Parcours et arborescence

La plateforme compte 4 espaces ; le parcours critique est « créer un design », et il doit fonctionner sans compte jusqu'à la sauvegarde (le compte est demandé au moment d'enregistrer ou d'exporter).

### 3.1 Parcours critique : créer un design

1. Choisir un vêtement dans le catalogue (ou partir d'un modèle de design prêt à l'emploi).
2. Le studio s'ouvre directement avec le modèle chargé et un projet brouillon créé.
3. Appliquer couleurs et matériaux par zone.
4. Ajouter logo, texte, numéro ; ou lancer l'assistant IA.
5. Vérifier à 360° et en mode « porté ».
6. Enregistrer (inscription si nécessaire, le brouillon local est repris).
7. Exporter ou partager.

### 3.2 Parcours B2B : équiper un club

1. L'admin crée l'organisation et charge le kit de marque.
2. Il invite un designer.
3. Le designer crée le maillot maître et importe l'effectif (CSV).
4. Il soumet le design à validation.
5. Le reviewer approuve ou demande une correction.
6. Export groupé des variantes par joueur.

### 3.3 Arborescence par espace

| Espace | Routes Next.js | Écrans |
| --- | --- | --- |
| Public | `/`, `/catalogue`, `/catalogue/[famille]/[modele]`, `/galerie`, `/tarifs`, `/s/[token]` | Accueil, catalogue, fiche modèle, galerie, tarifs, visualiseur partagé |
| Authentification | `/connexion`, `/inscription`, `/mot-de-passe`, `/verification` | Connexion (email, Google, lien magique), inscription, récupération, vérification |
| Onboarding | `/bienvenue` | Type de compte, organisation (facultatif), usage principal, premier vêtement suggéré |
| Client | `/app`, `/app/projets`, `/app/projets/[id]`, `/app/bibliotheque`, `/app/ia`, `/app/exports`, `/app/abonnement`, `/app/parametres` | Tableau de bord, projets, détail projet, bibliothèque (logos, images, motifs, polices, palettes), historique IA, exports, abonnement, paramètres |
| Studio | `/studio/[designId]` | Studio plein écran (aucune barre latérale de l'application) |
| Organisation | `/org/[slug]`, `/org/[slug]/membres`, `/org/[slug]/equipes`, `/org/[slug]/marque`, `/org/[slug]/validation`, `/org/[slug]/statistiques`, `/org/[slug]/facturation` | Tableau de bord, membres, équipes, kit de marque, file de validation, statistiques, facturation |
| Administration | `/admin/*` | Tableau de bord, utilisateurs, organisations, catégories, modèles 3D, zones, matériaux, bibliothèque commune, IA (fournisseurs, coûts, modération), exports, plans et quotas, facturation, stockage, journaux d'audit, paramètres |

Langues : français par défaut, anglais en V1 (`next-intl`), devises FCFA (XOF/XAF) et EUR.

## 4. Architecture technique

Architecture retenue : un monolithe modulaire Next.js multi-tenant, Supabase comme socle de données, et des workers asynchrones pour tout ce qui dépasse 2 secondes (rendu, IA, export). Pas de microservices en V1.

&#91;embedded content: architecture applicative · 5 couches\]

Le navigateur fait tout le rendu interactif ; le serveur ne rend jamais la 3D en temps réel, il ne fait que les exports haute définition en arrière-plan.

### 4.1 Stack

| Couche | Choix | Justification |
| --- | --- | --- |
| Application | Next.js 15 (App Router), TypeScript strict | Choix validé ; SSR pour le SEO du catalogue, Server Actions |
| 3D | Three.js + React Three Fiber + drei | Écosystème React, chargement GLB, contrôles caméra |
| Éditeur 2D | Konva (canvas hors écran par zone) | Transformations, calques, export vers texture |
| État client | Zustand + historique de commandes (undo/redo) | Léger, compatible avec la boucle de rendu 3D |
| UI | Tailwind CSS + shadcn/ui + Lucide | Design system rapide et cohérent |
| Données | Supabase : PostgreSQL 15, Auth, Storage, Realtime | RLS natif pour le multi-tenant |
| File de jobs | Supabase Queues (pgmq) | Évite d'ajouter Redis en V1 ; Redis seulement si le cache devient nécessaire |
| Workers | Node.js + Playwright (Chromium headless) sur conteneurs (Cloud Run ou Fly.io) | Le rendu d'export réutilise exactement la scène R3F du studio |
| Stockage lourd | Stockage objet compatible S3 (Cloudflare R2) + CDN | GLB, textures, exports ; pas de frais de sortie |
| IA | Couche d'abstraction multi-fournisseurs : un modèle d'image pour concepts et motifs, un LLM (Claude) pour la sortie structurée JSON | Changer de fournisseur sans toucher au studio |
| Paiement | Stripe (carte, EUR) + agrégateur mobile money (CinetPay ou PayDunya) pour XOF/XAF | Marché FCFA ; choix de l'agrégateur à confirmer |
| Observabilité | Sentry, Vercel Analytics, PostHog | Erreurs WebGL, entonnoir de création |
| Tests | Vitest, Playwright, tests pgTAP des politiques RLS | Isolation des organisations vérifiée en CI |

### 4.2 Organisation du code (monorepo pnpm + Turborepo)

```
wear3d-studio/
├─ apps/
│  ├─ web/                 # Next.js : (public) (auth) (app) studio org admin
│  └─ worker/              # consommateur pgmq : export, ia, images
├─ packages/
│  ├─ ui/                  # composants shadcn + design tokens
│  ├─ garment-engine/      # scène R3F, chargement GLB, zones, matériaux
│  ├─ editor-2d/           # canvas par zone, calques, commandes undo/redo
│  ├─ design-schema/       # schéma Zod du JSON de design + migrations de version
│  ├─ ai-engine/           # adaptateurs fournisseurs, prompts, modération
│  ├─ billing/             # plans, quotas, adaptateurs Stripe / mobile money
│  └─ db/                  # types générés Supabase, requêtes
├─ supabase/
│  ├─ migrations/
│  ├─ tests/               # pgTAP : RLS
│  └─ seed.sql
└─ pipeline/
   └─ blender/             # scripts Python de validation et d'export GLB
```

`design-schema` est partagé par le studio, le serveur et les workers : c'est le contrat central du produit.

### 4.3 Moteur 3D (garment-engine)

- Charge le GLB (compression Draco ou Meshopt, textures KTX2), avec chargement progressif : silhouette basse définition en moins de 1,5 s, puis haute définition.
- Lit les zones depuis les noms de mesh (`Zone_Body_Front`, `Zone_Sleeve_Left`…) et les rattache à `garment_zones`.
- Matériau : `MeshPhysicalMaterial` avec `sheen` pour l'aspect textile, normal map et roughness map par tissu, couleur par zone.
- Décors (logos, textes, numéros, motifs) : composés dans une texture par vêtement (atlas UV 2048 px en studio, 4096 px en export) via `CanvasTexture`.
- Placement direct en 3D : un raycast sur le modèle donne la coordonnée UV, l'élément est déplacé dans l'espace UV de la zone.
- Plis « posé / porté / mouvement » : morph targets pré-calculés dans Blender.
- Rendu à la demande (`frameloop="demand"`) pour économiser la batterie hors interaction.

**Décision de projection** : composition en espace UV plutôt que décalques 3D (`DecalGeometry`). Raison : une seule texture à sauvegarder et exporter, rendu identique en studio et en export, et réutilisable pour les gabarits de fabrication en V2. Contrainte : chaque zone de placement doit être dépliée d'un seul tenant, sans couture au milieu.

### 4.4 Pipeline de préparation des modèles (Blender)

1. Modélisation (ou simulation dans un outil de patronage) du vêtement en taille M.
2. Dépliage UV : une île par zone, densité de texels homogène, marges de 16 px.
3. Nommage normalisé : `Zone_<Code>` pour les meshes, `Mat_<Code>` pour les matériaux, `Morph_<Etat>` pour les plis.
4. Script Python de validation (nommage, nombre de triangles inférieur à 60 000, UV sans chevauchement, échelle en mètres).
5. Export GLB, compression (gltf-transform : Meshopt + KTX2), génération du gabarit UV SVG et de la miniature.
6. Import dans l'administration : l'admin ne fait que nommer les zones et cocher les matériaux autorisés.

### 4.5 Traitements asynchrones

Chaque export, génération IA ou traitement d'image crée une ligne `jobs` (statuts `pending`, `processing`, `completed`, `failed`, `cancelled`) et un message pgmq. Le worker met à jour la ligne ; le client suit l'avancement via Supabase Realtime. Les crédits sont réservés à la création du job et remboursés automatiquement en cas d'échec. Trois tentatives maximum, puis `failed` avec message.

### 4.6 API

Les écritures passent par des Server Actions ; les Route Handlers ci-dessous servent aux usages externes (webhooks, partage, intégrations Enterprise).

| Domaine | Endpoint | Méthodes |
| --- | --- | --- |
| Catalogue | `/api/garments`, `/api/garments/[id]` | GET |
| Matériaux | `/api/materials` | GET |
| Projets | `/api/projects`, `/api/projects/[id]` | GET, POST, PATCH, DELETE |
| Designs | `/api/designs/[id]`, `/api/designs/[id]/versions` | GET, PATCH, POST |
| Assets | `/api/assets/upload-url` | POST (URL signée) |
| Jobs | `/api/jobs/[id]` | GET |
| IA | `/api/ai/generations` | POST, GET |
| Exports | `/api/exports` | POST, GET |
| Partage | `/api/share/[token]` | GET |
| Organisations | `/api/orgs/[slug]/members`, `/api/orgs/[slug]/invitations` | GET, POST, PATCH, DELETE |
| Facturation | `/api/billing/checkout`, `/api/webhooks/stripe`, `/api/webhooks/mobile-money` | POST |
| Administration | `/api/admin/*` | Toutes, rôle `platform_admin` |

## 5. Modèle de données

Le modèle compte 32 tables réparties en 6 domaines. Règle structurante : toute ressource privée porte un `workspace_id`. Chaque utilisateur reçoit un espace personnel à l'inscription ; une organisation est un espace partagé. Une seule règle RLS couvre ainsi B2C et B2B.

### 5.1 Tables par domaine

| Domaine | Tables | Rôle |
| --- | --- | --- |
| Identité et espaces | `profiles`, `workspaces`, `workspace_members`, `invitations`, `teams`, `team_members` | Comptes, espaces (personnel ou organisation), rôles |
| Catalogue | `garment_categories`, `garment_models`, `garment_model_versions`, `garment_zones`, `materials`, `garment_model_materials`, `fonts` | Ressources gérées par l'administration |
| Création | `projects`, `designs`, `design_versions`, `design_variants`, `assets`, `brand_kits` | Travail des utilisateurs |
| Collaboration | `share_links`, `design_reviews`, `comments` | Partage et validation |
| Traitements | `jobs`, `ai_generations`, `exports` | Travaux asynchrones et résultats |
| SaaS | `plans`, `plan_features`, `subscriptions`, `payments`, `credit_ledger`, `usage_counters`, `audit_logs` | Offres, quotas, facturation, traçabilité |

**Choix de modélisation**

- Le contenu d'un design (zones, éléments, calques) est stocké en un seul document JSONB `designs.document`, validé par le schéma Zod `design-schema`. Pas de table `design_elements` relationnelle : l'éditeur sauvegarde un document entier, ce qui simplifie l'autosave, l'undo et les versions.
- `design_versions` garde des snapshots complets ; la sauvegarde automatique écrase `designs.document` avec contrôle de concurrence par `revision`.
- Un design référence une version précise du modèle 3D (`garment_model_versions`) : une mise à jour du catalogue ne casse jamais un design existant.
- Les crédits IA sont un registre (`credit_ledger`) et non un compteur : chaque débit, réservation et remboursement est une ligne.

### 5.2 DDL des tables clés

```sql
create type workspace_kind as enum ('personal','club','company','association','brand');
create type member_role    as enum ('owner','admin','designer','reviewer','viewer');
create type job_status     as enum ('pending','processing','completed','failed','cancelled');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  locale text not null default 'fr',
  country_code char(2),
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  kind workspace_kind not null,
  name text not null,
  slug text unique not null,
  logo_asset_id uuid,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid references workspaces on delete cascade,
  user_id uuid references profiles on delete cascade,
  role member_role not null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table garment_models (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references garment_categories,
  reference text unique not null,
  name text not null,
  description text,
  required_plan text not null default 'free',
  current_version_id uuid,
  is_active boolean not null default false
);

create table garment_model_versions (
  id uuid primary key default gen_random_uuid(),
  garment_model_id uuid not null references garment_models on delete cascade,
  version int not null,
  glb_path text not null,
  uv_template_path text not null,
  sizes text[] not null,
  morph_states text[] not null default '{}',
  config jsonb not null,
  unique (garment_model_id, version)
);

create table garment_zones (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references garment_model_versions on delete cascade,
  code text not null,               -- ex. BODY_FRONT
  mesh_name text not null,          -- ex. Zone_Body_Front
  label text not null,
  uv_rect jsonb not null,           -- {x,y,w,h} dans l'atlas, 0..1
  print_area_mm jsonb,              -- zone imprimable réelle en taille M
  allows text[] not null,           -- color, material, pattern, text, image
  sort_order int not null default 0,
  unique (model_version_id, code)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','archived','deleted')),
  created_by uuid not null references profiles,
  updated_at timestamptz not null default now()
);

create table designs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  project_id uuid not null references projects on delete cascade,
  model_version_id uuid not null references garment_model_versions,
  name text not null,
  document jsonb not null,
  revision int not null default 1,
  review_status text not null default 'draft'
    check (review_status in ('draft','submitted','approved','changes_requested')),
  thumbnail_path text,
  updated_by uuid references profiles,
  updated_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  kind text not null check (kind in ('export','ai','image')),
  status job_status not null default 'pending',
  input jsonb not null,
  output jsonb,
  error text,
  attempts int not null default 0,
  credits_reserved int not null default 0,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now()
);

create table credit_ledger (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  delta int not null,                -- + achat ou dotation, - consommation
  reason text not null,              -- monthly_grant, reserve, refund, purchase
  job_id uuid references jobs,
  created_at timestamptz not null default now()
);

create index on designs (workspace_id, updated_at desc);
create index on jobs (workspace_id, status);
```

### 5.3 Isolation multi-tenant (RLS)

```sql
create function is_member(ws uuid, min_role member_role default 'viewer')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
      and array_position(enum_range(null::member_role), m.role)
       <= array_position(enum_range(null::member_role), min_role)
  );
$$;

alter table designs enable row level security;

create policy designs_read on designs for select
  using (is_member(workspace_id));
create policy designs_write on designs for update
  using (is_member(workspace_id, 'designer'))
  with check (is_member(workspace_id, 'designer'));
```

Le même couple de politiques s'applique à `projects`, `assets`, `jobs`, `exports`, `ai_generations`, `brand_kits`. Les tables du catalogue sont en lecture publique pour les lignes actives et en écriture réservée à `is_platform_admin`. Les webhooks et workers utilisent la clé de service, jamais exposée au navigateur. Chaque politique est couverte par un test pgTAP (un membre de A ne lit aucune ligne de B).

### 5.4 Format du document de design (v1)

```json
{
  "schemaVersion": 1,
  "model": { "versionId": "uuid", "size": "L", "morph": "worn" },
  "zones": {
    "BODY_FRONT":  { "color": "#1F3F6D", "material": "poly-sport" },
    "BODY_BACK":   { "color": "#1F3F6D", "material": "poly-sport" },
    "SLEEVE_LEFT": { "color": "#EED58E", "material": "poly-sport",
                     "pattern": { "assetId": "uuid", "scale": 0.5, "rotation": 0, "opacity": 0.3 } }
  },
  "layers": [
    {
      "id": "el_01", "type": "text", "zone": "BODY_BACK", "locked": false, "visible": true,
      "transform": { "x": 0.5, "y": 0.25, "w": 0.6, "rotation": 0 },
      "text": { "value": "{player.name}", "font": "anton", "size": 0.08, "color": "#FFFFFF",
                "stroke": { "color": "#14243B", "width": 0.004 }, "arc": 0 }
    },
    {
      "id": "el_02", "type": "number", "zone": "BODY_BACK",
      "transform": { "x": 0.5, "y": 0.55, "w": 0.45, "rotation": 0 },
      "number": { "value": "{player.number}", "style": "block-classic", "color": "#EED58E" }
    },
    {
      "id": "el_03", "type": "image", "zone": "BODY_FRONT", "assetId": "uuid",
      "transform": { "x": 0.72, "y": 0.2, "w": 0.18, "rotation": 0 }
    }
  ]
}
```

Les coordonnées sont relatives à la zone (0 à 1), donc indépendantes de la résolution et de la taille. Les jetons `{player.name}` et `{player.number}` sont remplacés par les données de l'effectif (`design_variants`). Toute évolution du format incrémente `schemaVersion` et fournit une fonction de migration dans `design-schema`.

## 6. Sécurité et exigences non fonctionnelles

Les exigences ci-dessous sont des seuils de recette : une version qui ne les tient pas n'est pas livrée.

### 6.1 Performance

| Indicateur | Cible | Condition de mesure |
| --- | --- | --- |
| Premier affichage du vêtement (basse définition) | moins de 1,5 s | 4G, ordinateur milieu de gamme |
| Modèle haute définition chargé | moins de 4 s | idem |
| Fluidité du studio | 60 i/s ordinateur, 30 i/s tablette | rotation avec 10 calques |
| Poids d'un modèle GLB compressé | moins de 3 Mo | textures KTX2 incluses |
| LCP des pages publiques | moins de 2,5 s | Core Web Vitals |
| Export PNG 2K | moins de 20 s | du clic au téléchargement |
| Génération IA de 4 concepts | moins de 45 s | dépend du fournisseur |

### 6.2 Sécurité

- **S-01** Authentification Supabase (email + mot de passe, Google, lien magique) ; MFA facultative, obligatoire pour les admins plateforme.
- **S-02** RLS activée sur toutes les tables privées, testée en CI ; aucune requête métier avec la clé de service côté Next.js hors webhooks.
- **S-03** Fichiers privés servis par URL signée (durée 1 h) ; chemins de stockage préfixés par `workspace_id`.
- **S-04** Uploads : vérification du type réel (signature binaire), 20 Mo maximum, SVG nettoyé (suppression des scripts et liens externes), recompression des images.
- **S-05** Modération des prompts IA et des images importées (contenu illégal, logos de marques protégées signalés) ; conditions d'utilisation rendant l'utilisateur responsable des droits sur ses logos.
- **S-06** Limitation de débit : 60 requêtes/min par utilisateur sur l'API, 10 jobs IA simultanés par espace.
- **S-07** Webhooks de paiement vérifiés par signature et idempotents.
- **S-08** Journal d'audit des actions sensibles : rôles, suppression, facturation, administration.
- **S-09** Secrets uniquement côté serveur (variables Vercel et du conteneur worker).
- **S-10** Sauvegardes PostgreSQL quotidiennes avec restauration à un instant donné (PITR) sur 7 jours ; test de restauration trimestriel.

### 6.3 Données personnelles

Conformité RGPD et loi ivoirienne n° 2013-450 (et textes équivalents des pays cibles) : consentement cookies, export et suppression du compte en libre-service, hébergement des données documenté (région UE). Les listes d'effectif (noms de joueurs) sont des données personnelles : suppression avec le design.

### 6.4 Compatibilité et accessibilité

- Navigateurs : Chrome, Edge, Firefox, Safari (2 dernières versions), WebGL 2 requis ; message clair et aperçu image si WebGL absent.
- Studio : ordinateur et tablette (1024 px et plus) ; sur téléphone, visualisation et retouches simples (couleurs, texte).
- Accessibilité WCAG 2.2 AA hors viewport 3D : navigation clavier, contrastes, libellés ; le viewport propose des boutons de vue et de rotation utilisables au clavier.

### 6.5 Exploitation

- Environnements : local, preview (une branche Supabase par pull request), staging, production.
- CI : lint, typecheck, tests unitaires, tests RLS, tests E2E Playwright du parcours critique.
- Supervision : Sentry (dont pertes de contexte WebGL), alertes sur jobs en échec au-delà de 5 % sur 1 h, tableau de coût IA par jour.

## 7. Plan de conception UI/UX

Principe directeur : le vêtement est le héros de l'écran. L'interface est sobre (navy, blanc, gris clair), un seul bleu d'action, et le studio laisse au moins 50 % de la largeur au viewport 3D.

### 7.1 Direction artistique et tokens

| Token | Clair | Sombre | Usage |
| --- | --- | --- | --- |
| `--brand-navy` | #14243B | #E8EDF4 | Titres, logo |
| `--action` | #2876D2 | #4D94E6 | Boutons principaux, sélection |
| `--surface` | #FFFFFF | #0E1726 | Fond de page |
| `--surface-muted` | #E8EDF4 | #17233A | Panneaux, cartes |
| `--viewport-bg` | #F3F5F8 | #1A2232 | Fond neutre de la scène 3D (ne dénature pas les couleurs) |
| `--success` / `--warning` / `--danger` | #1E8E5A / #C98A06 / #C93838 | variantes claires | États |

Typographie : Inter (interface), Geist Mono (codes couleur et références). Échelle 12 / 14 / 16 / 20 / 28 / 40 px. Rayon 8 px, espacement sur une grille de 4 px, icônes Lucide 20 px, ombres limitées aux menus flottants. Mode sombre par défaut dans le studio (meilleur contraste autour du vêtement), au choix ailleurs.

### 7.2 Spécification du studio

&#91;embedded content: maquette filaire du studio · ordinateur\]

- **Barre supérieure** : nom du projet modifiable, état de sauvegarde, annuler/rétablir, partager, exporter (bouton principal).
- **Rail d'outils** (gauche, 56 px) : Modèle, Couleurs, Matières, Textes, Images, Numéros, IA ; un clic ouvre le panneau de l'outil (280 px, repliable).
- **Viewport** : clic sur une zone = sélection ; double-clic sur un élément = édition ; barre de vues flottante en bas.
- **Inspecteur** (droite, 300 px) : propriétés de la sélection en haut, calques en bas.
- **Tablette** : inspecteur en tiroir ; **téléphone** : viewport plein écran et outils en feuille du bas.
- **États à dessiner** : chargement du modèle (silhouette + progression), WebGL indisponible, hors ligne, quota atteint, job IA en cours, conflit de sauvegarde (« ce design a été modifié ailleurs »).

### 7.3 Écrans à concevoir, par ordre

| Lot | Écrans | Livrable Figma |
| --- | --- | --- |
| 1. Cœur produit | Studio : vue générale, couleurs et matières, textes et numéros, images et logos, IA, export | Maquettes haute fidélité + prototype cliquable |
| 2. Entrée | Accueil, catalogue, fiche modèle, inscription, connexion, onboarding | Haute fidélité, ordinateur et mobile |
| 3. Espace client | Tableau de bord, projets, bibliothèque, historique IA, exports, abonnement, paramètres | Haute fidélité |
| 4. Espace organisation | Membres, équipes, kit de marque, file de validation, effectif, statistiques | Haute fidélité |
| 5. Administration | Tableau de bord, modèles 3D et zones, matériaux, IA, plans et quotas, utilisateurs, audit | Fidélité moyenne (composants standard) |

Le studio vient en premier : c'est lui qui fixe les composants (inspecteur, calques, sélecteur de couleur) réutilisés partout ailleurs.

### 7.4 Composants du design system

| Famille | Composants |
| --- | --- |
| Structure | AppShell, AppSidebar, AppHeader, PageHeader, EmptyState, UpgradeBanner |
| Catalogue et projets | GarmentCard, CategoryChip, ProjectCard, DesignThumbnail, FilterBar |
| Studio | Viewport3D, SceneToolbar, ToolRail, ToolPanel, PropertyInspector, LayerPanel, ZonePicker, SaveIndicator |
| Édition | ColorPicker, BrandPalette, MaterialSelector, PatternSelector, FontSelector, NumberStyleSelector, TransformControls, AssetUploader |
| IA | PromptBox, StylePresetPicker, GenerationGrid, CreditCostBadge, JobProgress |
| SaaS | PlanCard, UsageMeter, InvoiceTable, MemberTable, RoleSelect, ReviewStatusBadge |
| Partage et export | ShareDialog, ExportDialog, PublicViewer |

### 7.5 Validation UX

Test utilisateur sur prototype avant développement du studio : 5 particuliers et 5 responsables de club. Tâche de référence : créer un maillot aux couleurs d'un club avec logo, nom et numéro. Critère : 8 participants sur 10 terminent sans aide en moins de 10 minutes.

## 8. Modèle SaaS : offres, quotas, paiement

Quatre offres, toutes pilotées par la table `plan_features` : l'administration modifie une limite sans déploiement. Les prix ci-dessous sont indicatifs et seront validés après mesure du coût réel par export et par génération IA.

| Fonction | Free | Creator | Business | Enterprise |
| --- | --- | --- | --- | --- |
| Prix mensuel | 0 FCFA | 9 900 FCFA | 29 900 FCFA | Sur devis |
| Prix annuel (2 mois offerts) | – | 99 000 FCFA | 299 000 FCFA | Sur devis |
| Membres | 1 | 1 | 10 inclus, 2 500 FCFA par membre en plus | Illimité |
| Designs actifs | 5 | Illimité | Illimité | Illimité |
| Catalogue | 3 modèles de base | Complet hors uniformes | Complet | Complet + modèles privés |
| Exports par mois | 10, filigrane, 1080p | 100, 4K, sans filigrane | 500, 4K | Sur mesure |
| Export PDF fiche produit | Non | Oui | Oui, à la marque de l'organisation | Oui |
| Export GLB | Non | Oui | Oui | Oui |
| Crédits IA par mois | 10 | 200 | 1 000 partagés | Sur mesure |
| Stockage | 200 Mo | 5 Go | 50 Go | Sur mesure |
| Kit de marque, validation, effectif | Non | Non | Oui | Oui |
| SSO, API, support dédié | Non | Non | Non | Oui |

**Crédits IA.** 1 crédit = 1 image de concept ; 1 motif raccordable = 2 crédits ; 1 palette = 0,5 crédit (arrondi au supérieur par lot) ; génération exploitable V2 = 5 crédits. Les crédits mensuels ne se reportent pas ; des packs ponctuels (100 crédits = 3 000 FCFA) sont valables 12 mois. Cible de marge : coût fournisseur inférieur à 30 % du prix facturé par crédit.

**Application des quotas.** Vérification côté serveur avant chaque action consommatrice (fonction SQL `consume_quota(workspace, feature, amount)` transactionnelle) ; affichage d'un `UsageMeter` à 80 % et d'un `UpgradeBanner` à 100 %. Un dépassement ne supprime jamais de données : il bloque seulement les nouvelles créations.

**Paiement.**

- Carte bancaire (EUR, XOF) via Stripe Billing : abonnements récurrents, factures automatiques.
- Mobile money (Orange Money, MTN, Moov, Wave) via un agrégateur régional : pas de prélèvement automatique fiable, donc paiement périodique avec rappel 7 jours et 1 jour avant l'échéance, et période de grâce de 7 jours.
- Essai gratuit Creator de 14 jours sans carte ; essai Business sur demande.
- Factures PDF conformes, numérotation continue, TVA selon le pays de l'organisation.

## 9. Roadmap, MVP, recette et risques

La V1 se livre en 28 semaines avec une équipe de 2 développeurs full-stack, 1 développeur 3D/WebGL, 1 artiste 3D (Blender) et 1 designer UI/UX à mi-temps. Le premier jalon est un go / no-go technique sur le moteur de personnalisation, parce que c'est à la fois le plus gros risque et le principal avantage concurrentiel.

&#91;embedded content: roadmap V1 · 28 semaines, 3 jalons\]

Le socle SaaS et le pipeline 3D avancent en parallèle du prototype ; rien de commercial n'est construit avant la validation du moteur en semaine 6.

### 9.1 Périmètre MVP (V1)

| Dans la V1 | Reporté |
| --- | --- |
| 3 modèles : T-shirt, maillot de football, hoodie | 6 autres familles (V1.1 et V1.2, environ 2 semaines par famille) |
| Couleurs, matières, motifs par zone ; rendu PBR | Plis pré-calculés (V1.1), simulation interactive (V2) |
| Textes, numéros, logos, images ; calques ; undo/redo | Détourage automatique (V1.1) |
| Effectif CSV et variantes par joueur | – |
| IA : concepts, motifs, palettes | Génération exploitable et suggestions (V2) |
| Export PNG, JPG, PDF ; partage par lien | GLB et pack ZIP (V1.1), gabarits fabrication (V2), intégration fabricants (V3) |
| Espaces, rôles, kit de marque, validation | Commentaires 3D (V1.1), SSO (Enterprise) |
| Abonnements carte + mobile money, quotas | API publique (Enterprise) |

### 9.2 Critères de recette

| ID | Scénario | Résultat attendu |
| --- | --- | --- |
| REC-01 | Inscription par email puis Google | Compte et espace personnel créés, email vérifié |
| REC-02 | Créer une organisation et inviter un membre | Le membre rejoint avec le rôle choisi |
| REC-03 | Ouvrir un modèle depuis le catalogue | Silhouette en moins de 1,5 s, HD en moins de 4 s |
| REC-04 | Rotation 360° et vues prédéfinies | 60 i/s sur la machine de référence |
| REC-05 | Changer couleur et matière de 3 zones | Rendu immédiat, sauvegardé en moins de 5 s |
| REC-06 | Importer un logo SVG et le placer sur la poitrine | Position conservée après rechargement, net en export 4K |
| REC-07 | Nom + numéro au dos, effectif de 20 joueurs | 20 variantes correctes dans l'export groupé |
| REC-08 | Fermer l'onglet en cours d'édition puis rouvrir | Aucune perte au-delà des 5 dernières secondes |
| REC-09 | Exporter PNG, JPG, PDF | Fichiers conformes au design affiché |
| REC-10 | Générer 4 concepts IA | Job suivi jusqu'au résultat, crédits débités ; remboursés si échec |
| REC-11 | Utilisateur de l'organisation A appelle l'API sur une ressource de B | Aucune donnée renvoyée (test automatisé) |
| REC-12 | Atteindre la limite d'exports Free | Export bloqué, proposition de mise à niveau, aucune donnée perdue |
| REC-13 | Payer Creator par mobile money | Abonnement actif après confirmation du webhook |
| REC-14 | L'admin importe un GLB conforme et nomme ses zones | Modèle publié dans le catalogue sans développement |
| REC-15 | Validation d'un design par un reviewer | Statut « approuvé », design verrouillé en édition |

### 9.3 Risques

| Risque | Impact | Parade |
| --- | --- | --- |
| Logos déformés aux coutures | Fort | Zones de placement dépliées d'un seul tenant ; test sur les 3 modèles dès le prototype |
| Modèles 3D hétérogènes | Fort | Conventions de nommage et script de validation Blender bloquant |
| Lenteur sur machines modestes et 3G | Fort | Meshopt + KTX2, chargement progressif, rendu à la demande, plafond 60 000 triangles |
| Coût IA supérieur aux revenus | Moyen | Crédits, coût affiché avant lancement, suivi du coût par jour, changement de fournisseur possible |
| Encaissement mobile money sans récurrence | Moyen | Rappels d'échéance, période de grâce, offre annuelle |
| Fuite de données entre organisations | Fort | RLS partout, tests pgTAP en CI, revue de sécurité avant lancement |
| Logos de marques protégées importés | Moyen | Conditions d'utilisation, signalement, modération |
| Rendu export différent du studio | Moyen | Même scène R3F rendue par Chromium headless |

### 9.4 Décisions à figer avant la semaine 1

- [ ] Conventions de modèles 3D : nommage des zones, densité UV, budget de triangles.
- [ ] Format du document de design v1 (section 5.4) et règles de migration.
- [ ] Projection en espace UV (section 4.3) plutôt que décalques 3D.
- [ ] Modèle d'espaces unique (personnel ou organisation) et matrice des rôles.
- [ ] Agrégateur mobile money et fournisseurs IA retenus.
- [ ] Source des 3 modèles de référence : modélisation interne ou achat sous licence commerciale.

**Prochaine étape recommandée :** lancer le prototype du studio (semaines 1 à 6) sur le T-shirt : chargement GLB, couleurs par zone, un logo et un texte placés par raycast en espace UV, sauvegarde du document JSON, export PNG.
