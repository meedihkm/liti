// ─────────────────────────────────────────────────────────────
// PUT /api/measurements/profiles/:id — Modifier un profil
// DELETE /api/measurements/profiles/:id — Supprimer un profil
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateGuard } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResponse = rateGuard(req, "measurements", RATE_LIMITS.default);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await req.json();

    const sessionId = req.cookies.get("rk_measurement_session")?.value || "";

    // Vérifier que le profil appartient à cette session
    const existing = await db.measurementProfile.findFirst({
      where: { id, sessionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    const updated = await db.measurementProfile.update({
      where: { id },
      data: {
        name: body.name || existing.name,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      relation: updated.relation,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/profiles/:id PUT]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResponse = rateGuard(req, "measurements", RATE_LIMITS.default);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const sessionId = req.cookies.get("rk_measurement_session")?.value || "";

    // Vérifier que le profil appartient à cette session
    const existing = await db.measurementProfile.findFirst({
      where: { id, sessionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // Cascade delete via Prisma
    await db.measurementProfile.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/profiles/:id DELETE]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
