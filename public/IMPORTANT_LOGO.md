# 🦋 IMPORTANT : Ajouter le Logo Borboleta

## Action Requise

Vous devez ajouter votre image de logo manuellement dans ce dossier.

### Fichiers à créer :

1. **`public/images/logo-borboleta.png`**
   - Votre logo complet avec le papillon et le texte "Borboleta DZ"
   - Format : PNG avec fond transparent
   - Dimensions recommandées : 200x200px ou plus
   - Utilisé dans : Header du site (navbar)

2. **`public/favicon.svg`** (remplacer l'existant)
   - Version simplifiée du logo pour le favicon
   - Format : SVG pour une meilleure qualité
   - Dimensions : 32x32px
   - Utilisé dans : Onglet du navigateur

3. **`public/icon-192.png`** (remplacer l'existant)
   - Version PNG 192x192px
   - Utilisé dans : PWA, écran d'accueil mobile

4. **`public/icon-512.png`** (remplacer l'existant)
   - Version PNG 512x512px  
   - Utilisé dans : PWA, splash screen

## Comment procéder

### Option 1 : Via SSH / Coolify File Manager
```bash
# Connectez-vous au serveur
cd /app/public/images
# Uploadez logo-borboleta.png ici
```

### Option 2 : Via Git
```bash
# Dans votre projet local
cp /chemin/vers/votre/logo.png public/images/logo-borboleta.png
cp /chemin/vers/votre/favicon.svg public/favicon.svg
cp /chemin/vers/votre/icon-192.png public/icon-192.png
cp /chemin/vers/votre/icon-512.png public/icon-512.png

git add public/
git commit -m "add: Borboleta logo and icons"
git push
```

## Le logo que vous m'avez envoyé :
- Papillon rose/magenta avec contours dorés
- Texte "Borboleta" en script élégant
- Sous-texte "DZ" avec décoration
- Motifs décoratifs berbères

Une fois les fichiers ajoutés, le site affichera automatiquement votre logo !
