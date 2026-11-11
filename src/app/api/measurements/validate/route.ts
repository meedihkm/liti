// ─────────────────────────────────────────────────────────────
// POST /api/measurements/validate — Valider côté serveur
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { parseBody, rateGuard } from "@/lib/api";
import { measurementValuesSchema } from "@/lib/validators";
import { checkCoherence } from "@/lib/measurements/rules";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = rateGuard(req, "measurements", RATE_LIMITS.default);
    if (rateLimitResponse) return rateLimitResponse;

    const bodyResult = await parseBody(req, measurementValuesSchema);
    if ("response" in bodyResult) return bodyResult.response;
    const body = bodyResult.data;

    // Vérifier cohérence
    const alerts = checkCoherence(body, "fr");

    return NextResponse.json({ valid: alerts.length === 0, alerts });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/validate POST]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
