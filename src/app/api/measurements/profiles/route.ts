// ─────────────────────────────────────────────────────────────
// GET /api/measurements/profiles — Liste des profils
// POST /api/measurements/profiles — Créer un profil
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, rateGuard } from "@/lib/api";
import { measurementProfileCreateSchema } from "@/lib/validators";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await rateGuard(req, "measurements", RATE_LIMITS.default);

    // Récupérer sessionId depuis cookie ou query (simplification)
    const sessionId = req.cookies.get("rk_measurement_session")?.value || "";

    if (!sessionId) {
      return NextResponse.json({ profiles: [] });
    }

    const profiles = await db.measurementProfile.findMany({
      where: { sessionId },
      include: {
        measurements: {
          orderBy: { createdAt: "desc" },
          take: 1, // Dernier jeu de mesures seulement
          include: {
            validations: {
              orderBy: { validatedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Sérialiser
    const serialized = profiles.map((p) => ({
      id: p.id,
      name: p.name,
      relation: p.relation,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      latestMeasurement: p.measurements[0]
        ? {
            id: p.measurements[0].id,
            method: p.measurements[0].method,
            values: JSON.parse(p.measurements[0].valuesJson),
            fit: p.measurements[0].fit,
            displayUnit: p.measurements[0].displayUnit,
            confirmed: JSON.parse(p.measurements[0].confirmedJson),
            note: p.measurements[0].note,
            createdAt: p.measurements[0].createdAt.toISOString(),
            validation: p.measurements[0].validations[0]
              ? {
                  status: p.measurements[0].validations[0].status,
                  validatedAt: p.measurements[0].validations[0].validatedAt.toISOString(),
                }
              : null,
          }
        : null,
    }));

    return NextResponse.json({ profiles: serialized });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/profiles GET]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await rateGuard(req, "measurements", RATE_LIMITS.default);

    const body = await parseBody(req, measurementProfileCreateSchema);

    // Créer ou récupérer sessionId
    let sessionId = body.sessionId || req.cookies.get("rk_measurement_session")?.value;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    const profile = await db.measurementProfile.create({
      data: {
        sessionId,
        name: body.name,
        relation: body.relation,
      },
    });

    const response = NextResponse.json(
      {
        id: profile.id,
        name: profile.name,
        relation: profile.relation,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
      { status: 201 }
    );

    // Définir cookie session
    response.cookies.set("rk_measurement_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 an
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/profiles POST]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
