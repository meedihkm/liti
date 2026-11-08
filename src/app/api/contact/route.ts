// POST /api/contact — message de contact public (rate-limit + honeypot)
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, parseBody, rateGuard, sameOriginGuard } from "@/lib/api"
import { contactSchema } from "@/lib/validators"
import { RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const limited = rateGuard(req, "contact", RATE_LIMITS.contact)
  if (limited) return limited

  const parsed = await parseBody(req, contactSchema)
  if ("response" in parsed) return parsed.response
  const { name, phone, email, subject, message } = parsed.data
  // (honeypot `website` garanti vide par le schéma Zod)

  await db.contactMessage.create({
    data: {
      name: name.trim(),
      phone: phone ?? "",
      email: email ?? "",
      subject: subject?.trim() ?? "",
      message: message.trim(),
    },
  })

  return jsonOk({ ok: true }, 201)
}
