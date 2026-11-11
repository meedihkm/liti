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
    await rateGuard(req, "measurements", RATE_LIMITS.default);

    const body = await parseBody(req, measurementValuesSchema);

    // Vérifier cohérence
    const alerts = checkCoherence(body, "fr");

    return NextResponse.json({ valid: alerts.length === 0, alerts });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[measurements/validate POST]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
