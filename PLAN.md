# PLAN — WEAR3D STUDIO

Référence : `docs/Cahier des charges — WEAR3D STUDIO.md` (CDC) et maquettes `docs/maquette/*.png`, `docs/WEAR3D Studio 3D Design Suite.png`.
En cas de conflit, **les maquettes font foi pour l'apparence**, **le CDC fait foi pour le fonctionnel et la technique**. Les écarts sont listés en section 3.

Dernière mise à jour : 19 nov. 2026.

---

## 1. Principes

1. Périmètre V1 = MVP du CDC §9.1 (T-shirt, maillot de football, hoodie).
2. Le moteur de personnalisation passe d'abord (go / no-go en fin de phase 1) ; rien de commercial avant.
3. `packages/design-schema` (Zod) est le contrat central, écrit avant le moteur.
4. Monorepo pnpm + Turborepo, arborescence du CDC §4.2.
5. Chaque phase se termine par : démo vérifiable, tests verts (lint, typecheck, Vitest, pgTAP si SQL), validation avant la phase suivante.
6. Décisions par défaut (modifiables) : Supabase en ligne (projet hébergé, région UE), T-shirt GLB procédural temporaire, adaptateurs factices pour IA et mobile money tant que les fournisseurs ne sont pas choisis.

---

## 2. Direction artistique (issue des maquettes)

### 2.1 Couleurs — tokens

Deux ambiances coexistent :

- **Marketing / authentification** : fond navy profond, halos bleu-violet, textes blancs, mot-clé du titre en bleu clair.
- **Application / studio** : fond gris-bleu très clair, cartes blanches, barre latérale navy, bouton d'action bleu électrique.

| Token                  | Clair                     | Sombre                    | Usage                                                             |
| ---------------------- | ------------------------- | ------------------------- | ----------------------------------------------------------------- |
| `--brand-navy-950`     | #060B1F                   | —                         | Fond des pages marketing (hero)                                   |
| `--brand-navy-900`     | #0A1638                   | —                         | Barre latérale app, rail d'outils du studio, bandeaux             |
| `--brand-navy-800`     | #12245A                   | —                         | Cartes sur fond navy, survols                                     |
| `--action`             | #1F5EFF                   | #4D7FFF                   | Boutons principaux, sélection, liens                              |
| `--action-hover`       | #184BD6                   | #6B95FF                   | Survol du bouton principal                                        |
| `--action-soft`        | #EAF0FF                   | #16244A                   | Fond de sélection (item actif, badge bleu)                        |
| `--brand-sky`          | #4C8DFF                   | #7AABFF                   | Mot-clé coloré des titres (« vêtements en 3D »)                   |
| `--accent-violet`      | #6A3CF0                   | #8F6BFF                   | IA, fin des dégradés CTA                                          |
| `--accent-violet-soft` | #F1ECFF                   | #231A47                   | Cartes IA, statistiques « créations »                             |
| `--accent-amber`       | #F5B70A                   | #FFC93D                   | Badge « Recommandé », couronne d'abonnement, bouton IA secondaire |
| `--accent-amber-soft`  | #FFF6DF                   | #3A2E0D                   | Carte « Générations IA »                                          |
| `--success`            | #16A34A                   | #34D399                   | Badge « Actif », coches, export terminé                           |
| `--success-soft`       | #E8F8EE                   | #0F2E1F                   | Carte « Stockage »                                                |
| `--warning`            | #D97706                   | #FBBF24                   | Quota à 80 %                                                      |
| `--danger`             | #E5484D                   | #FF6B6F                   | Croix du comparatif, erreurs                                      |
| `--background`         | #F4F7FE                   | #070D1F                   | Fond de page app                                                  |
| `--surface`            | #FFFFFF                   | #0E1730                   | Cartes, panneaux                                                  |
| `--surface-muted`      | #EEF2FB                   | #152042                   | Champs, onglets inactifs                                          |
| `--border`             | #E2E8F5                   | #22305A                   | Bordures de cartes et de champs                                   |
| `--foreground`         | #0B1530                   | #EEF2FB                   | Texte principal                                                   |
| `--muted-foreground`   | #5B6585                   | #9AA6C7                   | Texte secondaire                                                  |
| `--viewport-bg`        | dégradé #EEF3FC → #DCE5F5 | dégradé #121C36 → #0A1226 | Fond de la scène 3D (neutre, ne dénature pas les couleurs)        |

Dégradés :

- `--gradient-cta` : `linear-gradient(90deg, #1F5EFF 0%, #6A3CF0 100%)` (bandeaux « Prêt à… », bouton « Créer mon compte »).
- `--gradient-hero` : `radial-gradient` bleu #1F5EFF à 25 % + violet #6A3CF0 à 15 % sur navy-950.
- `--glow` : `0 0 40px rgba(31,94,255,.45)` (anneau lumineux sous le vêtement).

### 2.2 Typographie

- **Titres** : Plus Jakarta Sans 700/800 (géométrique, proche des maquettes).
- **Interface et texte** : Inter 400/500/600.
- **Codes** (HEX, références) : Geist Mono.
- Échelle : 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40 / 56 px. Titres hero : 56 px, interlignage serré (1.05).

### 2.3 Formes et effets

- Rayons : 8 px (champs, petits boutons), **12 px** (boutons, cartes compactes), **16 px** (cartes, panneaux), **24 px** (bandeaux, carte d'authentification), pastille complète (filtres, badges).
- Ombres douces sur les cartes : `0 1px 2px rgba(11,21,48,.04), 0 8px 24px rgba(11,21,48,.06)`.
- Icônes Lucide 20 px (trait 1,75).
- Grille de 4 px ; conteneur marketing 1200 px ; gouttière mobile 16 px.

### 2.4 Composants repérés dans les maquettes

| Maquette                | Composants nouveaux ou précisés                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accueil                 | `MarketingNav` (liens + menus Solutions/Ressources, « Se connecter » en contour, « Essayer gratuitement » plein), `HeroStat`, `FeatureStrip`, `CategoryTile`, `StepCard` (1-4), `CtaBanner` dégradé                                                                                                                                                                                              |
| Produit                 | `FeatureCard` (icône sur pastille teintée), `StudioShowcase`, `PersonaCard`                                                                                                                                                                                                                                                                                                                      |
| Solutions               | `SolutionCard` (image, liste à coches, « Découvrir la solution »), `UseCaseCard`, `TestimonialCard` (étoiles)                                                                                                                                                                                                                                                                                    |
| Tarifs                  | `BillingToggle` (Mensuelle / Annuelle −20 %), `PlanCard` (variante mise en avant sur fond bleu + badge ambre), `PlanComparisonTable` (colonne mise en avant), `FaqAccordion`                                                                                                                                                                                                                     |
| Ressources              | `SearchBar` avec bouton, `FilterChip`, `ResourceCard` (badge format PNG/JPG/TTF/GLB, poids, vues, Télécharger), `DropZone`, `SupportCard`                                                                                                                                                                                                                                                        |
| Connexion / Inscription | `AuthLayout` scindé (panneau navy illustré à gauche, carte blanche à droite), `PasswordField` (œil), `PasswordRules` (8 caractères, 1 lettre, 1 chiffre), `SocialButtons` (Google, Microsoft, Apple), sélecteur « Profil d'utilisation »                                                                                                                                                         |
| Tableau de bord         | `AppSidebar` navy (item actif bleu plein, carte « Passer à Business »), `AppHeader` (recherche, notifications, aide, avatar + offre), `HeroBanner`, `SubscriptionCard` (crédits IA, stockage), `StatCard` teintée (+ tendance), `QuickAction`, `ProjectCard`, `ActivityFeed`, `PromoCard`                                                                                                        |
| Studio (planche)        | `StudioTopBar` (retour, nom, statut « Brouillon », bascule **Design / Simulation**, undo/redo, Partager, Exporter), `ToolRail` navy, `ToolPanel` (zones avec pastille couleur, couleurs récentes, sélecteur), `ViewThumbnails` (vues verticales à droite du viewport), `InspectorTabs` (Personnalisation / Calques), `PropertyRow` (X, Y, taille, rotation, opacité), `ExportDialog` avec aperçu |

---

## 3. Écarts maquettes ↔ CDC et arbitrages

| Sujet                       | CDC                                                                         | Maquettes                                                                             | Arbitrage                                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Palette                     | Sobre navy/blanc, un bleu #2876D2                                           | Bleu électrique, violet, ambre, dégradés                                              | **Maquettes** (tokens §2.1)                                                                                                           |
| Rayon / ombres              | 8 px, ombres limitées                                                       | 12–24 px, ombres douces                                                               | **Maquettes**                                                                                                                         |
| Studio                      | Sombre par défaut                                                           | Clair, rail navy                                                                      | **Maquettes** : clair par défaut, sombre en option                                                                                    |
| Prix                        | Free 0, Creator 9 900, Business 29 900 FCFA, Enterprise                     | Identiques                                                                            | OK                                                                                                                                    |
| Annuel                      | 2 mois offerts (≈ −17 %)                                                    | −20 %                                                                                 | **Maquettes** (−20 %), valeur en base dans `plans`                                                                                    |
| Quotas                      | Crédits 10/200/1000 ; stockage 200 Mo/5 Go/50 Go ; GLB dès Creator          | Crédits 0/50/300 ; stockage 500 Mo/10 Go/100 Go ; GLB dès Business ; Free = 3 projets | **Maquettes** pour le seed initial ; tout est dans `plan_features`, modifiable sans déploiement. À reconfirmer après mesure des coûts |
| Connexion                   | Email, Google, lien magique                                                 | Email, Google, Microsoft, Apple                                                       | **Les deux** : email + Google + Microsoft (Azure) + Apple + lien magique                                                              |
| Inscription                 | —                                                                           | Prénom, nom, email, mot de passe (règles), profil d'utilisation, CGU                  | **Maquettes** ; le profil alimente l'onboarding                                                                                       |
| Pages publiques             | `/`, `/catalogue`, `/galerie`, `/tarifs`                                    | + Produit, Solutions, Ressources                                                      | Ajout de `/produit`, `/solutions`, `/ressources`                                                                                      |
| Menu app                    | Tableau de bord, projets, bibliothèque, IA, exports, abonnement, paramètres | + Studio 3D, Catalogue, Projets partagés, **Commandes**                               | Tout sauf **Commandes** (vente hors périmètre V1) — entrée masquée jusqu'à la V3                                                      |
| Bascule Design / Simulation | Mode « porté » (F-51, V1.1)                                                 | Présente dans le studio                                                               | Bascule livrée en V1 : Simulation = environnement + rendu tissu ; plis morph en V1.1                                                  |

---

## 4. Arborescence des routes (`apps/web/src/app`)

| Groupe         | Routes                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `(marketing)`  | `/`, `/produit`, `/solutions`, `/tarifs`, `/ressources`, `/catalogue`, `/catalogue/[famille]/[modele]`, `/galerie`                                 |
| `(auth)`       | `/connexion`, `/inscription`, `/mot-de-passe`, `/verification`                                                                                     |
| `(onboarding)` | `/bienvenue`                                                                                                                                       |
| `(app)`        | `/app`, `/app/projets`, `/app/projets/[id]`, `/app/partages`, `/app/bibliotheque`, `/app/ia`, `/app/exports`, `/app/abonnement`, `/app/parametres` |
| `studio`       | `/studio/[designId]` (plein écran)                                                                                                                 |
| `org`          | `/org/[slug]`, `/membres`, `/equipes`, `/marque`, `/validation`, `/statistiques`, `/facturation`                                                   |
| `admin`        | `/admin/*`                                                                                                                                         |
| public         | `/s/[token]` (visualiseur partagé)                                                                                                                 |

---

## 5. Phases

### Phase 0 — Socle ✅ terminée (17 nov. 2026)

> Supabase est **hébergé en ligne** (pas d'instance locale) : migrations poussées avec `pnpm db:push` après `pnpm db:link`.

- Monorepo pnpm + Turborepo : `apps/web`, `apps/worker`, `packages/{ui, garment-engine, editor-2d, design-schema, ai-engine, billing, db}`, `supabase/`, `pipeline/blender/`.
- TypeScript strict partagé, ESLint 9 (flat config), Prettier, Vitest dans chaque package.
- `apps/web` : Next.js 15 (App Router), Tailwind CSS 4, tokens §2.1, polices §2.2, next-intl (fr par défaut, en), toutes les routes §4 en pages squelettes, clients Supabase (`@supabase/ssr`) et middleware de session, validation des variables d'environnement (Zod).
- `packages/ui` : utilitaire `cn`, composants de base au style shadcn (Button, Card, Badge, Input) + feuille de tokens.
- `apps/worker` : point d'entrée Node, squelette de consommateur pgmq.
- `supabase/` : `config.toml`, dossiers migrations/tests, `seed.sql`.
- `pipeline/blender/` : README des conventions + squelette du script de validation.
- CI GitHub Actions : install, lint, typecheck, test, build.
- **Démo** : `pnpm dev` affiche la page d'accueil squelette aux couleurs des maquettes ; `pnpm lint typecheck test build` passent.

### Phase 1 — Prototype moteur sur T-shirt (go / no-go) ✅ livrée (18 nov. 2026) — en attente de votre décision

- `design-schema` : schéma Zod v1 (CDC §5.4), jetons `{player.*}`, registre de migrations, fabriques de calques, tests.
- T-shirt GLB procédural conforme aux conventions : 5 zones `Zone_*`, une île UV par zone, **UV isotropes** (testé), 16 256 triangles, 368 Ko (`pnpm --filter @wear3d/garment-engine generate`).
- `garment-engine` : viewer R3F (`/react`), zones par nom de mesh, `MeshPhysicalMaterial` + sheen + normal map de maille procédurale par matière, 3 éclairages sans HDR externe, `frameloop="demand"`, 5 vues prédéfinies, capture PNG.
- `editor-2d` : composition de l'atlas UV 2048 px (Canvas 2D natif), géométrie et sélection des calques, historique par instantanés avec regroupement des gestes.
- Studio `/studio/[id]` : rail d'outils, panneaux (modèle, couleurs, matières, textes, images, numéros), inspecteur (propriétés, calques), Design/Simulation, glisser des calques sur la surface 3D, raccourcis, alerte < 150 dpi, import PNG/JPG/SVG contrôlé (signature binaire, SVG nettoyé), autosave IndexedDB (800 ms), export PNG 2048 px transparent.

**Résultats mesurés (navigateur réel, build de production)**

| Critère go / no-go                                | Résultat                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Logo net et non déformé                           | ✅ SVG rastérisé à 2048 px, aucune déformation en vue avant et 3/4                                           |
| 60 i/s en rotation                                | ✅ 60 i/s (ordinateur de développement, 4 calques)                                                           |
| Silhouette < 1,5 s                                | ⚠️ non mesuré formellement ; GLB de 368 Ko, viewport chargé à la demande (161 Ko de JS au premier affichage) |
| Position conservée après rechargement (REC-06/08) | ✅                                                                                                           |
| Annuler / rétablir                                | ✅ (gestes continus regroupés)                                                                               |

**Écarts assumés par rapport au CDC, à reprendre plus tard**

- Composition de l'atlas en Canvas 2D natif plutôt que Konva : même rendu en studio et en export ; Konva reste prévu pour la vue 2D à plat (phase 2).
- GLB non compressé (pas encore Meshopt/KTX2) : à ajouter au pipeline `gltf-transform` avec les vrais modèles.
- Forme du T-shirt procédurale (épaules et emmanchures simplifiées) : à remplacer par le modèle Blender définitif.
- Sélection des polices : 4 polices sur les 30 prévues.

### Phase 1 bis — Interface du studio conforme à la maquette ✅ (18 nov. 2026)

Maquette de référence : `docs/maquette/WEAR3D Studio 3D - Studio work space.png`.

- Barre supérieure navy : nom du design, « Enregistré à HH:MM », annuler/rétablir, Aperçu (rotation automatique), Rendu HD (atlas 4096 px, capture 3840 px), Partager (phase 5), Exporter (PNG transparent, JPG ; PDF et GLB annoncés).
- Rail gauche : Design, Textures, Logos, Textes, Éléments, Maquettes, Scènes, Paramètres.
- Bibliothèque : onglets Modèles (8 designs prêts à l'emploi, filtres catégorie/style), Couleurs, Motifs (7 motifs intégrés, placés ou répétés), Tissus (vignettes de maille).
- Barre d'outils flottante : sélection, déplacer l'élément, panoramique, rotation, zoom, plein écran.
- Scène : podium lumineux, bascule 3D/2D (vue à plat éditable), miniatures de vues, curseur 360°.
- Barre du bas : Vue (Face, Dos, Gauche, Droite), Couleurs rapides, Tissu.
- Calques : glisser-déposer, visibilité, menu d'actions, calques « Motif graphique » et « Couleur de base ».
- Inspecteur : Transformation (X, Y, W, H en px d'export, ratio lié, rotation, symétries), Apparence (opacité, mode de fusion), Effets (ombre portée, contour, lueur), Couleur.
- **Format de document v2** (CDC §5.4) : hauteur libre, symétries, mode de fusion, effets, couleur de motif ; migration automatique v1 → v2 testée.

Entre 1280 et 1536 px de large, Calques et Inspecteur s'empilent dans la colonne de droite.

### Phase 2 — Studio complet ✅ livrée (19 nov. 2026)

**Livré**

- Interface §2.4 : barre supérieure, rail, panneaux refondus (Textures, Logos, Textes, Éléments, Maquettes, Scènes, Paramètres), inspecteur, vues miniatures, bascule Design / Simulation.
- **Trois vues** : 3D, 2D à plat (glisser-déposer, déplacement d'un élément entre zones) et **Patron** (pièces, règles mm/cm/po, endroit/envers, plan de coupe, marges & assemblage, tailles & gradation, inspecteur de pièce, export PDF / PLT / SVG).
- Undo/redo (limite d'historique), raccourcis, calques et **groupes de calques** (regrouper, masquer, verrouiller, renommer, dupliquer, dissoudre, supprimer ; format de document étendu, rétro-compatible), motifs, numéros sportifs, alerte < 150 dpi, **bords de manche** réglables (couleur, hauteur, rayures) quand le modèle en a.
- **Contenus** : 23 maquettes, 21 logos, environ 50 éléments, 30 polices.
- **Trois vêtements** : T-shirt col rond, maillot de football (col en V), hoodie (manches longues, capuche). Changement de modèle depuis Paramètres en gardant les calques (annulable). Vue 2D et Patron adaptés à chaque vêtement (encolure, manches, capuche, dimensions).
- **Environnements d'éclairage** : Studio, Extérieur, Vitrine, Coucher de soleil, Boutique, Nuit (liés aux scènes).
- **États dégradés** : WebGL absent, hors ligne (reprise de l'enregistrement au retour du réseau), échec d'enregistrement avec « Réessayer », conflit entre onglets (autosave en pause, choix de la version).

**Reste à faire (reporté, non bloquant pour la Phase 3)**

- Formes 3D définitives : le maillot et le hoodie sont des modèles procéduraux (la capuche ressemble à un col roulé) ; les pièces du patron sont des gabarits par famille, pas des patrons de fabrication validés. Dépend de la décision « source des 3 modèles 3D » (§6).
- Liste de tissus propre au hoodie, vérification visuelle du maillot en 2D / Patron, états d'erreur testés seulement en conditions réelles pour le conflit.
- Mesure formelle du temps d'affichage de la silhouette (< 1,5 s).

### Phase 3 — Données, authentification, sauvegarde

32 tables + RLS + tests pgTAP ; authentification (email, Google, Microsoft, Apple, lien magique) ; espace personnel créé à l'inscription ; projets/designs, autosave 5 s avec `revision`, versions, corbeille ; reprise du brouillon local ; uploads sécurisés.

### Phase 4 — Pages publiques et espace client

Accueil, Produit, Solutions, Tarifs, Ressources, Catalogue, fiche modèle, Galerie (maquettes) ; authentification et onboarding ; tableau de bord, mes créations, bibliothèque, partages, exports, abonnement, paramètres.

### Phase 5 — Traitements asynchrones, exports, partage

`jobs` + pgmq + Realtime ; worker Playwright (PNG/JPG 4K, PDF fiche produit) ; liens de partage et visualiseur `/s/[token]`.

### Phase 6 — B2B

Organisations, invitations, rôles ; kit de marque ; circuit de validation ; effectif CSV et variantes ; export groupé ; statistiques.

### Phase 7 — IA

`ai-engine` multi-fournisseurs + modération ; concepts, motifs raccordables, palettes ; registre de crédits avec réservation et remboursement.

### Phase 8 — SaaS et administration

Plans et `consume_quota`, UsageMeter/UpgradeBanner ; Stripe + mobile money ; administration (import GLB et zones, matériaux, plans, utilisateurs, audit) ; Sentry, PostHog.

### Phase 9 — Recette

REC-01 à REC-15, E2E du parcours critique, performance (CDC §6.1), WCAG 2.2 AA, revue de sécurité.

---

## 6. Décisions encore ouvertes

- [ ] Fournisseur mobile money (CinetPay ou PayDunya).
- [ ] Fournisseurs IA (image ; LLM = Claude).
- [ ] Source des 3 modèles 3D définitifs.
- [ ] Quotas définitifs par offre (§3).
- [ ] Projet Supabase distant (staging / production).
