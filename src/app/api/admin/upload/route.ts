// POST /api/admin/upload — upload d'une image (admin).
// Multipart/form-data, champ « file ». Stockage local public/uploads
// (voir lib/storage.ts — driver remplaçable par S3/R2).
// Retourne { url } utilisée comme image produit/tissu/catégorie.
import { NextRequest, type NextResponse } from "next/server"
import { jsonError, jsonOk, sameOriginGuard, requireAdmin } from "@/lib/api"
import { getStorage } from "@/lib/storage"

export const dynamic = "force-dynamic"

const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin

  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return jsonError(400, "Formulaire invalide")
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return jsonError(422, "Champ « file » manquant")
  }
  if (file.size === 0) return jsonError(422, "Fichier vide")
  if (file.size > MAX_SIZE) return jsonError(413, "Fichier trop volumineux (max 5 Mo)")

  try {
    const stored = await getStorage().save(file)
    return jsonOk({ url: stored.url, filename: stored.filename, bytes: stored.bytes })
  } catch (err) {
    return jsonError(422, err instanceof Error ? err.message : "Échec de l'enregistrement")
  }
}
