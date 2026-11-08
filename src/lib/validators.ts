// ─────────────────────────────────────────────────────────────
// Schémas de validation Zod — côté client ET serveur
// ─────────────────────────────────────────────────────────────
import { z } from "zod"
import { ORDER_STATUSES } from "./constants"

// Téléphone algérien : 05/06/07xxxxxxxx ou +213 5/6/7xxxxxxxx
const dzPhone = z
  .string()
  .transform((s) => s.replace(/[\s.\-()]/g, ""))
  .pipe(
    z.string().regex(/^(?:\+213|0)(5|6|7)\d{8}$/, {
      message: "Numéro algérien invalide (ex : 0550 12 34 56)",
    })
  )

// ── Commande (tunnel de checkout) ─────────────────────────────

export const measurementSchema = z.record(z.string(), z.number().finite())

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  fabricId: z.string().min(1),
  colorId: z.string().min(1),
  embroideryIds: z.array(z.string()).default([]),
  size: z.string().min(1), // "S"… | "sur-mesure"
  measurements: measurementSchema.optional(),
  length: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().max(500).optional(),
})

export const orderCreateSchema = z
  .object({
    items: z.array(orderItemSchema).min(1).max(20),
    customer: z.object({
      fullName: z.string().min(3).max(80),
      phone: dzPhone,
      email: z.union([z.email(), z.literal("")]).optional(),
      wilayaCode: z.number().int().min(1).max(58),
      commune: z.string().min(2).max(60),
      address: z.string().max(200).optional(),
      deliveryMode: z.enum(["home", "pickup"]),
      note: z.string().max(500).optional(),
    }),
    // Honeypot anti-spam : champ caché qui doit rester vide
    website: z.union([z.literal(""), z.literal(undefined)]).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.customer.deliveryMode === "home" && !val.customer.address?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["customer", "address"],
        message: "L'adresse est requise pour une livraison à domicile",
      })
    }
    if (val.items.some((it) => it.size === "sur-mesure" && !it.measurements)) {
      ctx.addIssue({
        code: "custom",
        message: "Mesures manquantes pour une commande sur mesure",
      })
    }
  })

// ── Contact ───────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.union([dzPhone, z.literal("")]).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  subject: z.string().max(120).optional(),
  message: z.string().min(10).max(2000),
  website: z.union([z.literal(""), z.literal(undefined)]).optional(), // honeypot
})

// ── Admin : authentification ──────────────────────────────────

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(100),
})

export const passwordChangeSchema = z
  .object({
    current: z.string().min(6),
    next: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/[A-Za-z]/, "Au moins une lettre")
      .regex(/\d/, "Au moins un chiffre"),
  })
  .refine((v) => v.current !== v.next, { message: "Le nouveau mot de passe doit être différent" })

// ── Admin : commandes ─────────────────────────────────────────

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  note: z.string().max(500).optional(), // motif de refus / commentaire d'historique
  refusalReason: z.string().max(500).optional(),
  internalNote: z.string().max(1000).optional(),
})

export const orderEditSchema = z.object({
  fullName: z.string().min(3).max(80).optional(),
  phone: dzPhone.optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  commune: z.string().min(2).max(60).optional(),
  address: z.string().max(200).optional(),
  deliveryMode: z.enum(["home", "pickup"]).optional(),
  shippingFee: z.number().int().min(0).optional(),
  note: z.string().max(500).optional(),
  internalNote: z.string().max(1000).optional(),
  items: z
    .array(z.object({ id: z.string(), quantity: z.number().int().min(1).max(10) }))
    .optional(),
})

// ── Admin : catalogue ─────────────────────────────────────────

export const productUpsertSchema = z.object({
  title: z.string().min(2).max(120),
  titleAr: z.string().min(2).max(120),
  description: z.string().max(4000).default(""),
  descriptionAr: z.string().max(4000).default(""),
  basePrice: z.number().int().min(0),
  customSizeFee: z.number().int().min(0).default(1500),
  leadTimeDays: z.number().int().min(1).max(180).default(14),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  hasCustomLength: z.boolean().default(false),
  occasion: z.string().default(""),
  categoryId: z.string().min(1),
  images: z
    .array(z.object({ url: z.string().min(1), alt: z.string().max(120).default("") }))
    .default([]),
  fabrics: z
    .array(
      z.object({
        fabricId: z.string().min(1),
        priceExtra: z.number().int().min(0).default(0),
        colorIds: z.array(z.string()).default([]),
      })
    )
    .default([]),
  colorIds: z.array(z.string()).default([]),
  embroideryIds: z.array(z.string()).default([]),
})

export const fabricSchema = z.object({
  name: z.string().min(2).max(60),
  nameAr: z.string().min(2).max(60),
  image: z.string().default(""),
  priceExtra: z.number().int().min(0).default(0),
})

export const colorSchema = z.object({
  name: z.string().min(2).max(40),
  nameAr: z.string().min(2).max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export const embroiderySchema = z.object({
  name: z.string().min(2).max(80),
  nameAr: z.string().min(2).max(80),
  priceExtra: z.number().int().min(0).default(0),
})

export const categorySchema = z.object({
  name: z.string().min(2).max(60),
  nameAr: z.string().min(2).max(60),
  description: z.string().max(500).default(""),
  descriptionAr: z.string().max(500).default(""),
  image: z.string().default(""),
  order: z.number().int().min(0).default(0),
})

// ── Admin : livraison & paramètres ────────────────────────────

export const shippingBulkSchema = z.array(
  z.object({
    wilayaCode: z.number().int().min(1).max(58),
    homePrice: z.number().int().min(0),
    active: z.boolean(),
  })
)

export const settingsSchema = z.record(z.string(), z.string())

export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type ProductUpsertInput = z.infer<typeof productUpsertSchema>
