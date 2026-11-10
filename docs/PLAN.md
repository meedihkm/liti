# PLAN DE TRANSFORMATION — Taqendurt
## De boutique e-commerce à plateforme galerie/atelier complète

**Date** : 10 novembre 2026  
**Version** : 1.0  
**Statut** : En planification

---

## VISION

Transformer Taqendurt en une plateforme complète combinant :
- **GALERIE/VITRINE** : lookbook immersif, collections thématiques, storytelling des robes
- **COMMANDE CATALOGUE** : configurateur wizard tactile optimisé
- **SUR-MESURE LIBRE** : système de devis et d'échanges
- **SUIVI VIVANT** : chronologie avec photos d'avancement
- **APPLICATION** : PWA installable avec navigation native

---

## ÉTAT ACTUEL (V1)

### ✅ Ce qui existe déjà
- SPA hash-routée (#/catalog, #/product/:id, etc.)
- Configurateur produit avec tissu/couleur/taille/broderies
- Panier + Checkout avec 58 wilayas
- Suivi de commande (numéro + téléphone)
- Back-office admin complet (commandes, catalogue, messages)
- i18n FR/AR avec RTL
- PWA avec prompt d'installation
- Design "futurisme kabyle" établi

### ⚠️ Ce qui doit être transformé
- Migration du routage hash vers vraies routes Next.js
- Galerie immersive manquante
- Pas de système de devis sur-mesure
- Suivi basique sans photos d'avancement
- Pas d'historique client ni profil de mesures
- Contenu en dur, non gérable depuis l'admin

---

## ARCHITECTURE CIBLE

### Modèle de données (ajouts Prisma)

```prisma
// Nouveaux modèles

model TrackingToken {
  id        String   @id @default(cuid())
  orderId   String   @unique
  token     String   @unique // jeton non devinable
  order     Order    @relation(fields: [orderId], references: [id])
}

model OrderAdvancement {
  id          String   @id @default(cuid())
  orderId     String
  status      String   // step actuel
  message     String?  // message de l'atelier
  imageUrl    String?  // photo d'avancement
  actorName   String
  createdAt   DateTime @default(now())
  order       Order    @relation(fields: [orderId], references: [id])
}

model Quote {
  id              String   @id @default(cuid())
  number          String   @unique // DV-AAAA-NNNN
  customerId      String?
  customerName    String
  customerEmail   String?
  customerPhone   String
  wilaya          String
  description     String   // demande libre
  occasion        String?
  eventDate       DateTime?
  budget          Int?     // indicatif
  inspirationUrls String?  // JSON array
  measurements    String?  // JSON
  fabricPrefs     String?  // JSON
  status          String   // pending, quoted, accepted, refused, converted
  quotedPrice     Int?
  quotedDelay     Int?     // jours
  depositAmount   Int?
  depositReceipt  String?  // URL reçu
  adminNotes      String?
  exchanges       QuoteExchange[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model QuoteExchange {
  id        String   @id @default(cuid())
  quoteId   String
  author    String   // "customer" | "admin"
  message   String
  createdAt DateTime @default(now())
  quote     Quote    @relation(fields: [quoteId], references: [id])
}

model CustomerProfile {
  id            String   @id @default(cuid())
  phone         String   @unique
  name          String
  email         String?
  wilaya        String?
  savedMeasurements String? // JSON
  favorites     String?  // JSON array of product IDs
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Appointment {
  id          String   @id @default(cuid())
  customerName String
  customerPhone String
  customerEmail String?
  type        String   // "visit" | "fitting"
  date        DateTime
  timeSlot    String   // "9h-11h", "14h-16h"
  status      String   // "pending", "confirmed", "completed", "cancelled"
  notes       String?
  createdAt   DateTime @default(now())
}

model Review {
  id          String   @id @default(cuid())
  orderId     String?
  customerName String
  rating      Int      // 1-5
  comment     String?
  photoUrl    String?
  status      String   // "pending", "approved", "rejected"
  createdAt   DateTime @default(now())
}

model ContentBlock {
  id          String   @id @default(cuid())
  key         String   @unique // "hero_title", "atelier_intro", etc.
  type        String   // "text", "richtext", "image", "video"
  valueFr     String?
  valueAr     String?
  valueKab    String?
  imageUrl    String?
  isDemo      Boolean  @default(true)
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}

model PromoCode {
  id          String   @id @default(cuid())
  code        String   @unique
  type        String   // "percentage" | "fixed"
  value       Int
  minAmount   Int?
  maxUses     Int?
  usedCount   Int      @default(0)
  validFrom   DateTime
  validUntil  DateTime
  active      Boolean  @default(true)
}

model PushSubscription {
  id          String   @id @default(cuid())
  endpoint    String   @unique
  keys        String   // JSON {p256dh, auth}
  customerId  String?
  createdAt   DateTime @default(now())
}

model BlogPost {
  id          String   @id @default(cuid())
  slug        String   @unique
  titleFr     String
  titleAr     String?
  titleKab    String?
  contentFr   String
  contentAr   String?
  contentKab  String?
  excerpt     String?
  coverImage  String?
  category    String   // "conseil", "entretien", "histoire"
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  publishedAt DateTime?
}

// Modifications des modèles existants

model Order {
  // Ajouter
  trackingToken  TrackingToken?
  advancements   OrderAdvancement[]
  depositAmount  Int?     // acompte demandé
  depositPaid    Boolean  @default(false)
  depositReceipt String?  // URL reçu CCP/BaridiMob
  customerId     String?  // lien vers CustomerProfile
}

model Product {
  // Ajouter
  story          String?  // histoire de la robe FR
  storyAr        String?
  storyKab       String?
  region         String?  // région d'inspiration
  videoUrl       String?  // vidéo courte
  featured       Boolean  @default(false) // à la une
}

model Fabric {
  // Ajouter
  stockQuantity  Int?     // gestion de stock
  stockAlert     Int?     // seuil d'alerte
}
```

### Routes cibles (migration du hash vers App Router)

```
PUBLIC
/                           → Accueil immersif
/galerie                    → Lookbook/collections
/galerie/[collection]       → Collection thématique
/boutique                   → Catalogue produits
/boutique/[slug]            → Fiche produit
/creer-ma-robe              → Formulaire sur-mesure/devis
/panier                     → Panier
/commander                  → Checkout
/confirmation/[number]      → Confirmation commande
/suivi/[token]              → Suivi avec jeton magique
/suivi                      → Suivi avec numéro + téléphone
/atelier                    → Présentation atelier
/galerie-clientes           → Galerie clientes avec avis
/conseils                   → Blog/guides
/conseils/[slug]            → Article de blog
/guide-tailles              → Guide des tailles
/contact                    → Contact + RDV
/mon-espace                 → Espace cliente léger
/[page]                     → Pages statiques (cgv, confidentialite, etc.)

ADMIN
/admin                      → Dashboard atelier
/admin/commandes            → Kanban commandes
/admin/commandes/[id]       → Détail commande
/admin/devis                → Liste devis
/admin/devis/[id]           → Détail devis
/admin/catalogue            → Produits
/admin/contenu              → Gestion contenu site
/admin/galerie              → Galerie lookbook
/admin/blog                 → Articles blog
/admin/avis                 → Modération avis
/admin/rendez-vous          → Calendrier RDV
/admin/clientes             → Profils clientes
/admin/messages             → Messages contact
/admin/parametres           → Paramètres généraux
```

### Stratégie de migration du routage

**Étape 1 : Garder les deux systèmes en parallèle**
- Créer les nouvelles routes dans `src/app/` progressivement
- Garder le hash router actif pour les pages non migrées
- Redirection automatique des anciennes URLs hash vers les nouvelles

**Étape 2 : Migration par domaine fonctionnel**
1. Pages statiques (À propos, Contact, etc.)
2. Catalogue et fiches produits (avec ISR)
3. Panier et checkout
4. Suivi
5. Admin

**Étape 3 : Nettoyage final**
- Supprimer le hash router une fois tout migré
- Redirection 301 permanentes

---

## PHASE 0 : FONDATIONS ✅ (Déjà fait partiellement)

### 0.1 Bug Android au scroll ✅
- [x] Lenis désactivé sur tactile
- [x] backdrop-filter supprimé sur mobile
- [x] Canvas optimisé avec Intersection Observer
- [x] Mode léger automatique

### 0.2 Tests (À faire)
- [ ] Tests unitaires : `src/lib/pricing.test.ts`
- [ ] Tests unitaires : `src/lib/validators.test.ts`
- [ ] Test E2E : parcours de commande complet
- [ ] Test E2E : suivi de commande
- [ ] Configuration Vitest + Playwright

### 0.3 Migration routage - Fondations
- [ ] Créer la structure `src/app/(public)/` et `src/app/(admin)/`
- [ ] Configurer les layouts
- [ ] Système de redirections hash → routes
- [ ] Middleware pour SEO et Open Graph dynamiques

**Commit** : `Phase 0: Fondations - Tests et structure routage`

---

## PHASE 1 : GALERIE ET VITRINE

### 1.1 Accueil immersif
**Parcours** :
```
[Écran plein] → Hero avec vidéo/animation
  ↓
[2 boutons] "Explorer la galerie" | "Créer ma robe"
  ↓
[Si "Créer"] → 3 questions guidées:
  1. Quelle occasion? (mariage, fiançailles, henné, quotidien)
  2. Quel style? (traditionnel, moderne, karakou)
  3. Budget? (< 30k, 30-50k, 50-100k, > 100k DA)
  ↓
[Résultat] → Sélection personnalisée de 4-6 robes
```

**Fichiers** :
- `src/app/(public)/page.tsx` → Nouvelle page d'accueil
- `src/components/home/hero-immersive.tsx`
- `src/components/home/guided-quiz.tsx`
- `src/app/api/recommendations/route.ts`

### 1.2 Galerie / Lookbook
**Collections thématiques** :
- Mariage (thamghart)
- Fiançailles (lehulwa)
- Henné (lehnna)
- Quotidien (aliwen)
- Karakou

**Visionneuse** :
- Mode stories (swipe vertical/horizontal)
- Plein écran avec infos overlay
- Vidéos courtes intégrées
- Zoom sur détails

**Fichiers** :
- `src/app/(public)/galerie/page.tsx`
- `src/app/(public)/galerie/[collection]/page.tsx`
- `src/components/gallery/lookbook-viewer.tsx`
- `src/components/gallery/story-viewer.tsx`
- Mise à jour `prisma/schema.prisma` : ajout `Product.story`, `videoUrl`, `region`

### 1.3 Système de favoris
- Sauvegarde locale (localStorage)
- Lien partageable encodé
- Import/export JSON
- Si compte : synchronisé

**Fichiers** :
- `src/hooks/use-favorites.ts`
- `src/components/ui/favorite-button.tsx`
- `src/app/(public)/favoris/page.tsx`

### 1.4 Pages enrichies
- Atelier : équipe, savoir-faire, étapes fabrication
- Galerie clientes (avec modération)
- Blog/Conseils
- FAQ contextuelle

**Fichiers** :
- `src/app/(public)/atelier/page.tsx`
- `src/app/(public)/galerie-clientes/page.tsx`
- `src/app/(public)/conseils/page.tsx`
- `src/app/(public)/conseils/[slug]/page.tsx`
- `src/app/api/blog/route.ts`
- `src/app/api/reviews/route.ts`

**Commit** : `Phase 1: Galerie immersive, collections, favoris et contenu enrichi`

---

## PHASE 2 : COMMANDE CATALOGUE

### 2.1 Assistant configurateur ✅ (Déjà fait)
- [x] Wizard plein écran par étapes
- [x] Barre de progression en anneau
- [x] Prix collant en bas
- [x] Retours haptiques

### 2.2 Améliorations configurateur
- [ ] Aperçu 3D ou simulation de la teinte en temps réel
- [ ] Guide de mesures avec silhouette SVG animée
- [ ] Profil de mesures sauvegardé
- [ ] Délai estimé selon date événement
- [ ] Alerte si date trop proche
- [ ] Capacité atelier (admin définit nb max par semaine)

**Fichiers** :
- `src/components/product/measurement-guide.tsx`
- `src/components/product/capacity-check.tsx`
- `src/app/api/capacity/route.ts`

### 2.3 Checkout amélioré
- [ ] Codes promo
- [ ] Acompte (virement CCP/BaridiMob)
- [ ] Upload reçu de virement
- [ ] Validation acompte par admin avant confection

**Fichiers** :
- Mise à jour `src/components/checkout/checkout-view.tsx`
- `src/components/checkout/deposit-upload.tsx`
- `src/app/api/orders/route.ts` → ajout gestion acompte
- Mise à jour `prisma/schema.prisma` : `Order.depositAmount`, `depositPaid`, `depositReceipt`

**Commit** : `Phase 2: Configurateur amélioré et checkout avec acompte`

---

## PHASE 3 : SUR-MESURE LIBRE SUR DEVIS

### 3.1 Formulaire de demande
**Écran "Créer ma robe"** :
- Description libre (textarea riche)
- Occasion et date
- Budget indicatif
- Upload photos d'inspiration (multi)
- Mesures (optionnel à ce stade)
- Tissus et couleurs souhaités

**Fichiers** :
- `src/app/(public)/creer-ma-robe/page.tsx`
- `src/components/quote/quote-request-form.tsx`
- `src/app/api/quotes/route.ts`

### 3.2 Gestion devis (admin)
**Workflow** :
```
[Demande reçue]
  ↓
[Admin] Prépare devis (prix, délai, acompte, notes)
  ↓
[Cliente] Reçoit notif → Consulte devis
  ↓
[Cliente] Accepte OU Négocie (échange messages)
  ↓
[Si accepté] Paiement acompte
  ↓
[Admin valide] → Conversion en commande
```

**Fichiers** :
- `src/app/(admin)/devis/page.tsx`
- `src/app/(admin)/devis/[id]/page.tsx`
- `src/app/(public)/devis/[id]/page.tsx` → vue cliente
- `src/components/quote/quote-editor.tsx`
- `src/components/quote/quote-exchange.tsx`
- `src/app/api/admin/quotes/route.ts`
- `src/app/api/admin/quotes/[id]/route.ts`

**Commit** : `Phase 3: Système de devis et sur-mesure libre avec échanges`

---

## PHASE 4 : SUIVI ET RELATION

### 4.1 Suivi vivant avec chronologie
**Étapes enrichies** :
```
1. Commande reçue
2. Acompte validé ← BLOQUE jusqu'à validation
3. Tissu choisi [photo]
4. Coupe [photo patron]
5. Broderie [photo en cours]
6. Finitions [photo détails]
7. Prête [photo finale]
8. Expédiée [n° suivi]
9. Livrée
```

**Fichiers** :
- `src/app/(public)/suivi/[token]/page.tsx`
- `src/app/(public)/suivi/page.tsx` → saisie numéro/tél
- `src/components/track/timeline-vivante.tsx`
- `src/components/track/avancement-photo.tsx`
- `src/app/api/admin/orders/[id]/avancement/route.ts`
- Mise à jour `prisma/schema.prisma` : `OrderAdvancement`, `TrackingToken`

### 4.2 Messagerie commande
- Messages liés à une commande
- Cliente peut poser questions
- Admin répond depuis le détail commande

**Fichiers** :
- `src/components/track/order-messages.tsx`
- `src/app/api/orders/[id]/messages/route.ts`

### 4.3 Notifications
- Web Push (avec consentement)
- WhatsApp (lien pré-rempli)
- Email si SMTP

**Fichiers** :
- `src/lib/notifications.ts`
- `src/components/pwa/push-subscription.tsx`
- `src/app/api/push/subscribe/route.ts`

### 4.4 Après-livraison
- Demande d'avis avec photo
- Bouton "Recommander" (mesures pré-remplies)
- Suggestions d'accessoires

**Fichiers** :
- `src/components/track/post-delivery.tsx`
- `src/app/api/reviews/route.ts`

### 4.5 Espace cliente
**Accès par lien magique** (pas de mot de passe) :
- Mes commandes
- Mes mesures
- Mes favoris
- Mes devis

**Fichiers** :
- `src/app/(public)/mon-espace/page.tsx`
- `src/components/customer/customer-space.tsx`
- Mise à jour `prisma/schema.prisma` : `CustomerProfile`

**Commit** : `Phase 4: Suivi vivant, messagerie, notifications et espace cliente`

---

## PHASE 5 : APPLICATION INSTALLABLE (PWA) ✅

### Déjà fait
- [x] Manifest complet
- [x] Service Worker
- [x] Prompt d'installation (Android + iOS)
- [x] Icônes

### À améliorer
- [ ] Navigation basse en mode standalone
- [ ] Raccourcis dynamiques selon contexte
- [ ] Badge de notifications

**Fichiers** :
- `src/components/layout/bottom-nav.tsx` → mode standalone
- Mise à jour `public/manifest.webmanifest`
- Mise à jour `public/sw.js`

**Commit** : `Phase 5: PWA - Navigation standalone et raccourcis dynamiques`

---

## PHASE 6 : BACK-OFFICE

### 6.1 Dashboard "Atelier du jour"
**Vue Kanban** :
- Colonnes par étape de fabrication
- Drag & drop pour changer de statut
- Alertes de retard (date événement proche)
- Calendrier des événements
- Calendrier des RDV

**Fichiers** :
- `src/app/(admin)/page.tsx` → nouveau dashboard
- `src/components/admin/kanban-board.tsx`
- `src/components/admin/workshop-calendar.tsx`

### 6.2 Changement de statut rapide
- Upload photo + message en 2 gestes
- Aperçu de ce que verra la cliente
- Validation d'acompte avec reçu

**Fichiers** :
- `src/components/admin/quick-status-update.tsx`
- `src/components/admin/deposit-validation.tsx`

### 6.3 Gestion de contenu
**Page "Contenu du site"** listant tous les emplacements :
- hero_title, hero_subtitle, hero_cta
- atelier_intro, atelier_team, atelier_process
- about_story, about_values
- footer_description
- etc.

Pour chaque : indicateur "🟡 Démo" ou "🟢 Réel"

**Fichiers** :
- `src/app/(admin)/contenu/page.tsx`
- `src/components/admin/content-editor.tsx`
- `src/app/api/admin/content/route.ts`
- Mise à jour `prisma/schema.prisma` : `ContentBlock`

### 6.4 Gestion galerie lookbook
- Upload photos/vidéos
- Organisation par collection
- Publication/dépublication
- Ordre d'affichage

**Fichiers** :
- `src/app/(admin)/galerie/page.tsx`
- `src/components/admin/lookbook-manager.tsx`

### 6.5 Gestion blog
- Éditeur WYSIWYG (déjà présent : MDXEditor)
- Catégories
- Publication programmée
- Traductions FR/AR/KAB

**Fichiers** :
- `src/app/(admin)/blog/page.tsx`
- `src/app/(admin)/blog/[id]/page.tsx`
- `src/components/admin/blog-editor.tsx`

### 6.6 Modération avis
- Liste des avis en attente
- Approuver/Rejeter
- Masquer photo si inappropriée

**Fichiers** :
- `src/app/(admin)/avis/page.tsx`
- `src/components/admin/review-moderation.tsx`

### 6.7 Calendrier RDV
- Vue calendrier
- Créneaux disponibles configurables
- Confirmation/annulation
- Notifications

**Fichiers** :
- `src/app/(admin)/rendez-vous/page.tsx`
- `src/components/admin/appointment-calendar.tsx`
- `src/app/api/appointments/route.ts`

### 6.8 Profils clientes
- Historique complet
- Mesures sauvegardées
- Notes internes
- Tags (VIP, fidèle, etc.)

**Fichiers** :
- `src/app/(admin)/clientes/page.tsx`
- `src/app/(admin)/clientes/[id]/page.tsx`
- `src/components/admin/customer-profile.tsx`

### 6.9 Statistiques enrichies
- Ventes par période
- Modèles populaires
- Délais moyens par étape
- Taux de conversion devis
- Origine des commandes (galerie vs catalogue)

**Fichiers** :
- `src/app/(admin)/statistiques/page.tsx`
- `src/components/admin/stats-dashboard.tsx`
- `src/app/api/admin/stats/route.ts`

### 6.10 Gestion stock tissus
- Quantité en stock
- Seuil d'alerte
- Historique d'utilisation

**Fichiers** :
- `src/app/(admin)/stock/page.tsx`
- `src/components/admin/fabric-stock.tsx`
- Mise à jour `prisma/schema.prisma` : `Fabric.stockQuantity`, `stockAlert`

**Commit** : `Phase 6: Back-office - Dashboard atelier, contenu, galerie, blog, avis, RDV, stats`

---

## MIGRATION DU ROUTAGE (Transversal)

### Stratégie
1. **Coexistence** : Hash router + App Router en parallèle
2. **Redirection** : Middleware détecte hash et redirige
3. **Migration progressive** : Une section à la fois
4. **Nettoyage** : Suppression hash router en dernier

### Ordre de migration
1. Pages statiques → routes simples
2. Catalogue → avec ISR et revalidation
3. Produits → avec generateStaticParams
4. Panier/Checkout → routes dynamiques
5. Suivi → avec jeton
6. Admin → dernier (le plus complexe)

**Fichiers** :
- `src/middleware.ts` → redirections
- `src/app/(public)/layout.tsx`
- `src/app/(admin)/layout.tsx`
- Suppression progressive de `src/lib/router.tsx`

**Commit** : `Migration: Routage App Router complet avec redirections`

---

## TRADUCTIONS KABYLE (KAB)

### Structure
- Créer `src/i18n/dict/kab-*.ts` pour chaque domaine
- Ajouter `kab` aux providers
- Sélecteur de langue avec 3 options

### Fichiers à créer
- `src/i18n/dict/kab-common.ts`
- `src/i18n/dict/kab-product.ts`
- `src/i18n/dict/kab-checkout.ts`
- etc.

**Commit** : `i18n: Ajout du kabyle (tamazight latin) avec traductions de base`

---

## TESTS

### Tests unitaires (Vitest)
- `src/lib/pricing.test.ts`
- `src/lib/validators.test.ts`
- `src/lib/capacity.test.ts`

### Tests E2E (Playwright)
- `tests/e2e/order-flow.spec.ts` → Parcours commande complet
- `tests/e2e/quote-flow.spec.ts` → Demande devis
- `tests/e2e/tracking.spec.ts` → Suivi commande
- `tests/e2e/admin-workflow.spec.ts` → Workflow admin

**Commit** : `Tests: Unitaires et E2E pour parcours critiques`

---

## ESTIMATION

### Durée totale estimée : **15-20 jours de développement**

**Phase 0** : 2 jours (tests + fondations routage)  
**Phase 1** : 4 jours (galerie, lookbook, contenu)  
**Phase 2** : 2 jours (configurateur amélioré)  
**Phase 3** : 3 jours (système devis)  
**Phase 4** : 4 jours (suivi vivant, notifications, espace cliente)  
**Phase 5** : 1 jour (PWA améliorations)  
**Phase 6** : 5 jours (back-office complet)  
**Migration routage** : Transversal (inclus dans chaque phase)  
**Tests** : 2 jours  
**Documentation** : 1 jour

---

## PRIORITÉS SI TEMPS LIMITÉ

### Must-have (MVP étendu)
1. ✅ Bug Android scroll (fait)
2. ✅ PWA base (fait)
3. Migration routage (pages principales)
4. Galerie lookbook basique
5. Système devis
6. Suivi avec photos
7. Contenu gérable admin

### Should-have
- Favoris partageables
- Blog
- Notifications push
- Calendrier RDV
- Espace cliente

### Could-have
- Comparaison robes
- Guide animé mesures 3D
- Statistiques enrichies
- Gestion stock tissus

---

## RISQUES ET CONTRAINTES

### Techniques
- **Migration routage** : complexe, peut casser SEO si mal fait
- **ISR Next.js 16** : vérifier compatibilité avec SQLite
- **Notifications push** : nécessite HTTPS et permissions
- **Upload photos** : gestion espace disque

### Fonctionnels
- **Acompte** : processus manuel (virement), peut créer goulot
- **Modération** : charge de travail admin
- **Stock tissus** : nécessite discipline de mise à jour

### Mitigations
- Tests E2E pour éviter régressions
- Documentation utilisateur admin complète
- Alertes automatiques pour les actions requises
- Backups automatiques quotidiens

---

## CHECKLIST AVANT CHAQUE COMMIT

- [ ] `bun run lint` → 0 erreur
- [ ] `bun run build` → succès
- [ ] `docker compose build` → succès
- [ ] Tests concernés passent
- [ ] Documentation à jour
- [ ] Traductions FR/AR/KAB complètes
- [ ] Pas de régression i18n/RTL
- [ ] Pas de régression sécurité (CSRF, rate limiting, prix)

---

## LIVRABLES FINAUX

1. **Code source** : repo Git avec historique propre
2. **Documentation** :
   - README.md à jour
   - docs/ARCHITECTURE.md v2
   - docs/API_CONTRACT.md v2
   - Guide utilisateur admin
3. **Base de données** : seed complet avec données démo cohérentes
4. **Tests** : suite complète unitaires + E2E
5. **Liste emplacements de contenu** : à remplacer en production
6. **Checklist tests manuels** : Android Chrome + iOS Safari

---

**Prochaine étape** : Validation de ce plan et début Phase 0
