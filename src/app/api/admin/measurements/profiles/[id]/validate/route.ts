import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// POST /api/admin/measurements/profiles/[id]/validate — valider/rejeter un profil
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
      status: "approved" | "rejected";
      comment?: string;
    };

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Créer la validation
    const validation = await db.measurementValidation.create({
      data: {
        profileId: id,
        validatedBy: adminEmail,
        status,
        comment: comment || null,
      },
    });

    // Mettre à jour le statut du profil
    if (status === "approved") {
      await db.measurementProfile.update({
        where: { id },
        data: { isValidated: true },
      });
    }

    return NextResponse.json({ validation });
  } catch (err) {
    console.error(`[POST /api/admin/measurements/profiles/[id]/validate]`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: err instanceof Error && err.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
