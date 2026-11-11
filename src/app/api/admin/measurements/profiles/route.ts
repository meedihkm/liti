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
        _count: {
          select: {
            measurements: true,
            validations: true,
          },
        },
      },
    });

    return NextResponse.json({ profiles });
  } catch (err) {
    console.error("[GET /api/admin/measurements/profiles]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: err instanceof Error && err.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
