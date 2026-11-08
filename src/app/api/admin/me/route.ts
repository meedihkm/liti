// GET /api/admin/me — utilisateur connecté (401 sinon)
import { type NextResponse } from "next/server"
import { jsonOk, requireAdmin } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin()
  if ("response" in auth) return auth.response
  return jsonOk({ user: auth.user })
}
