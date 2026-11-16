# 🎨 Guide: Régénérer les Icônes PWA

## Problème
L'icône de l'application installée affiche encore l'ancienne version et ne se met pas à jour automatiquement.

## Solution: Régénérer les icônes PNG

### Méthode 1: Conversion en ligne (la plus simple)

1. **Ouvrir le fichier source:**
   - Fichier: `public/favicon.svg`
   - Contenu SVG: Logo losange doré sur fond noir (#0e0d0b)

2. **Aller sur un convertisseur SVG → PNG:**
   - https://svgtopng.com/ (recommandé - permet de choisir la taille)
   - https://cloudconvert.com/svg-to-png
   - https://www.aconvert.com/image/svg-to-png/

3. **Uploader `public/favicon.svg` et convertir aux tailles suivantes:**

   #### a) icon-192.png
   - Taille: **192 × 192 pixels**
   - Pas de padding
   - Télécharger et sauvegarder dans `public/icon-192.png`

   #### b) icon-512.png
   - Taille: **512 × 512 pixels**
   - Pas de padding
   - Télécharger et sauvegarder dans `public/icon-512.png`

   #### c) icon-512-maskable.png
   - Taille: **512 × 512 pixels**
   - ⚠️ **Avec padding 10%** (51px de chaque côté)
   - Fond: `#0e0d0b` (noir Borboleta)
   - Cette icône sera adaptée par Android pour les formes rondes/carrées
   - Télécharger et sauvegarder dans `public/icon-512-maskable.png`

   #### d) apple-touch-icon.png
   - Taille: **180 × 180 pixels**
   - Pas de padding
   - Télécharger et sauvegarder dans `public/apple-touch-icon.png`

4. **Remplacer les 4 fichiers dans le dossier `public/`**

### Méthode 2: Avec Figma/Photoshop/Illustrator

Si tu as accès à un éditeur graphique:

1. Ouvrir `public/favicon.svg`
2. Exporter en PNG aux tailles:
   - 192×192 → `icon-192.png`
   - 512×512 → `icon-512.png`
   - 512×512 avec marge 10% fond #0e0d0b → `icon-512-maskable.png`
   - 180×180 → `apple-touch-icon.png`
3. Sauvegarder dans `public/`

### Méthode 3: Avec Node.js (si disponible)

```bash
npm install
npm run icons:generate
```

## Après Régénération

1. **Commit les nouvelles icônes:**
   ```bash
   git add public/*.png
   git commit -m "feat(pwa): regenerate app icons from current logo"
   git push origin main
   ```

2. **Attendre le déploiement Coolify**

3. **Sur les appareils clients:**
   - **Désinstaller** complètement l'ancienne PWA "Taqendurt" ou "Borboleta"
   - **Vider le cache** du navigateur
   - **Fermer tous les onglets** du site
   - **Réouvrir** le site: https://myrobe.giize.com
   - **Réinstaller** la PWA

## Vérification

### Avant déploiement (local)
```bash
# Vérifier que les fichiers existent
ls -la public/*.png

# Vérifier la taille des fichiers (doivent être > 1KB chacun)
du -h public/*.png
```

### Après déploiement
1. Ouvrir DevTools > Application > Manifest
2. Vérifier que les icônes s'affichent correctement
3. Les 4 icônes doivent montrer le logo losange doré

## Spécifications du Logo

**Favicon.svg actuel:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0e0d0b"/>
  <path d="M16 5 L27 16 L16 27 L5 16 Z" fill="none" stroke="#E8B64C" stroke-opacity="0.5" stroke-width="1.4"/>
  <path d="M16 9.5 L22.5 16 L16 22.5 L9.5 16 Z" fill="none" stroke="#E8B64C" stroke-width="2"/>
  <path d="M16 13 L19 16 L16 19 L13 16 Z" fill="#E8B64C"/>
</svg>
```

**Couleurs:**
- Fond: `#0e0d0b` (noir Borboleta)
- Logo: `#E8B64C` (doré)

## Troubleshooting

### L'icône ne change pas après mise à jour
1. Le Service Worker est déjà en v3 ✅
2. Les icônes sont dans le précache ✅
3. **Il faut OBLIGATOIREMENT désinstaller/réinstaller la PWA**
   - Sur Android: Paramètres > Apps > Borboleta > Désinstaller
   - Sur iOS: Maintenir l'icône > Supprimer
   - Sur Desktop: Chrome > Plus d'outils > Désinstaller "Borboleta"

### Le navigateur cache encore l'ancienne icône
1. Vider le cache: Ctrl+Shift+Suppr
2. Fermer TOUS les onglets du site
3. Redémarrer le navigateur
4. Rouvrir le site

### Les fichiers PNG sont corrompus
- Vérifier la taille: chaque fichier doit faire au moins 1-5 KB
- Re-télécharger depuis le convertisseur en ligne
- Essayer un autre convertisseur

## Fichiers Concernés

```
public/
├── favicon.svg              ← SOURCE (ne pas modifier)
├── icon-192.png            ← À régénérer
├── icon-512.png            ← À régénérer
├── icon-512-maskable.png   ← À régénérer (avec padding)
└── apple-touch-icon.png    ← À régénérer
```

## Service Worker

Le Service Worker est déjà configuré pour forcer le rechargement:
- Version: `v3` ✅
- Icônes dans précache: ✅
- Purge auto des anciens caches: ✅

**Aucune modification SW nécessaire!**

## Ressources

- Convertisseur SVG→PNG: https://svgtopng.com/
- Maskable Icon Editor: https://maskable.app/editor
- PWA Icon Generator: https://www.pwabuilder.com/imageGenerator

---

**Note:** Les icônes PNG actuelles dans `public/` sont probablement des anciennes versions. Il faut les **remplacer** par de nouvelles générées depuis le `favicon.svg` actuel.
