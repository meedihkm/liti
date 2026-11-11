# MODULE DE PRISE DE MESURES INTERACTIVES — Taqendurt

## Vue d'ensemble

Module d'acquisition de mesures corporelles pensé pour **mobile-first**, permettant à une cliente non experte de se mesurer seule avec confiance et plaisir. Remplace l'étape « Mesures » du configurateur actuel par un parcours guidé, gamifié et accessible.

### Objectifs
- ✅ **Faciliter** : guidage visuel et verbal étape par étape
- ✅ **Rassurer** : validation douce, pas de jugement, contrôles de cohérence bienveillants
- ✅ **Plaire** : animations fluides, interactions tactiles satisfaisantes
- ✅ **Mémoriser** : profils multiples, historique, réutilisation en un tap
- ✅ **Valider** : workflow atelier avec demande de correction

### Contraintes
- **Performance** : Android milieu de gamme, 60 fps constant, long tasks < 50 ms
- **Accessibilité** : WCAG AA, navigation clavier, lecteurs d'écran
- **i18n** : français/arabe avec RTL (les valeurs numériques restent cohérentes)
- **Sécurité** : données personnelles, pas de cache SW, rate limiting

---

## Architecture

### Intégration au flux existant

```
┌─────────────────────────── Configurateur (étapes actuelles) ───────────────────────────┐
│ 1. Tissu → 2. Couleur → 3. Taille/Mesures → 4. Broderie → 5. Quantité → 6. Panier     │
└───────────────────────────────────┬─────────────────────────────────────────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │  Taille standard (S/M/L…)   │
                     │          OU                  │
                     │  Sur-mesure (déclenche →)   │
                     └──────────────┬──────────────┘
                                    │
        ┌───────────────────────────▼───────────────────────────────────────┐
        │              MODULE DE PRISE DE MESURES (nouveau)                 │
        │  Lazy-loaded (dynamic import) uniquement quand nécessaire         │
        │                                                                    │
        │  Étape 0 : Choix personne + méthode + ajustement + conseils       │
        │  Étape 1 : Silhouette cliquable (zones tactiles)                  │
        │  Étape 2 : Règle tactile par mesure (drag/scroll + vibration)     │
        │  Étape 3 : Silhouette vivante (déformation en temps réel)         │
        │  Étape 4 : Contrôles de cohérence (doux, non-bloquants)           │
        │  Étape 5 : Récapitulatif + profil sauvegardé                      │
        │                                                                    │
        │  → Retour au configurateur avec measurements remplies             │
        └────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                              Cart → Checkout
                                    │
                                    ▼
                        POST /api/orders (validation serveur)
                                    │
                                    ▼
                        Admin : validation atelier
```

### Structure des fichiers

```
src/
├─ components/
│  └─ measurements/                          # Nouveau module (lazy-loaded)
│     ├─ measurement-wizard.tsx              # Composant racine, state machine
│     ├─ steps/
│     │  ├─ step0-setup.tsx                  # Choix personne/méthode/ajustement
│     │  ├─ step1-body-map.tsx               # Silhouette cliquable
│     │  ├─ step2-ruler.tsx                  # Règle tactile
│     │  ├─ step3-live-preview.tsx           # Silhouette vivante
│     │  ├─ step4-validation.tsx             # Contrôles cohérence
│     │  └─ step5-summary.tsx                # Récap + sauvegarde profil
│     ├─ ui/
│     │  ├─ body-silhouette.tsx              # SVG silhouette (face/profil)
│     │  ├─ measurement-ruler.tsx            # Règle défilante interactive
│     │  ├─ zone-highlight.tsx               # Halo animé sur zone active
│     │  ├─ tape-animation.tsx               # Animation mètre ruban
│     │  └─ progress-ring.tsx                # Anneau de progression
│     ├─ utils/
│     │  ├─ conversion.ts                    # cm ↔ pouces
│     │  ├─ estimation.ts                    # Taille/poids → mesures
│     │  └─ dress-reference.ts               # Largeur → tours
│     └─ hooks/
│        ├─ use-measurement-profile.ts       # CRUD profils
│        └─ use-coherence-check.ts           # Validation douce
│
├─ lib/
│  └─ measurements/
│     ├─ rules.ts                            # Règles de cohérence (configurable)
│     ├─ interpolation.ts                    # Déformation silhouette
│     └─ types.ts                            # Types partagés
│
├─ i18n/dict/
│  ├─ measurements-fr.ts                     # Dictionnaire mesures FR
│  └─ measurements-ar.ts                     # Dictionnaire mesures AR
│
└─ app/api/
   └─ measurements/
      ├─ profiles/route.ts                   # GET/POST profils utilisateur
      ├─ profiles/[id]/route.ts              # PUT/DELETE profil
      └─ validate/route.ts                   # POST validation cohérence côté serveur

prisma/
└─ schema.prisma                             # Nouveaux modèles (voir ci-dessous)
```

---

## Modèle de données

### Schéma Prisma (ajouts)

```prisma
// ── Profil de mesures (pour une cliente identifiée) ──────────────────
model MeasurementProfile {
  id          String   @id @default(cuid())
  userId      String?  // Nullable : lien magique sans compte
  sessionId   String?  // Fallback : identifiant de session temporaire
  
  name        String   // "Moi", "Ma fille Amira", "Ma sœur"
  relation    String   // "self" | "daughter" | "sister" | "other"
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  measurements MeasurementSet[]
  
  @@index([userId])
  @@index([sessionId])
}

// ── Jeu de mesures (historisé) ────────────────────────────────────────
model MeasurementSet {
  id        String   @id @default(cuid())
  profileId String
  profile   MeasurementProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  // Méthode d'acquisition
  method    String   // "tape" | "dress" | "estimation"
  
  // Valeurs en centimètres (JSON strictement typé côté serveur)
  // { chest: 92, waist: 74, hips: 102, length: 145, sleeve: 58, shoulders: 39 }
  valuesJson String  @map("values_json")
  
  // Ajustement choisi
  fit       String   @default("comfortable") // "fitted" | "comfortable" | "loose"
  
  // Unité d'affichage choisie par la cliente
  displayUnit String @default("cm") // "cm" | "inches"
  
  // Drapeaux de confirmation (mesures validées malgré alerte)
  confirmedJson String? @map("confirmed_json") // { chest: true, hips: true }
  
  // Note libre
  note      String?
  
  createdAt DateTime @default(now())
  
  validations MeasurementValidation[]
  
  @@index([profileId])
  @@index([createdAt])
}

// ── Validation atelier ─────────────────────────────────────────────────
model MeasurementValidation {
  id              String   @id @default(cuid())
  measurementSetId String
  measurementSet  MeasurementSet @relation(fields: [measurementSetId], references: [id], onDelete: Cascade)
  
  // Statut de validation
  status     String   // "pending" | "approved" | "needs_correction"
  
  // Si correction nécessaire, mesures concernées
  // { chest: "trop serré, prendre +2cm", waist: "vérifier" }
  correctionsJson String? @map("corrections_json")
  
  // Auteur (admin/staff)
  validatedBy String
  validatedAt DateTime @default(now())
  
  comment String?
  
  @@index([measurementSetId])
}

// ── Historique des modifications ───────────────────────────────────────
model MeasurementHistory {
  id              String   @id @default(cuid())
  measurementSetId String
  
  field      String   // "chest", "waist", etc.
  oldValue   Float
  newValue   Float
  
  modifiedBy String   // "client" | admin name
  modifiedAt DateTime @default(now())
  
  @@index([measurementSetId])
  @@index([modifiedAt])
}
```

### Migrations

```bash
# Migration non-destructive
npx prisma migrate dev --name add_measurement_module

# Seed de démonstration (2 profils exemples)
# Ajouté à prisma/seed.ts
```

---

## Parcours utilisateur détaillé

### Étape 0 : Configuration initiale

**Composant** : `step0-setup.tsx`

#### 0.1 Pour qui ?
```
┌────────────────────────────────────────┐
│  Pour qui prenez-vous ces mesures ?   │
├────────────────────────────────────────┤
│  [ 👤 Moi ]                            │
│  [ 👧 Ma fille ]                       │
│  [ 👭 Ma sœur ]                        │
│  [ ➕ Autre personne ]                 │
└────────────────────────────────────────┘
```
- Si "Autre", champ texte pour le nom
- Stocké dans `MeasurementProfile.name` + `relation`

#### 0.2 Méthode de mesure
```
┌────────────────────────────────────────┐
│  Comment voulez-vous mesurer ?         │
├────────────────────────────────────────┤
│  🎀 Avec un mètre ruban (recommandé)   │
│  👗 À partir d'une robe existante      │
│  📏 Estimation taille/poids            │
└────────────────────────────────────────┘
```

**Si "robe existante"** :
- Schéma SVG d'une robe à plat
- 4 mesures à relever : largeur épaules, poitrine, taille, hanches
- Conversion automatique : `tourPoitrine = largeurPoitrine × 2`
- Note : "longueur de la robe → longueur totale"

**Si "estimation"** :
```
┌────────────────────────────────────────┐
│  Votre taille : [___] cm               │
│  Votre poids  : [___] kg               │
│                                         │
│  ⚠️ Estimation indicative              │
│  Vous pourrez ajuster chaque mesure    │
└────────────────────────────────────────┘
```
- Algorithme simple (non médical, garde-fou large)
- Toutes les valeurs modifiables ensuite

#### 0.3 Ajustement
```
┌────────────────────────────────────────┐
│  Coupe souhaitée :                     │
├────────────────────────────────────────┤
│  [ Près du corps ]   Ajusté, moderne   │
│  [✓ Confortable ]    Aisance standard  │
│  [ Ample ]           Large, traditionnel│
└────────────────────────────────────────┘
```
- Ajoute une aisance (0 / +2 / +4 cm) transmise à l'atelier
- **N'altère PAS les mesures brutes saisies**

#### 0.4 Unités
```
┌────────────────────────────────────────┐
│  Unités :  ● cm    ○ pouces            │
└────────────────────────────────────────┘
```
- Stockage toujours en cm, conversion affichage uniquement

#### 0.5 Conseils (avant de commencer)
```
┌────────────────────────────────────────┐
│  📌 Conseils pour bien vous mesurer    │
├────────────────────────────────────────┤
│  • Faites-vous aider si possible       │
│    [animation 3s : 2 personnes]        │
│                                         │
│  • Portez des vêtements fins           │
│    [animation 3s : vêtements ajustés]  │
│                                         │
│  • Mètre souple, ni serré ni lâche     │
│    [animation 3s : ruban autour taille]│
│                                         │
│  [▶️ Suivant]                          │
└────────────────────────────────────────┘
```
- Animations SVG 3-5s en boucle (CSS ou Motion)
- Respecte `prefers-reduced-motion` (images fixes)

---

### Étape 1 : Silhouette cliquable

**Composant** : `step1-body-map.tsx`

```
┌────────────────────────────────────────┐
│  Tapez sur une zone pour commencer     │
│                                         │
│         😊 [silhouette SVG face]       │
│                                         │
│  [●] Épaules      [○] Longueur manche  │
│  [○] Poitrine     [○] Longueur robe    │
│  [○] Taille                            │
│  [○] Hanches                           │
│  [○] Tour de bras                      │
│                                         │
│  ●●●○○○○ 3/7 mesures                   │
└────────────────────────────────────────┘
```

**Interactions** :
- Tap sur zone → halo or/bleu électrique (Motion `animate`)
- Zoom léger sur la zone (scale 1.1)
- Animation mètre ruban qui s'enroule (SVG + Motion)
- Boucle 3-5s montrant le geste correct
- Phrase courte : "Le mètre passe sous les bras, au point le plus fort"
- Bouton "Mesurer" → Étape 2 pour cette zone

**Progression** :
- Pastilles : ○ (à faire) → ✓ (faite) avec animation de coche
- Anneau de progression global (`progress-ring.tsx`)
- Possible de mesurer dans n'importe quel ordre
- Bouton "Suivant" actif uniquement si toutes les mesures obligatoires sont faites

**Zones** (compatible avec `MEASUREMENT_FIELDS` existant) :
- `chest` : Tour de poitrine
- `waist` : Tour de taille
- `hips` : Tour de hanches
- `shoulders` : Largeur d'épaules
- `sleeve` : Longueur de manche
- `length` : Longueur totale
- *(optionnel selon produit : tour de bras, etc.)*

---

### Étape 2 : Règle tactile

**Composant** : `step2-ruler.tsx`

```
┌────────────────────────────────────────┐
│  [← Retour]  Tour de poitrine  [✓]    │
├────────────────────────────────────────┤
│                                         │
│         [Animation mètre ruban]         │
│                                         │
│           ╔═══════════╗                 │
│           ║    92     ║  cm             │
│           ╚═══════════╝                 │
│                                         │
│  ←──|─|─|─|─|─|─|─|─|─|─|─|─→          │
│   90  91  92  93  94  95                │
│                                         │
│  [−]  Saisir au clavier  [+]           │
│                                         │
│  Plage conseillée : 60–160 cm          │
│                                         │
│  [Précédent]            [Suivant]      │
└────────────────────────────────────────┘
```

**Interactions** :
1. **Règle défilante** (`measurement-ruler.tsx`)
   - Drag horizontal avec inertie (Motion `drag`)
   - Scroll-snap sur chaque cm
   - Graduations : 1 cm (grand trait), 0,5 cm (petit trait)
   - Vibration légère à chaque cm (10 ms, désactivable)
     - Android : `navigator.vibrate(10)`
     - iOS : pas de vibration, "tick" visuel (scale pulse)
   
2. **Valeur en grand**
   - `useMotionValue` + `transform` pour 60 fps
   - Mise à jour en temps réel sans re-render lourd
   
3. **Boutons +/−**
   - Incrémente/décrémente de 0,5 cm
   - Maintien → répétition accélérée
   
4. **Saisie clavier**
   - `<input type="number" inputMode="decimal" />`
   - `font-size: 16px` minimum (évite zoom iOS)
   - Validation plage min/max en temps réel

**Valeur de départ** :
- Si estimation taille/poids : valeur calculée
- Si robe de référence : valeur convertie
- Sinon : médiane de la plage (ex. 110 cm pour poitrine)

**Navigation** :
- "Suivant" → zone suivante de la silhouette
- "Précédent" → zone précédente
- Possibilité de retourner à la silhouette (Étape 1)

---

### Étape 3 : Silhouette vivante

**Composant** : `step3-live-preview.tsx`

**Pendant la saisie (Étape 2)** ou **en récapitulatif** :
- Silhouette SVG déformée en temps réel
- Interpolation des paramètres (paths SVG)
- Transitions douces (Motion `animate`, duration 0.3s)

**Algorithme de déformation** (`lib/measurements/interpolation.ts`) :
```typescript
// Exemple simplifié
function interpolateSilhouette(measurements: MeasurementValues) {
  const { chest, waist, hips, shoulders, length } = measurements;
  
  // Facteurs de scaling relatifs à une silhouette "médiane"
  const chestFactor = chest / 92;   // 92 = taille M
  const waistFactor = waist / 74;
  const hipsFactor = hips / 98;
  
  // Applique des transforms sur les segments SVG
  return {
    torsoWidth: chestFactor,
    waistWidth: waistFactor,
    hipsWidth: hipsFactor,
    shouldersWidth: shoulders / 40,
    totalHeight: length / 145,
  };
}
```

**Indicateur de proportions** :
- Si une mesure sort des ratios habituels :
  - Zone concernée pulse doucement en orange (Motion `animate` loop)
  - Icône ⚠️ à côté de la valeur
  - Pas bloquant, juste informatif

---

### Étape 4 : Contrôles de cohérence

**Composant** : `step4-validation.tsx`

**Règles** (`lib/measurements/rules.ts`) :
```typescript
export const COHERENCE_RULES = {
  // Plages absolues (déjà dans MEASUREMENT_FIELDS)
  ranges: { /* ... */ },
  
  // Rapports entre mesures
  ratios: [
    {
      name: "waist_vs_chest",
      check: (m) => m.waist < m.chest * 1.3,
      message: { 
        fr: "Le tour de taille est généralement inférieur au tour de poitrine",
        ar: "محيط الخصر عادة أقل من محيط الصدر"
      }
    },
    {
      name: "hips_vs_waist",
      check: (m) => m.hips > m.waist * 0.8,
      message: {
        fr: "Les hanches sont généralement plus larges que la taille",
        ar: "الوركان عادة أعرض من الخصر"
      }
    },
    {
      name: "sleeve_vs_length",
      check: (m) => m.sleeve < m.length * 0.6,
      message: {
        fr: "La longueur de manche semble disproportionnée",
        ar: "طول الكم يبدو غير متناسب"
      }
    }
  ],
  
  // Écart avec profil précédent (si existe)
  previousDelta: {
    threshold: 5, // cm
    message: {
      fr: "Cette mesure diffère de {delta} cm par rapport à votre dernier profil ({date})",
      ar: "هذا القياس يختلف {delta} سم عن ملفك الأخير ({date})"
    }
  },
  
  // Écart avec estimation taille/poids (si utilisée)
  estimationDelta: {
    threshold: 8,
    message: {
      fr: "Cette mesure s'éloigne de {delta} cm de l'estimation basée sur votre taille/poids",
      ar: "هذا القياس يبتعد {delta} سم عن التقدير بناءً على طولك/وزنك"
    }
  }
};
```

**UI** :
```
┌────────────────────────────────────────┐
│  ⚠️ Vérification des mesures           │
├────────────────────────────────────────┤
│                                         │
│  Tour de hanches : 95 cm               │
│  Cette mesure est inhabituelle.        │
│  Le tour de hanches est généralement   │
│  supérieur au tour de taille (74 cm).  │
│                                         │
│  [🔍 Je vérifie]  [✓ C'est correct]   │
│                                         │
└────────────────────────────────────────┘
```

**Comportement** :
- **Jamais bloquant** : toujours possibilité de confirmer
- Si "Je vérifie" → retour à la règle tactile pour cette mesure
- Si "C'est correct" → marqué comme confirmé (`confirmedJson`)
- Ton bienveillant, jamais de jugement
- Pas de normes médicales, juste des garde-fous larges

---

### Étape 5 : Récapitulatif

**Composant** : `step5-summary.tsx`

```
┌────────────────────────────────────────┐
│  Récapitulatif des mesures             │
├────────────────────────────────────────┤
│                                         │
│  [Silhouette avec annotations]         │
│                                         │
│  Poitrine    : 92 cm   [✏️]            │
│  Taille      : 74 cm   [✏️]            │
│  Hanches     : 102 cm  [✏️]  ⚠️        │
│  Épaules     : 39 cm   [✏️]            │
│  Manche      : 58 cm   [✏️]            │
│  Longueur    : 145 cm  [✏️]            │
│                                         │
│  Ajustement  : Confortable             │
│  Unités      : ● cm  ○ pouces          │
│                                         │
│  📝 Note (optionnel) :                 │
│  [Épaule droite légèrement plus large] │
│                                         │
│  [💾 Enregistrer ce profil]            │
│  Nom : [Mes mesures - Mars 2026]       │
│                                         │
│  [← Modifier]     [Valider ✓]         │
└────────────────────────────────────────┘
```

**Fonctionnalités** :
- **Édition rapide** : tap sur ✏️ → retour à la règle pour cette mesure
- **Bascule cm/pouces** : conversion en temps réel
- **Note libre** : textarea 500 caractères max
- **Sauvegarde profil** :
  - Nom auto-généré : "Mes mesures - {date}"
  - Stocké dans `MeasurementProfile` + `MeasurementSet`
  - Lié à la session (cookie/token) ou compte si connecté

**Retour au configurateur** :
- `measurements` object rempli et passé au parent
- Configurateur peut continuer (broderie, quantité, etc.)

---

## Profils multiples et historique

### Gestion des profils

**Hook** : `use-measurement-profile.ts`

```typescript
export function useMeasurementProfiles() {
  const { data: profiles } = useQuery({
    queryKey: ['measurement-profiles'],
    queryFn: () => fetch('/api/measurements/profiles').then(r => r.json())
  });
  
  const createProfile = useMutation({
    mutationFn: (data: ProfileCreateInput) => 
      fetch('/api/measurements/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json())
  });
  
  // ... update, delete
  
  return { profiles, createProfile, /* ... */ };
}
```

### UI de sélection (pour recommande)

```
┌────────────────────────────────────────┐
│  Utiliser des mesures existantes ?    │
├────────────────────────────────────────┤
│  ● Mes mesures (12/03/2026)           │
│    92-74-102 cm  ✓ Validé atelier     │
│                                         │
│  ○ Mesures d'Amira (05/01/2026)       │
│    85-68-94 cm  ⚠️ Il y a 5 mois       │
│                                         │
│  ○ Prendre de nouvelles mesures       │
│                                         │
│  [Continuer]                           │
└────────────────────────────────────────┘
```

**Suggestions** :
- Si mesures > 6 mois : badge "Il y a X mois" + suggestion de refaire
- Si écart > 3 cm entre dernière et avant-dernière : "Vos mesures ont changé"
- Possibilité d'ajuster un profil existant avant validation

---

## Validation par l'atelier (back-office)

### Onglet "Mesures" dans la commande

**Route** : `/api/admin/orders/:id` → champ `measurements` enrichi

```
┌────────────────────────────────────────────────────────────────┐
│  Commande RK-2026-0042 — Onglet Mesures                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Silhouette annotée]          [Tableau]                       │
│                                                                 │
│  Poitrine    : 92 cm  ✓                                        │
│  Taille      : 74 cm  ✓                                        │
│  Hanches     : 95 cm  ⚠️ Alerte (voir notes)                  │
│  Épaules     : 39 cm  ✓                                        │
│  Manche      : 58 cm  ✓                                        │
│  Longueur    : 145 cm ✓                                        │
│                                                                 │
│  Ajustement  : Confortable (+2 cm aisance)                     │
│  Méthode     : Mètre ruban                                     │
│  Date        : 15/03/2026 14:23                                │
│                                                                 │
│  ⚠️ Alertes :                                                  │
│  • Hanches : confirmé par cliente malgré ratio inhabituel      │
│                                                                 │
│  📝 Note cliente :                                             │
│  "Épaule droite légèrement plus large"                        │
│                                                                 │
│  ──────────────────────────────────────────────────────────    │
│                                                                 │
│  Statut validation : [ À vérifier ▼ ]                          │
│    • À vérifier                                                │
│    • Confirmée par l'atelier                                   │
│    • À corriger                                                │
│                                                                 │
│  💬 Note atelier (interne) :                                   │
│  [____________________________________________]                 │
│                                                                 │
│  [📞 Appeler] [📱 Demander correction WhatsApp]                │
│                                                                 │
│  [✓ Valider les mesures]                                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Workflow de validation

1. **Commande créée** → statut `pending`
2. **Admin ouvre la commande** → onglet "Mesures"
3. **Vérification visuelle** : silhouette + tableau + alertes
4. **Actions possibles** :
   - ✅ **Valider** → statut `approved`, commande peut passer en "Coupe"
   - ⚠️ **Demander correction** :
     - Sélectionner mesure(s) concernée(s)
     - Ajouter commentaire par mesure
     - Génère lien WhatsApp pré-rempli :
       ```
       Bonjour {nom},
       
       Concernant votre commande RK-2026-0042, pouvez-vous vérifier cette mesure :
       
       • Tour de hanches : actuellement 95 cm
         → Nous recommandons de reprendre cette mesure, elle semble serrée.
       
       Cliquez ici pour modifier : https://myrobe-giize.com/#/measurements/correct?token=...
       
       Merci !
       ```
   - 📞 **Appeler** → ouvre lien `tel:` avec le numéro

5. **Cliente corrige** (via lien magique) :
   - Module de mesures ouvert directement sur la mesure concernée
   - Valeur actuelle + commentaire atelier visible
   - Modification → sauvegarde automatique + notification atelier

6. **Règle configurable** (admin settings) :
   - "Bloquer la confection tant que les mesures ne sont pas validées"
   - Si activé : statut "Coupe" grisé tant que `MeasurementValidation.status ≠ approved`

### Historique des modifications

**UI dans l'onglet Mesures** :
```
┌────────────────────────────────────────┐
│  📜 Historique                         │
├────────────────────────────────────────┤
│  15/03 14:23 — Cliente                 │
│    Tour de hanches : 95 cm             │
│                                         │
│  16/03 10:15 — Samia (admin)           │
│    Tour de hanches : 95 → 102 cm       │
│    (correction après appel)            │
│                                         │
│  16/03 10:16 — Samia                   │
│    Statut : À vérifier → Confirmée     │
└────────────────────────────────────────┘
```

---

## Sécurité

### Protection des données personnelles

1. **Pas de mesures en clair dans les URLs**
   - Utilisation de tokens (`/measurements/correct?token=...`)
   - Token lié à la commande + expire après 7 jours

2. **Accès restreint**
   - Profils liés à `userId` (si connecté) OU `sessionId` (cookie)
   - Pas d'API publique listant tous les profils

3. **Pas de cache Service Worker**
   ```typescript
   // sw.ts
   if (url.pathname.startsWith('/api/measurements')) {
     return fetch(event.request); // Pas de cache
   }
   ```

4. **Rate limiting**
   ```typescript
   // lib/rate-limit.ts
   export const RATE_LIMITS = {
     // ...
     measurements: { max: 20, window: 60 * 1000 }, // 20 req/min
   };
   ```

5. **Suppression possible**
   - Cliente peut supprimer un profil
   - Cascade : `MeasurementProfile` → `MeasurementSet` → `MeasurementValidation`
   - Garder historique dans `Order.items[].measurementsJson` (snapshot)

6. **CSRF**
   - Garde `sameOriginGuard()` sur toutes les mutations
   - Cookie `SameSite=Lax`

---

## Qualité et tests

### Tests unitaires

**Fichier** : `src/lib/measurements/__tests__/`

1. **Conversion cm ↔ pouces**
   ```typescript
   test('convertCmToInches', () => {
     expect(cmToInches(100)).toBeCloseTo(39.37);
     expect(inchesToCm(39.37)).toBeCloseTo(100);
   });
   ```

2. **Méthode "robe de référence"**
   ```typescript
   test('dressReferenceConversion', () => {
     const flat = { shoulderWidth: 20, chestWidth: 46, waistWidth: 37, hipWidth: 51 };
     const result = convertFromDress(flat);
     expect(result.chest).toBe(92);  // 46 × 2
     expect(result.waist).toBe(74);  // 37 × 2
     expect(result.hips).toBe(102);  // 51 × 2
   });
   ```

3. **Estimation taille/poids**
   ```typescript
   test('estimationFromHeightWeight', () => {
     const result = estimateMeasurements({ height: 165, weight: 60 });
     expect(result.chest).toBeGreaterThan(80);
     expect(result.chest).toBeLessThan(110);
   });
   ```

4. **Règles de cohérence**
   ```typescript
   test('coherenceRules', () => {
     const m = { chest: 92, waist: 100, hips: 95, /* ... */ };
     const alerts = checkCoherence(m);
     expect(alerts).toContainEqual(
       expect.objectContaining({ field: 'waist', rule: 'waist_vs_chest' })
     );
   });
   ```

5. **Interpolation silhouette**
   ```typescript
   test('silhouetteInterpolation', () => {
     const m = { chest: 92, waist: 74, hips: 102, shoulders: 40, length: 145, sleeve: 58 };
     const factors = interpolateSilhouette(m);
     expect(factors.torsoWidth).toBeCloseTo(1.0); // 92/92
     expect(factors.waistWidth).toBeCloseTo(1.0); // 74/74
   });
   ```

### Test E2E (Playwright)

**Fichier** : `e2e/measurements.spec.ts`

```typescript
test('parcours complet de prise de mesures', async ({ page }) => {
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  // 1. Aller au configurateur
  await page.goto('http://localhost:3000/#/product/prod_xxx');
  
  // 2. Choisir "Sur-mesure"
  await page.click('text=Sur mesure');
  
  // 3. Étape 0 : choix
  await page.click('text=Moi');
  await page.click('text=Avec un mètre ruban');
  await page.click('text=Confortable');
  await page.click('button:has-text("Suivant")');
  
  // 4. Étape 1 : silhouette
  await page.click('[data-zone="chest"]');
  
  // 5. Étape 2 : règle tactile
  const ruler = page.locator('[data-testid="measurement-ruler"]');
  await ruler.drag Ruler({ x: -50, y: 0 }); // Drag to 92
  await page.click('button:has-text("Suivant")');
  
  // 6. Répéter pour chaque mesure
  // ...
  
  // 7. Étape 5 : récap
  await expect(page.locator('text=92 cm')).toBeVisible();
  await page.click('button:has-text("Valider")');
  
  // 8. Retour au configurateur
  await expect(page).toHaveURL(/#\/product\/prod_xxx/);
});

test('test en arabe (RTL)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('[data-lang="ar"]'); // Switch langue
  
  // Vérifier que la règle croît dans la bonne direction
  // Vérifier que les chiffres restent occidentaux
  // ...
});
```

### Performance

**Critères** :
- ✅ Aucune long task > 50 ms pendant le drag de la règle
- ✅ 60 fps constant (monitored avec Chrome DevTools Performance)
- ✅ Émulation CPU x4 (Android milieu de gamme)

**Optimisations** :
- `useMotionValue` + `transform` pour la règle (pas de re-render)
- `will-change: transform` sur éléments animés
- Debounce de la vibration (max 1 tous les 50 ms)
- Lazy loading du module entier (`dynamic(() => import(...))`)
- SVG optimisés (SVGO)

---

## i18n — Dictionnaires

### Français (`measurements-fr.ts`)

```typescript
export const measurementsFr = {
  wizard: {
    title: "Prise de mesures",
    progress: "{current} sur {total} mesures",
  },
  step0: {
    title: "Avant de commencer",
    forWho: {
      title: "Pour qui prenez-vous ces mesures ?",
      self: "Moi",
      daughter: "Ma fille",
      sister: "Ma sœur",
      other: "Autre personne",
      namePlaceholder: "Prénom",
    },
    method: {
      title: "Comment voulez-vous mesurer ?",
      tape: "Avec un mètre ruban",
      tapeDesc: "Recommandé, le plus précis",
      dress: "À partir d'une robe existante",
      dressDesc: "Posez une robe qui vous va bien à plat",
      estimation: "Estimation taille/poids",
      estimationDesc: "Indicatif, vous ajusterez ensuite",
    },
    fit: {
      title: "Coupe souhaitée",
      fitted: "Près du corps",
      comfortable: "Confortable",
      loose: "Ample",
    },
    units: {
      cm: "Centimètres",
      inches: "Pouces",
    },
    tips: {
      title: "Conseils pour bien vous mesurer",
      help: "Faites-vous aider si possible",
      clothes: "Portez des vêtements fins",
      tape: "Mètre souple, ni serré ni lâche",
    },
  },
  step1: {
    title: "Zones à mesurer",
    subtitle: "Tapez sur une zone pour commencer",
    zones: {
      chest: "Tour de poitrine",
      waist: "Tour de taille",
      hips: "Tour de hanches",
      shoulders: "Largeur d'épaules",
      sleeve: "Longueur de manche",
      length: "Longueur totale",
    },
    instructions: {
      chest: "Le mètre passe sous les bras, au point le plus fort de la poitrine",
      waist: "Au creux naturel de la taille, juste au-dessus du nombril",
      hips: "À l'endroit le plus large des hanches, pieds joints",
      shoulders: "Dans le dos, d'un bout à l'autre des épaules",
      sleeve: "Du sommet de l'épaule jusqu'au poignet, bras légèrement plié",
      length: "Du haut de l'épaule jusqu'à l'ourlet souhaité",
    },
  },
  step2: {
    title: "{zone}",
    range: "Plage conseillée : {min}–{max} cm",
    keyboard: "Saisir au clavier",
    keyboardTitle: "Entrez la valeur",
    keyboardPlaceholder: "Exemple : 92",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  step3: {
    title: "Aperçu en temps réel",
    subtitle: "La silhouette s'adapte à vos mesures",
  },
  step4: {
    title: "Vérification",
    subtitle: "Quelques mesures semblent inhabituelles",
    unusual: "Cette mesure est inhabituelle.",
    check: "Je vérifie",
    correct: "C'est correct",
    reasons: {
      waist_vs_chest: "Le tour de taille est généralement inférieur au tour de poitrine",
      hips_vs_waist: "Les hanches sont généralement plus larges que la taille",
      sleeve_vs_length: "La longueur de manche semble disproportionnée",
      previous_delta: "Cette mesure diffère de {delta} cm par rapport à votre dernier profil ({date})",
      estimation_delta: "Cette mesure s'éloigne de {delta} cm de l'estimation",
    },
  },
  step5: {
    title: "Récapitulatif",
    subtitle: "Vérifiez vos mesures avant de valider",
    fit: "Ajustement",
    units: "Unités",
    note: "Note (optionnel)",
    notePlaceholder: "Ex : épaule droite légèrement plus large",
    saveProfile: "Enregistrer ce profil",
    profileName: "Mes mesures - {date}",
    edit: "Modifier",
    validate: "Valider",
  },
  profiles: {
    title: "Profils enregistrés",
    use: "Utiliser",
    adjust: "Ajuster",
    delete: "Supprimer",
    new: "Nouvelles mesures",
    validated: "Validé atelier",
    oldWarning: "Il y a {months} mois",
    changedWarning: "Vos mesures ont changé",
  },
  admin: {
    tab: "Mesures",
    method: {
      tape: "Mètre ruban",
      dress: "Robe de référence",
      estimation: "Estimation",
    },
    status: {
      pending: "À vérifier",
      approved: "Confirmée",
      needs_correction: "À corriger",
    },
    alerts: "Alertes",
    clientNote: "Note cliente",
    atelierNote: "Note atelier (interne)",
    call: "Appeler",
    requestCorrection: "Demander correction",
    validate: "Valider les mesures",
    history: "Historique",
  },
};
```

### Arabe (`measurements-ar.ts`)

```typescript
export const measurementsAr = {
  wizard: {
    title: "أخذ القياسات",
    progress: "{current} من {total} قياسات",
  },
  step0: {
    title: "قبل البدء",
    forWho: {
      title: "لمن تأخذين هذه القياسات؟",
      self: "لنفسي",
      daughter: "لابنتي",
      sister: "لأختي",
      other: "لشخص آخر",
      namePlaceholder: "الاسم",
    },
    method: {
      title: "كيف تريدين القياس؟",
      tape: "بشريط قياس",
      tapeDesc: "موصى به، الأكثر دقة",
      dress: "من فستان موجود",
      dressDesc: "ضعي فستاناً يناسبك بشكل مسطح",
      estimation: "تقدير الطول/الوزن",
      estimationDesc: "تقريبي، ستعدلين لاحقاً",
    },
    fit: {
      title: "القصة المطلوبة",
      fitted: "ملاصق للجسم",
      comfortable: "مريح",
      loose: "واسع",
    },
    units: {
      cm: "سنتيمتر",
      inches: "بوصة",
    },
    tips: {
      title: "نصائح لأخذ قياسات دقيقة",
      help: "استعيني بشخص إن أمكن",
      clothes: "ارتدي ملابس رفيعة",
      tape: "شريط مرن، لا تشديد ولا ارتخاء",
    },
  },
  step1: {
    title: "المناطق المطلوب قياسها",
    subtitle: "اضغطي على منطقة للبدء",
    zones: {
      chest: "محيط الصدر",
      waist: "محيط الخصر",
      hips: "محيط الوركين",
      shoulders: "عرض الكتفين",
      sleeve: "طول الكم",
      length: "الطول الكلي",
    },
    instructions: {
      chest: "يمر الشريط تحت الإبطين، عند أوسع نقطة من الصدر",
      waist: "عند الخصر الطبيعي، فوق السرّة مباشرة",
      hips: "عند أوسع نقطة من الوركين، والقدمان مضمومتان",
      shoulders: "من الخلف، من طرف إلى طرف بين عظمتي الكتف",
      sleeve: "من قمة الكتف حتى المعصم، والذراع مثنية قليلاً",
      length: "من أعلى الكتف حتى الذيل المطلوب",
    },
  },
  step2: {
    title: "{zone}",
    range: "المدى الموصى به: {min}–{max} سم",
    keyboard: "إدخال بلوحة المفاتيح",
    keyboardTitle: "أدخلي القيمة",
    keyboardPlaceholder: "مثال: 92",
    cancel: "إلغاء",
    confirm: "تأكيد",
  },
  step3: {
    title: "معاينة مباشرة",
    subtitle: "الصورة تتكيف مع قياساتك",
  },
  step4: {
    title: "التحقق",
    subtitle: "بعض القياسات تبدو غير عادية",
    unusual: "هذا القياس غير عادي.",
    check: "سأتحقق",
    correct: "هذا صحيح",
    reasons: {
      waist_vs_chest: "محيط الخصر عادة أقل من محيط الصدر",
      hips_vs_waist: "الوركان عادة أعرض من الخصر",
      sleeve_vs_length: "طول الكم يبدو غير متناسب",
      previous_delta: "هذا القياس يختلف {delta} سم عن ملفك الأخير ({date})",
      estimation_delta: "هذا القياس يبتعد {delta} سم عن التقدير",
    },
  },
  step5: {
    title: "الملخص",
    subtitle: "تحققي من قياساتك قبل التأكيد",
    fit: "التعديل",
    units: "الوحدات",
    note: "ملاحظة (اختياري)",
    notePlaceholder: "مثال: الكتف الأيمن أعرض قليلاً",
    saveProfile: "حفظ هذا الملف",
    profileName: "قياساتي - {date}",
    edit: "تعديل",
    validate: "تأكيد",
  },
  profiles: {
    title: "الملفات المحفوظة",
    use: "استخدام",
    adjust: "تعديل",
    delete: "حذف",
    new: "قياسات جديدة",
    validated: "تم التحقق من الورشة",
    oldWarning: "منذ {months} أشهر",
    changedWarning: "قياساتك تغيرت",
  },
  admin: {
    tab: "القياسات",
    method: {
      tape: "شريط قياس",
      dress: "فستان مرجعي",
      estimation: "تقدير",
    },
    status: {
      pending: "للمراجعة",
      approved: "مؤكدة",
      needs_correction: "تحتاج تصحيح",
    },
    alerts: "تنبيهات",
    clientNote: "ملاحظة العميلة",
    atelierNote: "ملاحظة الورشة (داخلية)",
    call: "اتصال",
    requestCorrection: "طلب تصحيح",
    validate: "تأكيد القياسات",
    history: "السجل",
  },
};
```

---

## Livrables (commits séparés)

### Commit 1 : Données et API
- ✅ Schéma Prisma (`MeasurementProfile`, `MeasurementSet`, `MeasurementValidation`, `MeasurementHistory`)
- ✅ Migration + seed de démo (2 profils)
- ✅ Routes API :
  - `GET/POST /api/measurements/profiles`
  - `PUT/DELETE /api/measurements/profiles/[id]`
  - `POST /api/measurements/validate` (contrôles cohérence côté serveur)
- ✅ Validators Zod
- ✅ Types TypeScript (`lib/measurements/types.ts`)

### Commit 2 : Silhouette et zones
- ✅ Composant `BodySilhouette` (SVG face/profil)
- ✅ Zones cliquables avec highlights
- ✅ Animations mètre ruban (SVG + Motion)
- ✅ Step 1 : `step1-body-map.tsx`
- ✅ Anneau de progression

### Commit 3 : Règle tactile
- ✅ Composant `MeasurementRuler` (drag + scroll-snap)
- ✅ Vibration Android / tick visuel iOS
- ✅ Boutons +/− et saisie clavier
- ✅ `useMotionValue` pour 60 fps
- ✅ Step 2 : `step2-ruler.tsx`

### Commit 4 : Cohérence et silhouette vivante
- ✅ `lib/measurements/rules.ts` (règles configurables)
- ✅ `lib/measurements/interpolation.ts` (déformation SVG)
- ✅ Hook `use-coherence-check.ts`
- ✅ Step 3 : `step3-live-preview.tsx`
- ✅ Step 4 : `step4-validation.tsx`

### Commit 5 : Profils et historique
- ✅ Step 0 : `step0-setup.tsx` (choix personne/méthode)
- ✅ Step 5 : `step5-summary.tsx` (récap + sauvegarde)
- ✅ Hook `use-measurement-profile.ts`
- ✅ UI de sélection profil existant
- ✅ Historique daté

### Commit 6 : Back-office validation
- ✅ Onglet "Mesures" dans `/admin/orders/[id]`
- ✅ Statut validation (pending/approved/needs_correction)
- ✅ Bouton "Demander correction" → WhatsApp + lien magique
- ✅ Historique des modifications
- ✅ Règle "bloquer confection si non validé" (setting)

### Commit 7 : Tests et optimisation
- ✅ Tests unitaires (conversion, cohérence, interpolation)
- ✅ Test E2E Playwright (parcours complet, fr + ar)
- ✅ Performance : long tasks, 60 fps, CPU x4
- ✅ Build Docker OK
- ✅ README mis à jour

---

## Points à valider manuellement

### Android Chrome
- ✅ Vibration au scroll de la règle
- ✅ Drag fluide (60 fps)
- ✅ Pas de zoom involontaire sur inputs
- ✅ Safe area respectée (notch/barre système)
- ✅ Mode portrait + paysage

### iOS Safari
- ✅ Pas de vibration (tick visuel à la place)
- ✅ Drag sans lag
- ✅ `font-size >= 16px` sur inputs (anti-zoom)
- ✅ Safe area (encoche, îlot dynamique)
- ✅ Mode standalone (PWA)

### Accessibilité
- ✅ Navigation clavier complète
- ✅ Lecteur d'écran (NVDA/VoiceOver)
- ✅ Contraste AA
- ✅ Focus visible
- ✅ `aria-label` sur zones cliquables

### i18n RTL
- ✅ Interface en miroir
- ✅ Chiffres occidentaux (pas inversés)
- ✅ Règle croît dans la bonne direction
- ✅ Animations cohérentes

### Performance
- ✅ Aucune long task > 50 ms pendant drag
- ✅ Chrome DevTools Performance : 60 fps constant
- ✅ Émulation CPU x4 (Android milieu de gamme)
- ✅ Lighthouse mobile > 90

---

## Valeurs configurables

**Fichier** : `src/lib/measurements/rules.ts`

```typescript
export const MEASUREMENT_CONFIG = {
  // Plages par mesure (min/max en cm)
  ranges: {
    chest: { min: 60, max: 160 },
    waist: { min: 50, max: 150 },
    hips: { min: 60, max: 170 },
    shoulders: { min: 30, max: 60 },
    sleeve: { min: 30, max: 75 },
    length: { min: 80, max: 170 },
  },
  
  // Aisance par ajustement (en cm)
  ease: {
    fitted: 0,
    comfortable: 2,
    loose: 4,
  },
  
  // Seuils d'alerte
  thresholds: {
    previousDelta: 5,    // cm
    estimationDelta: 8,  // cm
    ageWarning: 6,       // mois
  },
  
  // Vibration
  vibration: {
    enabled: true,
    duration: 10, // ms
    interval: 50, // ms min entre deux vibrations
  },
};
```

Ces valeurs peuvent être surchargées depuis l'admin (Settings) si nécessaire.

---

## Résumé

Le module de prise de mesures interactives est conçu pour **transformer une tâche anxiogène en expérience plaisante et rassurante**. Chaque décision (animations fluides, validation douce, profils multiples, workflow atelier) vise à **augmenter la confiance** de la cliente et **réduire les erreurs** tout en respectant les contraintes de performance mobile et d'accessibilité.

**Next steps** : procéder à l'implémentation commit par commit selon l'ordre défini ci-dessus.
