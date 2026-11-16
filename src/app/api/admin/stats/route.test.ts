import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import type { AdminStatsDTO } from "@/lib/types";

// Mock des dépendances
vi.mock("@/lib/db", () => ({
  db: {
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    contactMessage: {
      count: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api", () => ({
  requireAdmin: vi.fn(),
}));

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne AdminStatsDTO avec la forme exacte attendue", async () => {
    // Mock requireAdmin pour simuler un admin authentifié
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { id: "1", email: "admin@test.dz", name: "Admin", role: "admin" },
    });

    // Mock toutes les requêtes Prisma
    vi.mocked(db.order.count)
      .mockResolvedValueOnce(5) // newOrders (48h)
      .mockResolvedValueOnce(3) // pendingOrders
      .mockResolvedValueOnce(50); // totalOrders

    vi.mocked(db.order.aggregate).mockResolvedValue({
      _sum: { total: 125000 },
      _count: { _all: 0 },
      _avg: {},
      _max: {},
      _min: {},
    });

    vi.mocked(db.contactMessage.count).mockResolvedValue(12);

    vi.mocked(db.orderItem.groupBy).mockResolvedValue([
      { productName: "Robe Kabyle Traditionnelle", _sum: { quantity: 15 } },
      { productName: "Karakou Moderne", _sum: { quantity: 12 } },
      { productName: "Gandoura Élégante", _sum: { quantity: 8 } },
    ]);

    vi.mocked(db.order.findMany).mockResolvedValue([
      {
        id: "order1",
        number: "RK-2026-001",
        fullName: "Client Test",
        total: 25000,
        status: "pending",
        createdAt: new Date("2026-11-10T10:00:00Z"),
      },
      {
        id: "order2",
        number: "RK-2026-002",
        fullName: "Client Deux",
        total: 30000,
        status: "validated",
        createdAt: new Date("2026-11-09T15:30:00Z"),
      },
    ] as any);

    // Créer une fausse requête
    const request = new NextRequest("http://localhost:3000/api/admin/stats");

    // Appeler la route
    const response = await GET(request);
    const data = (await response.json()) as AdminStatsDTO;

    // Vérifier la structure exacte de AdminStatsDTO
    expect(data).toHaveProperty("newOrders");
    expect(data).toHaveProperty("pendingOrders");
    expect(data).toHaveProperty("monthRevenue");
    expect(data).toHaveProperty("totalOrders");
    expect(data).toHaveProperty("unreadMessages");
    expect(data).toHaveProperty("topProducts");
    expect(data).toHaveProperty("recentOrders");

    // Vérifier les types
    expect(typeof data.newOrders).toBe("number");
    expect(typeof data.pendingOrders).toBe("number");
    expect(typeof data.monthRevenue).toBe("number");
    expect(typeof data.totalOrders).toBe("number");
    expect(typeof data.unreadMessages).toBe("number");
    expect(Array.isArray(data.topProducts)).toBe(true);
    expect(Array.isArray(data.recentOrders)).toBe(true);

    // Vérifier les valeurs mockées
    expect(data.newOrders).toBe(5);
    expect(data.pendingOrders).toBe(3);
    expect(data.monthRevenue).toBe(125000);
    expect(data.totalOrders).toBe(50);
    expect(data.unreadMessages).toBe(12);

    // Vérifier la forme de topProducts
    expect(data.topProducts.length).toBe(3);
    expect(data.topProducts[0]).toHaveProperty("name");
    expect(data.topProducts[0]).toHaveProperty("count");
    expect(data.topProducts[0].name).toBe("Robe Kabyle Traditionnelle");
    expect(data.topProducts[0].count).toBe(15);

    // Vérifier la forme de recentOrders
    expect(data.recentOrders.length).toBe(2);
    expect(data.recentOrders[0]).toHaveProperty("id");
    expect(data.recentOrders[0]).toHaveProperty("number");
    expect(data.recentOrders[0]).toHaveProperty("fullName");
    expect(data.recentOrders[0]).toHaveProperty("total");
    expect(data.recentOrders[0]).toHaveProperty("status");
    expect(data.recentOrders[0]).toHaveProperty("createdAt");
    expect(typeof data.recentOrders[0].createdAt).toBe("string"); // ISO string

    // Vérifier que les champs exclus ne sont PAS présents (pas de fuite de données sensibles)
    expect(data.recentOrders[0]).not.toHaveProperty("phone");
    expect(data.recentOrders[0]).not.toHaveProperty("address");
    expect(data.recentOrders[0]).not.toHaveProperty("email");
  });

  it("retourne 401 si non authentifié", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      response: new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 }),
    });

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Non autorisé");
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { id: "1", email: "admin@test.dz", name: "Admin", role: "admin" },
    });

    // Simuler une erreur Prisma
    vi.mocked(db.order.count).mockRejectedValue(new Error("Database connection failed"));

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Erreur serveur");
  });
});
