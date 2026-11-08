"use client";

// ─────────────────────────────────────────────────────────────
// DashboardView — tableau de bord admin.
// GET /api/admin/stats → 4 cartes KPI, top produits (barres
// relatives), dernières commandes cliquables.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Clock3,
  Mail,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { formatDA } from "@/lib/pricing";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminStatsDTO, AdminUserDTO } from "@/lib/types";

/** Date courte selon la langue (client-only : rendu après fetch) */
function formatDate(iso: string, lang: "fr" | "ar"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

interface StatCard {
  key: string
  label: string
  hint: string
  value: string
  icon: typeof Sparkles
  href?: string
}

export function DashboardView({ user }: { user: AdminUserDTO }) {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<AdminStatsDTO>("/api/admin/stats")
      .then((d) => {
        setStats(d);
        setError("");
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : t("admin.dash.loadError")));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // ── État de chargement ─────────────────────────────────────
  if (!stats && !error) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={t("common.actions.loading")}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  // ── Erreur ─────────────────────────────────────────────────
  if (error || !stats) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={load} className="h-10">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("admin.dash.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const cards: StatCard[] = [
    {
      key: "newOrders",
      label: t("admin.dash.newOrders"),
      hint: t("admin.dash.newOrdersHint"),
      value: String(stats.newOrders),
      icon: Sparkles,
      href: "/admin/orders",
    },
    {
      key: "pending",
      label: t("admin.dash.pending"),
      hint: t("admin.dash.pendingHint"),
      value: String(stats.pendingOrders),
      icon: Clock3,
      href: "/admin/orders?status=pending",
    },
    {
      key: "monthRevenue",
      label: t("admin.dash.monthRevenue"),
      hint: t("admin.dash.monthRevenueHint"),
      value: formatDA(stats.monthRevenue, lang),
      icon: Banknote,
    },
    {
      key: "unreadMessages",
      label: t("admin.dash.unreadMessages"),
      hint: t("admin.dash.unreadMessagesHint"),
      value: String(stats.unreadMessages),
      icon: Mail,
      href: "/admin/messages",
    },
  ];

  const maxCount = Math.max(...stats.topProducts.map((p) => p.count), 1);

  const renderCard = (c: StatCard) => {
    const inner = (
      <>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">
              {c.value}
            </p>
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold"
            aria-hidden="true"
          >
            <c.icon className="h-4.5 w-4.5" />
          </span>
        </div>
        <p className="mt-2 truncate text-xs text-muted-foreground/80">{c.hint}</p>
      </>
    );
    const klass =
      "bg-card rounded-xl border p-4 text-start shadow-sm transition-colors duration-200 sm:p-5";
    if (c.href) {
      return (
        <button
          key={c.key}
          type="button"
          onClick={() => navigate(c.href!)}
          className={`${klass} min-h-28 cursor-pointer hover:border-gold/40 focus-visible:border-gold`}
          aria-label={`${c.label} : ${c.value}`}
        >
          {inner}
        </button>
      );
    }
    return (
      <div key={c.key} className={`${klass} min-h-28`}>
        {inner}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("admin.dash.greeting", { name: user.name })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.dash.subtitle")}</p>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{cards.map(renderCard)}</div>

      {/* Deux colonnes */}
      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Produits les plus commandés */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("admin.dash.topProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("admin.dash.topProductsEmpty")}
              </p>
            ) : (
              <ul className="space-y-4">
                {stats.topProducts.map((p) => (
                  <li key={p.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {t("admin.dash.topProductsCount", { count: p.count })}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-gold/80"
                        style={{ width: `${Math.max(Math.round((p.count / maxCount) * 100), 6)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Dernières commandes */}
        <Card className="lg:col-span-3">
          <CardHeader className="[.border-b]:pb-4">
            <CardTitle className="text-base">{t("admin.dash.recentOrders")}</CardTitle>
            <CardDescription>
              {t("admin.orders.resultsCount", { count: stats.totalOrders })}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("admin.dash.topProductsEmpty")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="ps-6">{t("admin.orders.colNumber")}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t("admin.orders.colDate")}
                    </TableHead>
                    <TableHead>{t("admin.orders.colClient")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("admin.orders.colStatus")}
                    </TableHead>
                    <TableHead className="pe-6 text-end">{t("admin.orders.colTotal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((o) => (
                    <TableRow
                      key={o.id}
                      tabIndex={0}
                      onClick={() => navigate(`/admin/orders/${o.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/admin/orders/${o.id}`);
                        }
                      }}
                      className="cursor-pointer transition-colors duration-150 hover:bg-accent/50"
                      aria-label={t("admin.dash.viewOrder", { number: o.number })}
                    >
                      <TableCell className="ps-6 font-mono text-xs font-medium sm:text-[13px]">
                        {o.number}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground sm:table-cell">
                        {formatDate(o.createdAt, lang)}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-sm">{o.fullName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={STATUS_TONE[o.status]}>
                          {STATUS_LABELS[o.status]?.[lang] ?? o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pe-6 text-end text-sm font-semibold tabular-nums">
                        {formatDA(o.total, lang)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <div className="border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/orders")}
              className="h-11 w-full sm:w-auto"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {t("admin.dash.seeAllOrders")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
