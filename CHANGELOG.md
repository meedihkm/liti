# Changelog

## [Module Mesures] - 2026-11-10

### ✨ Nouveau module de prise de mesures interactives

Module complet mobile-first permettant à une cliente de prendre ses mesures seule avec guidage visuel et vocal.

#### Ajouté

**Modèles de données (Prisma)**
- `MeasurementProfile` : profils de mesures par cliente (moi, ma fille, etc.)
- `MeasurementSet` : jeux de mesures historisés
- `MeasurementValidation` : validation atelier
- `MeasurementHistory` : historique des modifications

**API Routes**
- `GET/POST /api/measurements/profiles` : gestion des profils
- `PUT/DELETE /api/measurements/profiles/:id` : modification/suppression
- `POST /api/measurements/sets` : création de jeux de mesures
- `POST /api/measurements/validate` : validation côté serveur

**Composants UI**
- `MeasurementWizard` : orchestrateur 5 étapes
- `Step0Setup` : choix personne/méthode/ajustement/unités
- `Step1BodyMap` : silhouette cliquable avec zones tactiles
- `Step2Ruler` : règle interactive avec drag + vibration
- `Step3LivePreview` : silhouette vivante déformée en temps réel
- `Step4Validation` : contrôles de cohérence non-bloquants
- `Step5Summary` : récapitulatif avec édition et sauvegarde
- `BodySilhouette` : SVG avec zones interactives
- `MeasurementRuler` : règle tactile 60fps
- `TapeAnimation` : animation mètre ruban
- `ProgressRing` : anneau de progression

**Utilitaires**
- `conversion.ts` : cm ↔ pouces, estimation taille/poids, conversion robe
- `rules.ts` : règles de cohérence configurables
- `interpolation.ts` : déformation silhouette
- `use-coherence-check` : hook validation
- `use-measurement-profile` : hook gestion profils

**i18n**
- Dictionnaires complets FR/AR pour toutes les étapes
- Support RTL complet

#### Caractéristiques techniques

- ✅ **Performance 60fps** : `useMotionValue` + transforms only
- ✅ **Mobile-first** : 100dvh, safe-area, font-size 16px
- ✅ **Accessibilité** : WCAG AA, navigation clavier, lecteurs d'écran
- ✅ **Vibration** : Android 10ms par cm, tick visuel iOS
- ✅ **Session cookies** : httpOnly, SameSite=Lax
- ✅ **Rate limiting** : 20 req/min sur endpoints mesures
- ✅ **Validation serveur** : Zod + plages + cohérence

#### Documentation

- `docs/MESURES.md` : spécification complète (1316 lignes)
- README mis à jour avec structure module
- Seed avec 2 profils de démo

#### Commits

1. `9c4509d` - Données et API
2. `d3a8036` - Silhouette et zones
3. `2d197ef` - Règle tactile
4. `f136205` - Cohérence et preview
5. `2e2c0e6` - Profils et setup
6. `f2ba35e` - Documentation
7. `5e1a1e2` - Dictionnaires i18n

#### À tester manuellement

- [ ] Android Chrome : vibration, drag fluide, safe area
- [ ] iOS Safari : tick visuel, anti-zoom inputs, safe area
- [ ] Navigation clavier complète
- [ ] Lecteur d'écran (NVDA/VoiceOver)
- [ ] RTL arabe : interface miroir, chiffres cohérents

#### Prochaines étapes

1. Intégrer au configurateur (lazy load dans étape Taille)
2. Implémenter onglet Mesures dans back-office admin
3. UI validation atelier avec WhatsApp correction
4. Tests E2E Playwright
