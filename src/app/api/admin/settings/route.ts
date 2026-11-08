// /api/admin/settings — GET (tous, avec adminEmail) / PUT (upsert clé/valeur) — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { settingsSchema } from "@/lib/validators"
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const settings = await getSettings()
  return jsonOk({ settings })
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, settingsSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  // Seules les clés connues de DEFAULT_SETTINGS sont acceptées
  const knownKeys = Object.keys(DEFAULT_SETTINGS)
  const entries = Object.entries(data).filter(([key]) => knownKeys.includes(key))
  if (entries.length === 0) {
    return jsonError(422, "Aucune clé de paramètre valide fournie")
  }

  for (const [key, value] of entries) {
    if (key === "bannerEnabled" && value !== "true" && value !== "false") {
      return jsonError(422, "bannerEnabled doit valoir « true » ou « false »")
    }
  }

  for (const [key, value] of entries) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  return jsonOk({ ok: true })
}
