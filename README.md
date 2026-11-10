# Taqendurt ⵣ — Boutique de robes kabyles

Site e-commerce complet de **vente et commande sur mesure de robes kabyles** (Algérie) : vitrine publique, catalogue avec configurateur, tunnel de commande, suivi client et back-office administrateur.

- **Monnaie** : Dinar algérien (DA) · **Paiement V1** : à la livraison / au retrait (aucun paiement en ligne)
- **Langues** : français (défaut) + arabe (RTL complet), structure prête pour le kabyle (tamazight latin)
- **Mobile-first** : 80 %+ du trafic attendu sur téléphone

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [PWA Installable](#pwa-installable)
3. [Stack technique & décisions](#stack-technique--décisions)
4. [Installation locale](#installation-locale)
5. [Comptes de démonstration](#comptes-de-démonstration)
6. [Commandes utiles](#commandes-utiles)
7. [Déploiement Docker / Coolify](#déploiement-docker--coolify)
8. [Premier compte admin en production](#premier-compte-admin-en-production)
9. [Sauvegardes](#sauvegardes)
10. [Structure du code](#structure-du-code)
11. [Sécurité](#sécurité)

---

## Fonctionnalités

### Vitrine publique (SPA hash-routée depuis `/`)
- **Accueil** : hero animé (parallaxe souris, particules dorées, motifs berbères), modèles à la une avec prix « à partir de X DA », collections, 4 étapes de commande, témoignages, présentation de l'atelier, bandeau promo configurable, CTA WhatsApp
- **Catalogue** : filtres (catégorie, tissu, couleur, occasion, fourchette de prix), tri (nouveautés, prix), chargement progressif, cartes produit avec transition d'élément partagé vers la fiche
- **Fiche produit** : galerie avec zoom + visionneuse plein écran, teinte de la couleur choisie appliquée au visuel (crossfade), description, **configurateur complet** (voir ci-dessous), produits liés, données structurées schema.org/Product
- **Configurateur** (cœur du projet) : tissu (avec supplément + échantillon photo), couleur (disponibilités par tissu), taille standard **ou sur-mesure** (6 mesures avec plages validées), longueur si applicable, broderies optionnelles, quantité, date d'événement, note libre — **prix mis à jour en temps réel** (compteur animé), barre de progression
- **Panier** : snapshot complet de la configuration, steppers quantité, suppression animée
- **Checkout** : coordonnées, 58 wilayas avec frais de livraison réels, livraison à domicile / retrait à l'atelier, honeypot anti-spam, paiement à la livraison
- **Confirmation** : numéro lisible `RK-2026-0001` + récapitulatif + prochaines étapes
- **Suivi de commande** : numéro + téléphone → statut, historique horodaté, articles, refus motivé le cas échéant
- **Pages** : guide des tailles illustré (SVG), à propos, contact (formulaire stocké en base + FAQ), CGV, retour/échange, confidentialité

### Back-office (`#/admin`, protégé par session)
- **Tableau de bord** : nouvelles commandes, en attente, CA du mois, messages non lus, top produits, dernières commandes
- **Commandes** : liste filtrable (statut, recherche nom/tél/numéro, wilaya), tri, pagination, **export CSV** ; détail complet (options, mesures, notes), **VALIDER / REFUSER (motif obligatoire)**, changement de statut avec **historique horodaté** (qui, quand), modification avant validation, note interne, **lien WhatsApp pré-rempli**, **fiche atelier imprimable**
- **Statuts** : En attente → Validée → En confection → Prête → Expédiée → Livrée (+ Annulée / Refusée)
- **Catalogue** : CRUD produits complet (FR/AR, prix, photos multiples ordonnées via upload local ou URL, tissus avec suppléments et couleurs autorisées, broderies, grille tailles), tissus / couleurs / broderies / catégories
- **Livraison** : frais par wilaya (58, édition en masse)
- **Messages** : statut lu/traité, réponse WhatsApp/email
- **Paramètres** : identité, coordonnées, réseaux sociaux, textes d'accueil, bannière promo, email admin, **changement de mot de passe**
- **Rôles** : `admin` (tout) et `staff` (commandes + messages)
- **Notifications** : email à l'admin à chaque commande (SMTP configurable ; sans SMTP, journalisation en base visible dans l'admin)

---

## PWA Installable

Le site est une **Progressive Web App** complète, installable sur Android et iOS :

### Fonctionnalités PWA
- ✅ **Installation native** : Android (prompt automatique), iOS Safari (guide illustré)
- ✅ **Prompt à la première visite** : invitation à installer l'app dès la première utilisation
- ✅ **Mode hors-ligne** : cache intelligent du shell et des assets
- ✅ **Mises à jour transparentes** : bandeau de notification quand une nouvelle version est disponible
- ✅ **Icônes adaptatives** : Android maskable + iOS apple-touch-icon
- ✅ **Raccourcis** : Boutique, Suivi de commande

### Stratégies de cache (Service Worker)
- **Shell** : network-first avec fallback cache
- **Assets** (images, fonts) : cache-first
- **API publique** (`/api/meta`, `/api/products`) : stale-while-revalidate
- **Jamais caché** : `/api/admin/*`, `/api/orders`, `/api/track`, toutes les mutations, réponses authentifiées

### Installation
**Android Chrome :**
1. Le prompt natif s'affiche automatiquement après 3 secondes (première visite) ou 5 secondes (visites suivantes)
2. Cliquer sur "Installer maintenant"
3. L'app apparaît sur l'écran d'accueil

**iOS Safari :**
1. Un guide illustré s'affiche automatiquement
2. Appuyer sur le bouton Partager (⎙) en bas
3. Choisir "Sur l'écran d'accueil"
4. Confirmer l'installation

### Mode Standalone
En mode installé :
- Navigation basse type app native (visible uniquement en standalone)
- Safe areas iOS respectées (`viewport-fit=cover`, `env(safe-area-inset-*)`)
- Pas de zoom involontaire sur les champs (font-size >= 16px)
- Gestion du retour système via le routage par hash

### Tests PWA
```bash
# Lighthouse PWA audit
npm install -g @lhci/cli
lhci autorun --config=lighthouserc.json

# Ou via Chrome DevTools > Lighthouse > Progressive Web App
```

### Génération des icônes PWA
Les icônes PNG doivent être générées à partir de `public/favicon.svg`.  
Voir `public/ICONS_README.md` pour les instructions complètes (ImageMagick, Inkscape, ou services en ligne).

Icônes requises :
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-512-maskable.png` (512×512, safe zone 80%)
- `apple-touch-icon.png` (180×180)

---

## Stack technique & décisions

| Domaine | Choix | Note |
|---|---|---|
| Framework | **Next.js 16** (App Router) + TypeScript 5 | Route unique `/` rendue en SPA hash-routée (contrainte de l'environnement de prévisualisation mono-port ; voir `src/lib/router.tsx`) |
| Styles | **Tailwind CSS 4** + shadcn/ui (New York) | Design system « futurisme kabyle » : tokens CSS, glassmorphism, accents or/rouge/émeraude/bleu électrique |
| Base | **Prisma ORM** | **SQLite** dans cet environnement ; bascule PostgreSQL documentée (aucun enum utilisé → changement de provider en 1 ligne) |
| Auth | Sessions serveur + **bcryptjs** | Cookie httpOnly `rk_session` (7 j), sessions stockées en base, expiration vérifiée |
| Validation | **Zod** côté client **et** serveur | Le serveur **recalcule toujours les prix** — le navigateur n'envoie aucun montant |
| i18n | Système maison léger (fr/ar + RTL) | `next-intl` inadapté au routage hash mono-page ; structure par domaine prête pour `kab` |
| Animations | **Motion (framer-motion)** + Lenis | Transitions de vues, révélations au scroll, parallaxe ; `prefers-reduced-motion` respecté globalement (MotionConfig) |
| Images | next/image + placeholder flou maison | AVIF/WebP automatique, `sizes` responsives, lazy loading |
| Emails | **nodemailer** (lazy) | Sans `SMTP_HOST` : journalisation en base (MailLog) — mode dégradé explicite |
| Tests | Non inclus | Contrainte de l'environnement de génération (pas de code de test) ; le parcours complet a été vérifié E2E au navigateur |

### Décisions prises sans confirmation (demandées par le cahier des charges)
- **Mono-page hash-routée** : la plateforme d'exécution n'expose que la route `/`. Toutes les « pages » sont des vues SPA (`#/catalog`, `#/product/:id`, `#/admin/orders`…). Les règles CSS View Transitions sont incluses mais les transitions inter-pages utilisent Motion (cohérence multi-navigateurs + exit animations).
- **SQLite ici, PostgreSQL en production** : le sandbox n'expose qu'un SQLite. Le schéma n'utilise ni enums ni types spécifiques → `docker-compose.yml` fournit PostgreSQL et le basculement est documenté.
- **3D légère remplacée par un canvas de particules maison** (~2 Ko) : objectif Lighthouse mobile > 90 prioritaire, Three.js écarté du bundle.
- **Retrait en boutique = gratuit** (atelier Tizi-Ouzou), livraison domicile = frais par wilaya.
- **`eventDate`** de chaque article est conservé dans le snapshot `note` de l'OrderItem (l'affichage reste complet côté admin).

---

## Installation locale

Prérequis : [Bun](https://bun.sh) 1.2+ (ou Node 20+ / pnpm en adaptant).

```bash
# 1. Dépendances
bun install

# 2. Variables d'environnement
cp .env.example .env
# → Éditer .env (DATABASE_URL local : file:./db/custom.db)

# 3. Schéma de base
bun run db:push

# 4. Données de démonstration (8 produits, 5 tissus, 8 couleurs,
#    4 broderies, 4 catégories, 58 wilayas, 3 commandes, 3 messages)
bun run db:seed

# 5. Démarrage
bun run dev        # → http://localhost:3000
```

## Comptes de démonstration

| Compte | Email | Mot de passe | Rôle |
|---|---|---|---|
| Admin | `admin@taqendurt.dz` | `Admin!2026` | Tout |
| Employé | `staff@taqendurt.dz` | `Staff!2026` | Commandes + messages |

→ Accès back-office : **`http://localhost:3000/#/admin`** (lien « Admin » dans le menu mobile).
⚠️ À changer immédiatement en production (voir plus bas).

Suivi de commande (page publique) : numéro + téléphone utilisé lors de la commande.

## Commandes utiles

```bash
bun run dev        # développement (port 3000)
bun run lint       # ESLint (0 erreur attendue)
bun run db:push    # applique le schéma Prisma
bun run db:seed    # réinsère les données démo (⚠️ wipe complet)
bun run build      # build production (standalone)
bun run start      # sert le build standalone
./scripts/backup.sh # sauvegarde base + uploads (voir §Sauvegardes)
```

---

## Déploiement Docker / Coolify

### Démarrage direct (SQLite — zéro configuration)

```bash
docker compose up -d --build
```

- Base **SQLite** sur le volume `appdata`, images uploadées sur le volume `uploads` — rien à configurer pour démarrer
- L'entrypoint (`scripts/docker-entrypoint.sh`) applique le schéma (`prisma db push`, idempotent, ne touche aucune donnée) puis démarre le serveur standalone
- **Auto-seed au boot** : si la base est vierge et `SEED_DEMO ≠ "false"`, les données de démonstration sont insérées (comptes, 8 produits, tissus, couleurs, 58 wilayas, 3 commandes)
- Healthcheck : `curl /api/meta` toutes les 30 s

Variables optionnelles (voir `.env.example`) : `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `SMTP_*`, `SEED_DEMO`.

### Déployer sur un VPS via GitHub + Coolify

1. **Pousser le code sur GitHub** (repo privé recommandé) :
   ```bash
   git init && git add . && git commit -m "Taqendurt V1"
   git branch -M main
   git remote add origin git@github.com:<votre-pseudo>/taqendurt.git
   git push -u origin main
   ```
   Le repo est auto-suffisant : `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example` (aucun secret n'est commité).

2. **Dans Coolify** : `+` → *New Resource* → **Docker Compose** (le repo contient `docker-compose.yml`) :
   - Source : votre dépôt GitHub (intégration *GitHub App* pour un repo privé)
   - Domaine : l'attacher au service `app` (port **3000**) — HTTPS automatique via le proxy Coolify
   - Onglet *Environment* : ajouter au minimum
     `NEXT_PUBLIC_SITE_URL=https://votre-domaine.dz` et `ADMIN_EMAIL=…`, plus le bloc `SMTP_*` pour les notifications email (sinon elles sont journalisées dans l'admin → *Paramètres*)
   - Volumes persistants `uploads` et `appdata` : déjà déclarés dans le compose
3. **Variante « Dockerfile »** : créer la ressource de type *Dockerfile*, port **3000**, mêmes variables, et déclarer deux *Persistent Storages* : `/app/data` et `/app/public/uploads`.
4. **Premier démarrage** : base créée + seedée automatiquement. Se connecter sur `https://votre-domaine/#/admin`, puis **changer immédiatement les mots de passe des comptes démo** (voir § ci-dessous).

### Bascule PostgreSQL (production)

Le schéma n'utilise aucun type spécifique SQLite :

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"   // ← était "sqlite"
  url      = env("DATABASE_URL")
}
```

Puis décommenter le service `postgres` (bas de `docker-compose.yml`) et définir :
```
DATABASE_URL="postgresql://taqendurt:PASSWORD@postgres:5432/taqendurt?schema=public"
POSTGRES_PASSWORD="PASSWORD"
```

Rebuild : `docker compose up -d --build`. Les volumes `uploads`/`appdata` restent valables (le volume `appdata` devient inerte).

---

## Premier compte admin en production

Le seed crée des comptes de démonstration. En production, après le premier démarrage :

```bash
# Depuis le dépôt (ou dans le conteneur : docker compose exec app …)
bun scripts/create-admin.ts amina@boutique.dz 'MotDePasseSolide1' "Amina" admin

# Puis désactiver/supprimer les comptes démo :
# admin → Paramètres → (ou directement en base via un script)
```

Le mot de passe est haché en **bcrypt** (coût 10). Exiger 8 caractères + lettre + chiffre.

---

## Sauvegardes

```bash
./scripts/backup.sh              # → ./backups/
./scripts/backup.sh /mnt/nas/dz  # destination personnalisée
```

- **SQLite** : snapshot cohérent (`VACUUM INTO`)
- **PostgreSQL** : `pg_dump` (binaire requis sur l'hôte/conteneur)
- **Uploads** : archive `tar.gz`
- Rétention : 30 jeux de sauvegardes

Crontab recommandé :
```cron
0 3 * * * cd /opt/taqendurt && ./scripts/backup.sh >> backups/backup.log 2>&1
```

Restauration :
```bash
cp backups/db-XXXX.sqlite db/taqendurt.db          # SQLite
psql "$DATABASE_URL" < backups/db-XXXX.sql         # PostgreSQL
tar -xzf backups/uploads-XXXX.tar.gz -C public     # images
```

---

## Structure du code

```
prisma/schema.prisma        # Modèle de données complet (14 tables)
prisma/seed.ts              # Données de démonstration FR/AR
scripts/                    # backup, create-admin, docker-entrypoint, db-empty-check
src/app/                    # layout racine (SEO, fonts) + page unique (SPA)
src/app/api/                # API REST (contrat : docs/API_CONTRACT.md)
  ├─ meta|products|orders|track|contact   # public
  └─ admin/…                               # protégé par session
src/lib/                    # router hash, pricing (source de vérité), validators Zod,
                            # auth (sessions bcrypt), rate-limit, mailer, storage, constantes (58 wilayas)
src/i18n/                   # noyau + dictionnaires par domaine (fr/ar)
src/components/
  ├─ app/app-shell.tsx      # orchestrateur SPA (providers, transitions, lazy loading)
  ├─ providers/             # thème, i18n, données publiques
  ├─ layout/                # navbar, footer, curseur, splash, particules, séparateurs berbères
  ├─ home|catalog|product/  # vitrine + configurateur (cœur métier)
  ├─ cart|checkout|confirmation|track/  # tunnel de commande
  ├─ pages/                 # à propos, contact, guide tailles, légal
  └─ admin/                 # back-office (11 vues)
docs/API_CONTRACT.md        # contrat API exhaustif (fait foi)
docs/ARCHITECTURE.md        # schéma de données, flux, sécurité
```

---

## Sécurité

- **Validation serveur systématique** (Zod) : aucun prix, aucun montant n'est lu depuis le client
- **Prix recalculés serveur** à chaque commande depuis la base (source de vérité `src/lib/pricing.ts`)
- Auth : bcrypt + sessions en base + cookie **httpOnly/SameSite=Lax**, expiration serveur
- **Rate limiting** en mémoire : checkout 5/10 min, contact 3/15 min, login 8/10 min, track 20/5 min (par IP)
- **Honeypot** sur checkout et contact ; garde anti-CSRF sur les mutations (voir ci-dessous)
- En-têtes de sécurité (next.config.ts) : X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy
- Uploads : whitelist MIME, 5 Mo max, renommage aléatoire (stockage local, abstraction S3)
- Routes `/api/admin/*` : double vérification session + rôle (`requireAdmin`)
- Aucune donnée sensible côté client ; secrets uniquement via `.env`

### Garde anti-CSRF (robuste aux reverse-proxies)

Les mutations (POST/PUT/PATCH/DELETE) passent par `sameOriginGuard()` (`src/lib/api.ts`),
trois couches indépendantes — **une seule suffit à bloquer un site pirate** :

1. **Content-Type strict** : `application/json` ou `multipart/form-data` uniquement — un
   formulaire HTML cross-site ne peut pas forger ces types sans CORS.
2. **En-tête personnalisé `X-Requested-With: taqendurt-spa`** (constante `CSRF_MARKER`,
   posé par `src/lib/api-client.ts`) — impossible à ajouter cross-origin sans préflight
   favorable, que l'API n'accorde jamais.
3. **Vérification d'Origine** en meilleur effort : comparaison contre `Host`,
   `X-Forwarded-Host` (chaîne de proxies), `Forwarded`, `X-Original-Host` et la
   configuration explicite. On ne bloque que si un hôte **public** de confiance est connu ;
   derrière un proxy qui réécrit `Host` sans transmettre d'en-têtes de transfert
   (hébergeurs managés), les couches 1-2 + `SameSite=Lax` assurent la protection.

> **Décision notée** : la première version comparait `Origin` à `Host` strictement —
> elle rejetait les clients légitimes derrière la gateway de la plateforme (403
> « Requête cross-origin refusée » à la connexion admin). Corrigé en `e56059c`.

**Variables d'environnement utiles** (optionnelles, `.env`) :
- `ALLOWED_ORIGINS="https://votre-domaine.dz,https://www.votre-domaine.dz"` — origines de
  confiance explicites si le site est servi derrière un proxy qui réécrit tout ;
- `APP_URL` / `NEXT_PUBLIC_SITE_URL` sont également prises en compte.

---

## Licence & crédits

Projet livré dans le cadre d'une commande privée. Design « futurisme kabyle » — motifs amazighs ⵣ réinterprétés, palette robes traditionnelles (or, rouge, émeraude, bleu électrique, noir, crème).

**Tanemmirt** — merci de votre confiance. ⵣ
