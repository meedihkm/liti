# Guide de génération des icônes PWA

## Problème

Lorsque l'application est installée comme PWA, l'icône affichée peut être ancienne même après modification du logo.

## Solution

### Option 1: Régénération automatique (recommandée)

Prérequis: Node.js installé sur votre machine.

```bash
npm run icons:generate
```

ou avec bun:

```bash
bun run icons:generate
```

Cette commande génère automatiquement toutes les icônes PNG nécessaires à partir du fichier `public/favicon.svg`.

### Option 2: Génération manuelle

Si vous ne pouvez pas exécuter le script, utilisez un outil de conversion SVG→PNG en ligne:

1. **Ouvrir** `public/favicon.svg` dans un éditeur de texte
2. **Convertir** vers PNG aux dimensions suivantes:
   - `icon-192.png` : 192×192px
   - `icon-512.png` : 512×512px
   - `icon-512-maskable.png` : 512×512px avec padding 10% sur fond `#0e0d0b`
   - `apple-touch-icon.png` : 180×180px

3. **Remplacer** les fichiers dans `public/`

#### Outils en ligne recommandés:
- https://svgtopng.com/
- https://cloudconvert.com/svg-to-png
- https://www.aconvert.com/image/svg-to-png/

### Option 3: Utiliser un éditeur graphique

1. Ouvrir `public/favicon.svg` dans **Figma**, **Inkscape**, ou **Adobe Illustrator**
2. Exporter aux dimensions listées ci-dessus
3. Sauvegarder dans `public/`

## Forcer la mise à jour côté client

Après régénération des icônes:

1. **Incrémenter** la version du Service Worker dans `public/sw.js`:
   ```js
   const CACHE_VERSION = "v4"; // Augmenter le numéro
   ```

2. **Déployer** l'application

3. **Désinstaller** l'ancienne PWA du téléphone/bureau

4. **Réinstaller** depuis le navigateur

## Vérification

- Les nouvelles icônes doivent apparaître sur l'écran d'accueil
- Le manifeste doit afficher "Borboleta" comme nom d'application
- Vérifier dans DevTools > Application > Manifest que les icônes sont bien chargées

## Fichiers concernés

- `public/favicon.svg` - Source SVG du logo
- `public/icon-192.png` - Icône Android (petite)
- `public/icon-512.png` - Icône Android/Desktop (grande)
- `public/icon-512-maskable.png` - Icône adaptative Android
- `public/apple-touch-icon.png` - Icône iOS
- `public/manifest.webmanifest` - Configuration PWA
- `public/sw.js` - Service Worker (gère le cache)

## Troubleshooting

### L'icône ne change pas après mise à jour

1. Vider le cache du navigateur
2. Désinstaller complètement la PWA
3. Fermer tous les onglets du site
4. Rouvrir et réinstaller

### Erreur "Failed to fetch icon"

- Vérifier que les fichiers PNG existent dans `public/`
- Vérifier que les chemins dans `manifest.webmanifest` sont corrects
- Vérifier les logs du Service Worker dans DevTools

### Icône floue ou pixelisée

- Régénérer les icônes avec une résolution plus élevée
- Utiliser un fond de couleur unie (`#0e0d0b`) pour les icônes maskable
