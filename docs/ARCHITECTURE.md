# Architecture — Taqendurt (Robes Kabyles)

## Vue d'ensemble

```
┌────────────────────────────── Navigateur (mobile-first) ──────────────────────────────┐
│  /  (route unique) → AppShell (SPA hash-routée)                                       │
│  #/ · #/catalog · #/product/:id · #/cart · #/checkout · #/confirmation/:n · #/track   │
│  #/about · #/contact · #/size-guide · #/legal/:slug · #/admin(/…)                     │
│  Providers : Theme (dark défaut) · I18n (fr/ar RTL) · PublicData · Cart (Zustand)     │
└──────────────┬────────────────────────────────────────────────────────────────────────┘
               │ fetch JSON (api-client)
┌──────────────▼────────────────────────────────────────────────────────────────────────┐
│  API REST (Next.js Route Handlers)                                                    │
│  Public : /api/meta · /api/products[/:id] · /api/orders (POST) · /api/track · /contact │
│  Admin  : /api/admin/** (login, stats, orders[/:id], products[/:id], upload,          │
│           fabrics|colors|embroideries|categories, shipping, messages, settings, …)     │
│  Garde : Zod (parseBody) + rateGuard + sameOriginGuard + requireAdmin(roles)          │
└──────────────┬────────────────────────────────────────────────────────────────────────┘
               │ Prisma ORM
┌──────────────▼────────────────────────────────────────────────────────────────────────┐
│  SQLite (dev) / PostgreSQL (prod docker-compose) — 14 tables (voir schéma ci-dessous) │
│  Stockage images : public/uploads (abstraction StorageDriver → S3/R2 possible)        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## Schéma de données (prisma/schema.prisma)

```
User 1─┬─* Session                     (auth admin : bcrypt + token cookie httpOnly)
       └─ (rôle : admin | staff)

Category 1──* Product 1──┬─* ProductImage        (photos ordonnées)
                         ├─* ProductFabric ──* Fabric        (supplément PRODUIT + colorsJson
                         │        │                           = couleurs autorisées pour ce tissu,
                         │        └── * Color (via colorsJson) [] ⇒ toutes les couleurs produit)
                         ├─* ProductColor ──* Color
                         └─* ProductEmbroidery ──* EmbroideryOption (supplément)

Order 1──┬─* OrderItem          ★ SNAPSHOT : productName, fabricName, colorName/Hex,
         │                        embroideryJson, measurementsJson, unitPrice, lineTotal…
         │                        → modifier le catalogue ne change JAMAIS une ancienne commande
         ├─* OrderStatusHistory  (statut, note, actor, createdAt → horodaté « qui, quand »)
         └── (statuts : pending → validated → crafting → ready → shipped → delivered
                        + cancelled | refused avec refusalReason)

ShippingRate (wilayaCode 1..58, homePrice, active)   → frais livraison domicile
ContactMessage (new | read | handled)                → formulaire contact, visible admin
SiteSetting (clé/valeur)                             → identité, coordonnées, réseaux,
                                                       textes accueil, bannière, adminEmail
MailLog (sent | logged | error)                      → notifications email (SMTP optionnel)
```

## Flux de commande (le cœur)

```
CLIENT                            SERVEUR (/api/orders)                     ADMIN
─────                             ─────────────────────                     ─────
1. Configure (tissu, couleur,
   taille/mesures, broderie…)     ┌──────────────────────────┐
   → prix ESTIMÉ client           │ VALIDATION Zod           │
   (lib/pricing.ts,               │ + honeypot vide          │
    compteur animé)               │ + rate limit 5/10min     │
                                 │                          │
2. POST /api/orders              │ POUR CHAQUE ITEM :       │
   { items[], customer{} }        │  produit visible ?       │
   ⚠ AUCUN prix envoyé           │  ProductFabric existe ?  │
                                 │  couleur ∈ tissu ∧ produit?              3. Notification
                                 │  broderies ∈ produit ?   │               (email SMTP ou
                                 │  sur-mesure ⇒ 6 mesures │               MailLog + badge
                                 │    dans leurs plages ?   │               dans l'admin)
                                 │                          │
                                 │ RECALCUL AUTORITAIRE :   │
                                 │  unit = base + tissu     │
                                 │        + broderies       │
                                 │        + sur-mesure      │
                                 │  total = Σ(unit×qty)     │
                                 │        + ShippingRate    │
                                 │                          │
                                 │ CRÉATION : Order         │
                                 │  n° RK-AAAA-NNNN         │
                                 │  + items SNAPSHOT        │
                                 │  + history(pending)      │
3bis. → Confirmation (n°)        └──────────────────────────┘
                                                                      4. Voit le détail complet
                                                                      5. VALIDER / REFUSER(motif)
                                                                      6. Statuts + notes internes
                                                                      7. Modification (si pending)
                                                                      8. WhatsApp / fiche atelier
6bis. Suivi #/track
      (n° + tél) → statut,
      historique complet
```

**Règle d'or** : le client n'envoie aucun montant. Le serveur reconstruit chaque prix depuis la base (`lib/pricing.ts` partagé client/serveur pour l'estimation). Un prix manipulé côté navigateur est donc impossible par construction.

## Flux d'authentification admin

```
POST /api/admin/login {email, password}
  → bcrypt.compare ; rate limit 8/10min/IP ; message 401 générique
  → Session{token aléatoire 32o, expiresAt +7j} en base
  → Set-Cookie rk_session (httpOnly, SameSite=Lax, secure en prod)
Chaque route /api/admin/* → getAuthUser() : session valide + non expirée
  → requireAdmin() : connecté   ·   requireAdmin(["admin"]) : rôle admin
Rôles : admin (tout) · staff (commandes, messages, stats, mot de passe)
```

## i18n (fr / ar + préparation kab)

- `src/i18n/index.ts` : fusion profonde des dictionnaires par domaine, `t(key, vars)` avec repli FR, `L(obj, "title")` pour les champs bilingues de la base (`title/titleAr`…)
- Direction : `dir` sur `<html>` (script inline pré-peinture anti-flash), police Cairo en RTL
- Ajouter le kabyle = créer `src/i18n/dict/kab-*.ts` + l'inscrire — aucun autre changement

## Performance & animations

- **Un seul tempo** : tokens `--dur-fast/base/slow` + courbe `--ease-soft` (globals.css)
- Animations uniquement `transform`/`opacity` ; barre de progression en `scaleX`
- `prefers-reduced-motion` : MotionConfig `reducedMotion="user"` + media query CSS globale + garde JS (Lenis, particules, curseur)
- Appareils faibles / save-data : particules, parallaxe, Lenis et curseur personnalisé désactivés
- Bundle initial minimal : toutes les vues hors accueil en `next/dynamic` (skeleton de chargement)
- Images : next/image (AVIF/WebP), `sizes` responsives, placeholder flou maison, qualités graduées
- LCP : hero prioritaire (`priority`), police `display: swap`

## Sécurité (résumé)

| Mesure | Où |
|---|---|
| Validation Zod client + serveur | `src/lib/validators.ts`, composants |
| Prix autoritaire serveur | `src/app/api/orders/route.ts` + `src/lib/pricing.ts` |
| Rate limiting mémoire (IP+bucket) | `src/lib/rate-limit.ts` (checkout/contact/login/track) |
| Honeypot | champs `website` (checkout + contact) |
| CSRF | cookies SameSite=Lax + garde same-origin sur mutations |
| Sessions | table `Session`, expiration vérifiée à chaque requête |
| Uploads | whitelist MIME, ≤ 5 Mo, renommage aléatoire (`src/lib/storage.ts`) |
| En-têtes | next.config.ts (X-Frame-Options, nosniff, Referrer-Policy…) |
| Secrets | uniquement `.env` (voir `.env.example`) |

## Points d'extension prévus

- **Paiement en ligne CIB/Edahabia (SATIM)** : créer `/api/payments/init` après `POST /api/orders`, statut intermédiaire `awaiting_payment` avant `pending` — le modèle de statuts et l'historique l'absorbent sans migration cassante.
- **S3/R2** : implémenter `StorageDriver` (interface de `src/lib/storage.ts`) et appeler `setStorageDriver()` au démarrage.
- **Kabyle (tamazight latin)** : voir §i18n.
- **Redis multi-instances** : remplacer la Map de `rate-limit.ts` par un store partagé.
