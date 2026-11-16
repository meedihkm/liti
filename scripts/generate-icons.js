#!/usr/bin/env node

/**
 * Génère les icônes PNG pour la PWA à partir du favicon.svg
 * Utilise sharp pour la conversion SVG → PNG
 * 
 * Usage: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_SVG = path.join(__dirname, '../public/favicon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

const SIZES = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512, padding: 0.1 }, // 10% padding pour maskable
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('📱 Génération des icônes PWA...\n');

  if (!fs.existsSync(INPUT_SVG)) {
    console.error('❌ Fichier favicon.svg introuvable:', INPUT_SVG);
    process.exit(1);
  }

  for (const { name, size, padding } of SIZES) {
    try {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      if (padding) {
        // Pour les icônes maskable, on ajoute un padding
        const paddedSize = Math.round(size * (1 - padding * 2));
        const offset = Math.round((size - paddedSize) / 2);
        
        await sharp(INPUT_SVG)
          .resize(paddedSize, paddedSize)
          .extend({
            top: offset,
            bottom: offset,
            left: offset,
            right: offset,
            background: { r: 14, g: 13, b: 11, alpha: 1 } // #0e0d0b
          })
          .png()
          .toFile(outputPath);
          
        console.log(`✅ ${name} (${size}x${size} avec padding)`);
      } else {
        await sharp(INPUT_SVG)
          .resize(size, size)
          .png()
          .toFile(outputPath);
          
        console.log(`✅ ${name} (${size}x${size})`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de ${name}:`, error.message);
    }
  }

  console.log('\n✨ Icônes générées avec succès!');
}

generateIcons().catch(console.error);
