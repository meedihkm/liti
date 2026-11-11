// ─────────────────────────────────────────────────────────────
// POST /api/measurements/sets — Créer un jeu de mesures
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, rateGuard } from "@/lib/api";
import { measurementSetCreateSchema } from "@/lib/validators";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = rateGuard(req, "measurements", RATE_LIMITS.default);
    if (rateLimitResponse) return rateLimitResponse;

    const bodyResult = await parseBody(req, measurementSetCreateSchema);
    if ("response" in bodyResult) return bodyResult.response;
    const body = bodyResult.data;

    const sessionId = req.cookies.get("rk_measurement_session")?.value || "";

    // Vérifier que le profil appartient à cette session
    const profile = await db.measurementProfile.findFirst({
      where: { id: body.profileId, sessionId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    const measurementSet = await db.measurementSet.create({
      data: {
        profileId: body.profileId,
        method: body.method,
        valuesJson: JSON.stringify(body.values),
        fit: body.fit,
        displayUnit: body.displayUnit,
        confirmedJson: JSON.stringify(body.confirmed),
        note: body.note,
      },
    });

    return NextResponse.json(
      {
        id: measurementSet.id,
        profileId: measurementSet.profileId,
        method: measurementSet.method,
        values: JSON.parse(measurementSet.valuesJson),
        fit: measurementSet.fit,
        displayUnit: measurementSet.displayUnit,
        confirmed: JSON.parse(measurementSet.confirmedJson),
        note: measurementSet.note,
        createdAt: measurementSet.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/sets POST]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
