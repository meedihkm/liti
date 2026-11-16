import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// POST /api/admin/measurements/profiles/[id]/validate — valider/rejeter tous les measurement sets d'un profil
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(["admin"]);
    if ("response" in auth) return auth.response;
    
    const { id } = await params;
    const adminEmail = auth.user.email;
    const body = await req.json();

    const { status, comment } = body as {
      status: "approved" | "needs_correction";
      comment?: string;
    };

    if (!status || !["approved", "needs_correction"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Use 'approved' or 'needs_correction'" },
        { status: 400 }
      );
    }

    // Récupérer tous les measurement sets du profil
    const profile = await db.measurementProfile.findUnique({
      where: { id },
      include: {
        measurements: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.measurements.length === 0) {
      return NextResponse.json(
        { error: "No measurements to validate" },
        { status: 400 }
      );
    }

    // Créer une validation pour chaque measurement set
    const validations = await Promise.all(
      profile.measurements.map((measurement) =>
        db.measurementValidation.create({
          data: {
            measurementSetId: measurement.id,
            validatedBy: adminEmail,
            status,
            comment: comment || "",
          },
        })
      )
    );

    return NextResponse.json({ 
      validations,
      message: `${validations.length} measurement(s) validated as ${status}`,
    });
  } catch (err) {
    console.error(`[POST /api/admin/measurements/profiles/[id]/validate]`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: err instanceof Error && err.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
