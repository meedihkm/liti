import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// GET /api/admin/measurements/profiles/[id] — détails d'un profil
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(["admin"]);
    if ("response" in auth) return auth.response;

    const profile = await db.measurementProfile.findUnique({
      where: { id: params.id },
      include: {
        measurements: {
          orderBy: { createdAt: "desc" },
        },
        validations: {
          orderBy: { validatedAt: "desc" },
        },
        _count: {
          select: {
            measurements: true,
            validations: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile, measurements: profile.measurements, validations: profile.validations });
  } catch (err) {
    console.error(`[GET /api/admin/measurements/profiles/${params.id}]`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: err instanceof Error && err.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
