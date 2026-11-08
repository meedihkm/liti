// GET /api/admin/messages — liste des messages de contact (desc) — staff OK
import { type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, requireAdmin } from "@/lib/api"
import { messageDTO } from "../../_lib/catalog"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin() // staff OK
  if ("response" in auth) return auth.response

  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } })
  return jsonOk({ messages: messages.map(messageDTO) })
}
