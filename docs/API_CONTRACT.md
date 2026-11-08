# CONTRAT API — Taqendurt (Robes Kabyles)

Ce document fait foi pour le backend (implémentation) et le frontend (consommation).

## Conventions générales

- Toutes les réponses sont en JSON. Erreurs : `{ "error": "message lisible" }` avec code HTTP approprié (400/401/403/404/409/422/429/500).
- Succès : l'objet DTO directement (pas d'enveloppe `{ ok: true }`).
- Les route handlers Next 16 reçoivent les params en **Promise** :
  `export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> })` puis `const { id } = await params`.
- Chaque route GET doit exporter `export const dynamic = "force-dynamic"` (anti-cache).
- Auth admin : cookie httpOnly `rk_session` (créé par `POST /api/admin/login` via `lib/auth.ts`). Les routes admin utilisent `requireAdmin()` / `requireAdmin(["admin"])` de `lib/api.ts`.
- Rate limiting : `rateGuard(req, "checkout", RATE_LIMITS.checkout)` etc. depuis `lib/api.ts` + `lib/rate-limit.ts`.
- Validation : schémas Zod de `lib/validators.ts` via `parseBody(req, schema)`.
- Le **prix est toujours recalculé serveur** (`lib/pricing.ts`) — jamais lu depuis le client.
- DB : `import { db } from "@/lib/db"` (Prisma, SQLite). Schéma : `prisma/schema.prisma`.

## DTO Produit ( sérialisation )

`ProductDTO` (voir `src/lib/types.ts`). Mapping depuis Prisma :

```
product → {
  ...champs directs,
  createdAt: ISO string,
  category: { id, slug, name, nameAr },
  images: triées par `order` croissant,
  fabrics: ProductFabric[] → {
    id: fabric.id, name, nameAr, image,
    priceExtra: fabric.priceExtra (valeur par défaut globale),
    productExtra: productFabric.priceExtra (supplément RÉEL appliqué à ce produit),
    colorIds: JSON.parse(productFabric.colorsJson) — [] signifie « toutes les couleurs du produit »
  },
  colors: ProductColor[] → Color mappée { id, name, nameAr, hex },
  embroideries: ProductEmbroidery[] → EmbroideryOption mappée
}
```

## Endpoints publics

### GET /api/meta
→ `{ settings: PublicSettings, categories: CategoryDTO[], fabrics: FabricDTO[], colors: ColorDTO[], embroideries: EmbroideryDTO[] }`
(settings via `getPublicSettings()` de `lib/settings.ts` — sans `adminEmail`)

### GET /api/products
Query : `category` (slug), `fabric` (id), `color` (id), `occasion`, `min`, `max` (DA), `sort` (`newest|price-asc|price-desc|featured`), `page` (1-based), `limit` (défaut 12, max 24), `featured` (`true`).
Seuls les produits `visible: true`. Filtres combinés (AND).
→ `{ products: ProductDTO[], total, page, pages }`

### GET /api/products/:id
→ `ProductDTO` (404 si absent ou `visible: false`)

### POST /api/orders  (rate-limit checkout + honeypot)
Body = `orderCreateSchema` (voir validators). Le champ `website` doit être vide (honeypot).

Logique serveur (autoritaire) — pour chaque item :
1. Produit existant + visible sinon 404/422.
2. `ProductFabric` (productId+fabricId) existant sinon 422 « tissu indisponible ». `fabricExtra = productFabric.priceExtra`.
3. `colorId` ∈ couleurs du produit ET (colorsJson vide OU contient colorId) sinon 422 « combinaison indisponible ».
4. Chaque `embroideryIds` ∈ broderies du produit sinon 422.
5. `size` : soit `S|M|L|XL|XXL`, soit `sur-mesure` (alors les 6 mesures requises, plages de `MEASUREMENT_FIELDS`) → `+ customSizeFee`.
6. `length` renseigné seulement si `product.hasCustomLength`.
7. `unitPrice = computeUnitPrice({ basePrice, fabricExtra, embroideryExtras, isCustomSize, customSizeFee })` ; `lineTotal = unitPrice × quantity`.
8. `shippingFee` : `pickup` → 0 ; `home` → `ShippingRate` active pour la wilaya (sinon `DEFAULT_SHIPPING[wilayaCode]` ; wilaya 1–58 validée par Zod).
9. `number` : `RK-{année}-{seq 4 chiffres}` (seq = nb commandes de l'année + 1). Créer Order + OrderItems (snapshot complet : noms, images, options JSON, prix) + OrderStatusHistory(pending, actor "system") + `notifyNewOrder(...)`.
→ 201 `{ number, total, subtotal, shippingFee, itemCount }`

### GET /api/track?number=RK-…&phone=…  (rate-limit track)
Numéro insensible à la casse ; téléphone normalisé (chiffres uniquement) comparé sur les 9 derniers chiffres.
→ `OrderDTO` complet (ou 404 « introuvable »). Jamais l'adresse exacte (seulement wilaya + commune).

### POST /api/contact  (rate-limit contact + honeypot)
Body = `contactSchema` → crée ContactMessage → 201 `{ ok: true }`

## Endpoints admin (session requise)

### POST /api/admin/login  (rate-limit login)
`{ email, password }` → 200 `{ user: AdminUserDTO }` + cookie. Credentials invalids → 401 générique.

### POST /api/admin/logout → `{ ok: true }`
### GET /api/admin/me → `{ user: AdminUserDTO }` ou 401
### POST /api/admin/password — `{ current, next }` (passwordChangeSchema) → `{ ok: true }`

### GET /api/admin/stats (staff OK) → `AdminStatsDTO`
- `newOrders` : créées depuis 48 h ; `pendingOrders` : statut `pending`
- `monthRevenue` : somme `total` du mois courant, statuts ∈ validated|crafting|ready|shipped|delivered
- `totalOrders` ; `unreadMessages` (status `new`)
- `topProducts` : top 5 par somme quantity (groupé par productName des OrderItem)
- `recentOrders` : 8 dernières

### GET /api/admin/orders (staff OK)
Query : `status`, `q` (number/fullName/phone contains), `wilaya` (code), `page`, `pageSize` (défaut 20), `sort` (`recent` défaut | `total-asc|total-desc`), `format=csv`.
→ `{ orders: OrderDTO[], total, page, pages }`. CSV (format=csv) : réponse `text/csv; charset=utf-8` avec BOM, colonnes : number, createdAt, fullName, phone, wilayaName, commune, deliveryMode, status, subtotal, shippingFee, total, articles (résumé « nom ×qté » séparés par « | »).

### GET /api/admin/orders/:id (staff OK) → `OrderDTO` (avec items + history triés ASC)
### PATCH /api/admin/orders/:id (staff OK)
Body = `orderUpdateSchema` : changement de statut (history entry avec actor = nom de l'admin connecté), `refusalReason` obligatoire si status=refused, `internalNote` modifiable.
→ `OrderDTO`

### PUT /api/admin/orders/:id (staff OK — modification avant validation)
Body = `orderEditSchema` : infos client, `shippingFee`, notes, quantités des items (recalcul subtotal/total). Refusé (409) si statut ≠ `pending`.
→ `OrderDTO`

### GET /api/admin/products (admin) → `{ products: ProductDTO[] }` (tous, y compris masqués)
### GET /api/admin/products/:id (admin) → `ProductDTO`
### POST /api/admin/products (admin) — body = `productUpsertSchema` → `ProductDTO` (201)
Crée images (ordre = index), ProductFabric (+colorsJson), ProductColor, ProductEmbroidery.
### PUT /api/admin/products/:id (admin) — remplace intégralement les relations → `ProductDTO`
### DELETE /api/admin/products/:id (admin) → `{ ok: true }` (OrderItem garde le snapshot, aucune FK)

### POST /api/admin/upload (admin) — multipart, champ `file`
MIME jpg/png/webp/avif, max 5 Mo → `{ url: "/uploads/xxx.jpg" }` (via `getStorage().save(file)`)

### CRUD options catalogue (admin)
- `/api/admin/fabrics` GET (tous) / POST ; `/api/admin/fabrics/:id` PUT / DELETE (`fabricSchema`)
- `/api/admin/colors` … (`colorSchema`) ; `/api/admin/embroideries` … (`embroiderySchema`)
- `/api/admin/categories` … (`categorySchema` ; DELETE refuse si produits liés → 409)
DELETE autorisé seulement si aucune relation produit (sinon 409 avec message).

### GET /api/admin/shipping (admin) → `{ rates: ShippingRateDTO[] }` (58, avec noms wilayas)
### PUT /api/admin/shipping (admin) — body = `shippingBulkSchema` (upsert des 58) → `{ ok: true }`

### GET /api/admin/messages (staff OK) → `{ messages: ContactMessageDTO[] }` (desc)
### PATCH /api/admin/messages/:id (staff OK) — `{ status: "new"|"read"|"handled" }` → `ContactMessageDTO`

### GET /api/admin/settings (admin) → tous les settings avec `adminEmail`
### PUT /api/admin/settings (admin) — body = `Record<string,string>` (clés connues de `DEFAULT_SETTINGS`, `bannerEnabled` = `"true"|"false"`) → upsert → `{ ok: true }`

## Rôles
- `admin` : tout. `staff` : commandes, messages, stats, mot de passe. Toute route hors portée → 403 via `requireAdmin(["admin"])`.
