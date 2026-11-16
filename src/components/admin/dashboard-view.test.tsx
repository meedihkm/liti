import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardView } from "./dashboard-view";
import type { AdminUserDTO } from "@/lib/types";

// Mock des dépendances
vi.mock("@/lib/api-client", () => ({
  api: vi.fn(),
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, string | number>) => {
      if (key === "admin.dash.greeting" && vars?.name) return `Bonjour, ${vars.name}`;
      if (key === "admin.dash.newOrders") return "Nouvelles commandes";
      if (key === "admin.dash.pending") return "En attente";
      if (key === "admin.dash.monthRevenue") return "Revenu du mois";
      if (key === "admin.dash.unreadMessages") return "Messages non lus";
      if (key === "admin.dash.topProducts") return "Produits les plus commandés";
      if (key === "admin.dash.recentOrders") return "Dernières commandes";
      if (key === "admin.dash.topProductsEmpty") return "Aucun produit";
      if (key === "admin.dash.topProductsCount") return `${vars?.count} vendus`;
      if (key === "admin.orders.resultsCount") return `${vars?.count} commandes`;
      if (key === "admin.orders.colNumber") return "N°";
      if (key === "admin.orders.colDate") return "Date";
      if (key === "admin.orders.colClient") return "Client";
      if (key === "admin.orders.colStatus") return "Statut";
      if (key === "admin.orders.colTotal") return "Total";
      return key;
    },
    lang: "fr" as const,
  }),
}));

vi.mock("@/lib/router", () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
}));

import { api } from "@/lib/api-client";

describe("DashboardView", () => {
  const mockUser: AdminUserDTO = {
    id: "1",
    email: "admin@test.dz",
    name: "Admin Test",
    role: "admin",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le dashboard avec des données complètes", async () => {
    vi.mocked(api).mockResolvedValue({
      newOrders: 5,
      pendingOrders: 3,
      monthRevenue: 125000,
      totalOrders: 50,
      unreadMessages: 12,
      topProducts: [
        { name: "Robe Kabyle", count: 15 },
        { name: "Karakou", count: 10 },
      ],
      recentOrders: [
        {
          id: "1",
          number: "RK-2026-001",
          fullName: "Client Test",
          total: 25000,
          status: "pending",
          createdAt: "2026-11-10T10:00:00Z",
        },
      ],
    });

    render(<DashboardView user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("Bonjour, Admin Test")).toBeInTheDocument();
    });

    // Vérifier que les cartes KPI sont affichées
    expect(screen.getByText("Nouvelles commandes")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
    expect(screen.getByText("Revenu du mois")).toBeInTheDocument();
    expect(screen.getByText("Messages non lus")).toBeInTheDocument();

    // Vérifier les valeurs
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    // Vérifier les sections
    expect(screen.getByText("Produits les plus commandés")).toBeInTheDocument();
    expect(screen.getByText("Dernières commandes")).toBeInTheDocument();

    // Vérifier les produits
    expect(screen.getByText("Robe Kabyle")).toBeInTheDocument();
    expect(screen.getByText("15 vendus")).toBeInTheDocument();

    // Vérifier les commandes
    expect(screen.getByText("RK-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Client Test")).toBeInTheDocument();
  });

  it("ne plante pas avec une réponse API incomplète (topProducts undefined)", async () => {
    // Simuler une réponse cassée (API contract violé)
    vi.mocked(api).mockResolvedValue({
      newOrders: 5,
      pendingOrders: 3,
      monthRevenue: 125000,
      totalOrders: 50,
      unreadMessages: 12,
      topProducts: undefined, // ❌ Contrat cassé
      recentOrders: undefined, // ❌ Contrat cassé
    } as any);

    // Le composant ne doit PAS planter
    render(<DashboardView user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("Bonjour, Admin Test")).toBeInTheDocument();
    });

    // Les valeurs numériques doivent être affichées malgré le contrat cassé
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Les sections vides doivent afficher le message par défaut
    expect(screen.getByText("Aucun produit")).toBeInTheDocument();
  });

  it("ne plante pas avec des valeurs nulles", async () => {
    vi.mocked(api).mockResolvedValue({
      newOrders: null,
      pendingOrders: null,
      monthRevenue: null,
      totalOrders: null,
      unreadMessages: null,
      topProducts: null,
      recentOrders: null,
    } as any);

    // Ne doit pas planter, doit afficher 0 partout
    render(<DashboardView user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("Bonjour, Admin Test")).toBeInTheDocument();
    });

    // Les valeurs par défaut (0) doivent être affichées
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });

  it("ne plante pas avec topProducts comme objet au lieu de tableau", async () => {
    vi.mocked(api).mockResolvedValue({
      newOrders: 5,
      pendingOrders: 3,
      monthRevenue: 125000,
      totalOrders: 50,
      unreadMessages: 12,
      topProducts: { invalid: "structure" }, // ❌ Devrait être un tableau
      recentOrders: [],
    } as any);

    // Ne doit pas planter
    render(<DashboardView user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("Bonjour, Admin Test")).toBeInTheDocument();
    });

    // Doit afficher le message vide car topProducts n'est pas un tableau valide
    expect(screen.getByText("Aucun produit")).toBeInTheDocument();
  });

  it("affiche un message d'erreur si l'API échoue", async () => {
    vi.mocked(api).mockRejectedValue(new Error("Network error"));

    render(<DashboardView user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("admin.dash.loadError")).toBeInTheDocument();
    });

    // Le bouton de retry doit être présent
    expect(screen.getByText("admin.dash.retry")).toBeInTheDocument();
  });
});
