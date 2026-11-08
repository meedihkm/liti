// POST /api/admin/logout — destruction de la session
import { NextRequest, type NextResponse } from "next/server"
import { jsonOk, sameOriginGuard } from "@/lib/api"
import { destroySession } from "@/lib/auth"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin

  await destroySession()
  return jsonOk({ ok: true })
}
