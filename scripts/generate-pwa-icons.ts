// ─────────────────────────────────────────────────────────────
// Génération des icônes PWA à partir du motif du favicon.svg
// (losanges concentriques dorés — marque Taqendurt).
// Exécution depuis la racine : `bun scripts/generate-pwa-icons.ts`
//
// Produit dans public/ :
//   icon-192.png           — 192×192, purpose "any" (carré arrondi)
//   icon-512.png           — 512×512, purpose "any"
//   icon-512-maskable.png  — 512×512, purpose "maskable" (fond plein,
//                            motif dans la safe zone 80 % d'Android)
//   apple-touch-icon.png   — 180×180, iOS (fond plein)
// ─────────────────────────────────────────────────────────────
import sharp from "sharp"
import { access } from "fs/promises"

const BG = "#0e0d0b" // noir chaud (identique au favicon)
const GOLD = "#E8B64C" // or de la marque

// Motif : trois losanges concentriques berbères (du favicon.svg)
const diamonds = `
  <path d="M16 5 L27 16 L16 27 L5 16 Z" fill="none" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="1.4"/>
  <path d="M16 9.5 L22.5 16 L16 22.5 L9.5 16 Z" fill="none" stroke="${GOLD}" stroke-width="2"/>
  <path d="M16 13 L19 16 L16 19 L13 16 Z" fill="${GOLD}"/>
`

// Icône « any » : fidèle au favicon — carré arrondi, coins transparents
const rounded = (size: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <rect width="32" height="32" rx="7" fill="${BG}"/>
  ${diamonds}
</svg>`

// Icône full-bleed : fond bord à bord (l'OS applique son propre masque),
// motif agrandi d'un facteur k et recentré — utilisée pour :
//   • maskable Android : k = 1.10 → losange externe à 75,6 % du canvas,
//     sommets à 37,8 % du centre, dans le cercle de sécurité de 40 %
//   • apple-touch-icon iOS : k = 1.05
const fullBleed = (size: number, k: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <rect width="32" height="32" fill="${BG}"/>
  <g transform="translate(16 16) scale(${k}) translate(-16 -16)">
    ${diamonds}
  </g>
</svg>`

async function render(svg: string, file: string) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file)
  const meta = await sharp(file).metadata()
  const { size } = await access(file).then(() => ({ size: 0 })).catch(() => ({ size: -1 }))
  console.log(`✓ ${file} — ${meta.width}×${meta.height}px`)
}

console.log("Génération des icônes PWA Taqendurt…\n")
await render(rounded(192), "public/icon-192.png")
await render(fullBleed(180, 1.05), "public/apple-touch-icon.png")
await render(rounded(512), "public/icon-512.png")
await render(fullBleed(512, 1.1), "public/icon-512-maskable.png")
console.log("\n✅ Icônes générées dans public/ (référencées par manifest.webmanifest)")
