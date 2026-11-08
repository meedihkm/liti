// ─────────────────────────────────────────────────────────────
// Types partagés client ↔ serveur (DTO)
// ─────────────────────────────────────────────────────────────

export interface ProductImageDTO {
  id: string
  url: string
  alt: string
  order: number
}

export interface FabricDTO {
  id: string
  name: string
  nameAr: string
  image: string
  priceExtra: number
}

export interface ProductFabricDTO extends FabricDTO {
  /** supplément appliqué pour CE produit (0 = pas de supplément) */
  productExtra: number
  /** ids des couleurs disponibles pour ce tissu sur ce produit */
  colorIds: string[]
}

export interface ColorDTO {
  id: string
  name: string
  nameAr: string
  hex: string
}

export interface EmbroideryDTO {
  id: string
  name: string
  nameAr: string
  priceExtra: number
}

export interface CategoryDTO {
  id: string
  slug: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  image: string
  order: number
}

export interface ProductDTO {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  basePrice: number
  customSizeFee: number
  leadTimeDays: number
  featured: boolean
  visible: boolean
  hasCustomLength: boolean
  occasion: string
  createdAt: string
  categoryId: string
  category?: Pick<CategoryDTO, "id" | "slug" | "name" | "nameAr">
  images: ProductImageDTO[]
  fabrics: ProductFabricDTO[]
  colors: ColorDTO[]
  embroideries: EmbroideryDTO[]
}

export interface ProductListDTO {
  products: ProductDTO[]
  total: number
  page: number
  pages: number
}

// ── Panier / commande ─────────────────────────────────────────

export interface ConfigSelection {
  productId: string
  fabricId: string
  colorId: string
  embroideryIds: string[]
  size: string // "S"… | "sur-mesure"
  measurements?: Partial<Record<string, number>>
  length?: string
  quantity: number
  eventDate?: string // ISO (optionnel)
  note?: string
}

export interface CartLine extends ConfigSelection {
  productTitle: string
  productTitleAr: string
  productImage: string
  /** prix unitaire estimé côté client (le serveur fait foi) */
  unitPrice: number
  /** snapshot d'affichage (noms au moment de l'ajout) */
  fabricName?: string
  fabricNameAr?: string
  colorName?: string
  colorNameAr?: string
  colorHex?: string
  embroideryNames?: string[]
  embroideryNamesAr?: string[]
}

export interface OrderItemDTO {
  id: string
  productId: string
  productName: string
  productImage: string
  fabricName: string
  colorName: string
  colorHex: string
  embroideryJson: string
  size: string
  measurementsJson: string
  length: string
  quantity: number
  unitPrice: number
  lineTotal: number
  note: string
}

export interface OrderStatusEventDTO {
  id: string
  status: string
  note: string
  actor: string
  createdAt: string
}

export interface OrderDTO {
  id: string
  number: string
  status: string
  fullName: string
  phone: string
  email: string
  wilayaCode: number
  wilayaName: string
  commune: string
  address: string
  deliveryMode: "home" | "pickup"
  shippingFee: number
  subtotal: number
  total: number
  note: string
  internalNote: string
  refusalReason: string
  createdAt: string
  updatedAt: string
  items: OrderItemDTO[]
  history: OrderStatusEventDTO[]
}

export interface ContactMessageDTO {
  id: string
  name: string
  phone: string
  email: string
  subject: string
  message: string
  status: "new" | "read" | "handled"
  createdAt: string
}

export interface AdminStatsDTO {
  newOrders: number
  pendingOrders: number
  monthRevenue: number
  totalOrders: number
  unreadMessages: number
  topProducts: { name: string; count: number }[]
  recentOrders: Pick<OrderDTO, "id" | "number" | "fullName" | "total" | "status" | "createdAt">[]
}

export interface AdminUserDTO {
  id: string
  email: string
  name: string
  role: "admin" | "staff"
}

export interface PublicSettings {
  siteName: string
  siteNameAr: string
  tagline: string
  taglineAr: string
  phone: string
  whatsapp: string
  email: string
  address: string
  addressAr: string
  instagram: string
  facebook: string
  tiktok: string
  heroTitle: string
  heroTitleAr: string
  heroSubtitle: string
  heroSubtitleAr: string
  bannerText: string
  bannerTextAr: string
  bannerEnabled: boolean
}

export interface ShippingRateDTO {
  wilayaCode: number
  wilayaName: string
  wilayaNameAr: string
  homePrice: number
  active: boolean
}
