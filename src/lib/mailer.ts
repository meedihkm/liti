// ─────────────────────────────────────────────────────────────
// Notifications email à l'admin — SMTP configurable via .env.
// Sans SMTP_HOST : l'email est journalisé dans MailLog (mode
// dégradé explicite, consultable côté admin).
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db"

interface MailPayload {
  to: string
  subject: string
  body: string
}

async function record(payload: MailPayload, status: string, error = "") {
  await db.mailLog
    .create({ data: { ...payload, status, error: error.slice(0, 500) } })
    .catch(() => {})
}

/**
 * Envoie (ou journalise) un email. Retourne true si envoyé réellement.
 */
export async function sendMail(payload: MailPayload): Promise<boolean> {
  const host = process.env.SMTP_HOST
  if (!host) {
    await record(payload, "logged")
    return false
  }
  try {
    const nodemailer = await import("nodemailer")
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "Robes Kabyles <no-reply@localhost>",
      ...payload,
    })
    await record(payload, "sent")
    return true
  } catch (e) {
    await record(payload, "error", e instanceof Error ? e.message : String(e))
    return false
  }
}

/** Notification admin : nouvelle commande reçue */
export async function notifyNewOrder(orderNumber: string, total: number, fullName: string) {
  const setting = await db.siteSetting
    .findUnique({ where: { key: "adminEmail" } })
    .catch(() => null)
  const to = setting?.value || process.env.ADMIN_EMAIL || ""
  if (!to) return
  await sendMail({
    to,
    subject: `🛍️ Nouvelle commande ${orderNumber}`,
    body: `Nouvelle commande reçue.\n\nNuméro : ${orderNumber}\nClient : ${fullName}\nTotal : ${total} DA\n\n→ Connectez-vous au back-office pour la valider.`,
  })
}
