// POST /api/admin/login — authentification.
// Retourne { user, token } : le token est aussi posé en cookie httpOnly ;
// en iframe (preview) le cookie tiers peut être bloqué par le navigateur,
// le client renvoie alors le token via Authorization: Bearer.
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, rateGuard, sameOriginGuard } from "@/lib/api"
import { loginSchema } from "@/lib/validators"
import { RATE_LIMITS } from "@/lib/rate-limit"
import { createSession, pruneSessions, verifyPassword } from "@/lib/auth"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const limited = rateGuard(req, "login", RATE_LIMITS.login)
  if (limited) return limited

  const parsed = await parseBody(req, loginSchema)
  if ("response" in parsed) return parsed.response
  const { email, password } = parsed.data

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    // Message générique : ne pas révéler si l'email existe
    return jsonError(401, "Identifiants invalides")
  }

  const token = await createSession(user.id)
  // Nettoyage opportuniste des sessions expirées
  await pruneSessions().catch(() => {})

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === "staff" ? "staff" : "admin",
    },
    // Transport alternatif pour les iframes/cookies bloqués — cf. api-client
    token,
  })
}
