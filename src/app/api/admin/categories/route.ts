// /api/admin/categories — GET (toutes) / POST (slug généré) — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { categorySchema } from "@/lib/validators"
import { categoryDTO } from "../../_lib/catalog"

export const dynamic = "force-dynamic"

/** Slug lisible depuis le nom (accents retirés, séparateurs « - ») */
function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return base || `categorie-${Date.now().toString(36)}`
}

/** Slug unique : suffixe -2, -3… en cas de collision */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name)
  let slug = base
  let n = 2
  while (await db.category.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`
    n += 1
  }
  return slug
}

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const categories = await db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] })
  return jsonOk({ categories: categories.map(categoryDTO) })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, categorySchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const category = await db.category.create({
    data: {
      slug: await uniqueSlug(data.name),
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      description: data.description ?? "",
      descriptionAr: data.descriptionAr ?? "",
      image: data.image ?? "",
      order: data.order ?? 0,
    },
  })

  return jsonOk(categoryDTO(category), 201)
}
