// POST /api/admin/password — changement du mot de passe de l'utilisateur connecté
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { passwordChangeSchema } from "@/lib/validators"
import { hashPassword, verifyPassword } from "@/lib/auth"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin() // staff OK : son propre mot de passe
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, passwordChangeSchema)
  if ("response" in parsed) return parsed.response
  const { current, next } = parsed.data

  const user = await db.user.findUnique({ where: { id: auth.user.id } })
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return jsonError(401, "Mot de passe actuel incorrect")
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  })

  return jsonOk({ ok: true })
}
