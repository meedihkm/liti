import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// GET /api/admin/measurements/profiles — liste tous les profils
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(["admin"]);
    if ("response" in auth) return auth.response;

    const profiles = await db.measurementProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        measurements: {
          include: {
            _count: {
              select: {
                validations: true,
              },
            },
          },
        },
        _count: {
          select: {
            measurements: true,
          },
        },
      },
    });

    // Calculer le nombre total de validations pour chaque profil
    const profilesWithCounts = profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      sessionId: profile.sessionId,
      name: profile.name,
      relation: profile.relation,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      _count: {
        measurements: profile._count.measurements,
        validations: profile.measurements.reduce(
          (sum, m) => sum + (m._count?.validations || 0),
          0
        ),
      },
    }));

    return NextResponse.json({ profiles: profilesWithCounts });
  } catch (err) {
    console.error("[GET /api/admin/measurements/profiles]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: err instanceof Error && err.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
