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
    const rateLimitResponse = rateGuard(req, "measurements", RATE_LIMITS.default);
    if (rateLimitResponse) return rateLimitResponse;

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

    // Sérialiser dans le format attendu par le client
    const serialized = profiles.map((p) => {
      const latestMeasurement = p.measurements[0];
      let isValidated = false;
      let measurementValues: Record<string, number> = {};

      if (latestMeasurement) {
        // Parse les valeurs de mesure
        const values = JSON.parse(latestMeasurement.valuesJson);
        measurementValues = values;

        // Vérifier validation
        if (latestMeasurement.validations[0]?.status === "approved") {
          isValidated = true;
        }
      }

      return {
        id: p.id,
        name: p.name,
        isValidated,
        createdAt: p.createdAt.toISOString(),
        measurements: latestMeasurement
          ? [
              {
                id: latestMeasurement.id,
                chest: measurementValues.chest || 0,
                waist: measurementValues.waist || 0,
                hips: measurementValues.hips || 0,
                shoulders: measurementValues.shoulders || 0,
                sleeve: measurementValues.sleeve || 0,
                length: measurementValues.length || 0,
                createdAt: latestMeasurement.createdAt.toISOString(),
              },
            ]
          : [],
      };
    });

    return NextResponse.json({ profiles: serialized });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/profiles GET]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = rateGuard(req, "measurements", RATE_LIMITS.default);
    if (rateLimitResponse) return rateLimitResponse;

    const bodyResult = await parseBody(req, measurementProfileCreateSchema);
    if ("response" in bodyResult) return bodyResult.response;
    const body = bodyResult.data;

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
