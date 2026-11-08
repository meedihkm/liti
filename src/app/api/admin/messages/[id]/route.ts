// PATCH /api/admin/messages/:id — changement de statut (new|read|handled) — staff OK
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, sameOriginGuard, requireAdmin } from "@/lib/api"
import { messageDTO } from "../../../_lib/catalog"

const STATUSES = new Set(["new", "read", "handled"])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin() // staff OK
  if ("response" in auth) return auth.response

  const { id } = await params
  const message = await db.contactMessage.findUnique({ where: { id } })
  if (!message) return jsonError(404, "Message introuvable")

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError(400, "JSON invalide")
  }

  const status =
    body && typeof body === "object" && "status" in body && typeof body.status === "string"
      ? body.status
      : ""

  if (!STATUSES.has(status)) {
    return jsonError(422, "Statut invalide (new, read ou handled)")
  }

  const updated = await db.contactMessage.update({ where: { id }, data: { status } })
  return jsonOk(messageDTO(updated))
}
