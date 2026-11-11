import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-admin";

// GET /api/admin/measurements/profiles — liste tous les profils
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const profiles = await prisma.measurementProfile.findMany({
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
