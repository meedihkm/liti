# Icônes PWA Nécessaires

Pour que la PWA fonctionne correctement, vous devez créer les icônes suivantes à partir du `favicon.svg` :

## Icônes requises :

1. **icon-192.png** (192x192px)
   - Format: PNG
   - Fond: #0e0d0b (noir chaud)
   - Motif: Losange doré berbère centré

2. **icon-512.png** (512x512px)
   - Format: PNG
   - Fond: #0e0d0b
   - Motif: Losange doré berbère centré

3. **icon-512-maskable.png** (512x512px)
   - Format: PNG
   - Fond: #0e0d0b
   - Motif: Losange doré berbère centré avec safe zone (80% du canvas)
   - Le motif doit rester visible même si l'OS applique un masque circulaire ou arrondi

4. **apple-touch-icon.png** (180x180px)
   - Format: PNG
   - Fond: #0e0d0b
   - Motif: Losange doré berbère centré

## Comment générer les icônes :

### Option 1 : Utiliser un service en ligne
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Option 2 : Avec ImageMagick
```bash
# Installer ImageMagick
# Convertir le SVG en différentes tailles

# 192x192
convert -background "#0e0d0b" -density 384 favicon.svg -resize 192x192 icon-192.png

# 512x512
convert -background "#0e0d0b" -density 1024 favicon.svg -resize 512x512 icon-512.png

# 512x512 maskable (avec padding)
convert -background "#0e0d0b" -density 1024 favicon.svg -resize 410x410 -gravity center -extent 512x512 icon-512-maskable.png

# Apple Touch Icon 180x180
convert -background "#0e0d0b" -density 360 favicon.svg -resize 180x180 apple-touch-icon.png
```

### Option 3 : Avec Inkscape
```bash
# 192x192
inkscape favicon.svg --export-filename=icon-192.png --export-width=192 --export-height=192 --export-background="#0e0d0b"

# 512x512
inkscape favicon.svg --export-filename=icon-512.png --export-width=512 --export-height=512 --export-background="#0e0d0b"

# Apple Touch Icon
inkscape favicon.svg --export-filename=apple-touch-icon.png --export-width=180 --export-height=180 --export-background="#0e0d0b"
```

## Vérification

Une fois les icônes créées, vérifiez avec :
- Lighthouse PWA audit
- https://www.pwabuilder.com/ (validation manifeste)
- Test d'installation sur Android Chrome et iOS Safari

## Note importante

Les icônes maskable doivent avoir leur contenu principal dans une safe zone de 80% pour éviter d'être coupées par les masques Android adaptifs.

Exemple avec le losange berbère :
- Canvas : 512x512
- Safe zone : 410x410 (80%)
- Le motif doit être dimensionné pour tenir dans cette zone
