"use client";

// ─────────────────────────────────────────────────────────────
// OrdersView — liste principale des commandes.
// GET /api/admin/orders?status=&q=&wilaya=&page=&pageSize=&sort=
// + export CSV (format=csv) via <a href> avec les filtres actifs.
// Tableau desktop / cartes empilées mobile, recherche debouncée
// 400 ms, pagination, rafraîchissement auto léger (60 s si visible).
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { formatDA } from "@/lib/pricing";
import { ORDER_STATUSES, STATUS_LABELS, STATUS_TONE, WILAYAS, wilayaByCode } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUserDTO, OrderDTO } from "@/lib/types";

const PAGE_SIZE = 20;

interface OrdersPage {
  orders: OrderDTO[];
  total: number;
  page: number;
  pages: number;
}

/** Date + heure selon la langue (rendu client après fetch) */
function formatDateTime(iso: string, lang: "fr" | "ar"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function OrdersView({ user }: { user: AdminUserDTO }) {
  const { t, lang } = useI18n();
  const { navigate, query } = useRouter();

  // Statut initial éventuel depuis l'URL (lien depuis le dashboard)
  const initialStatus = (() => {
    const s = query.get("status") ?? "";
    return (ORDER_STATUSES as readonly string[]).includes(s) ? s : "";
  })();

  const [status, setStatus] = useState(initialStatus);
  const [wilaya, setWilaya] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");

  const [data, setData] = useState<OrdersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Garde anti-course : ignore les réponses obsolètes
  const reqId = useRef(0);

  // ── Recherche debouncée 400 ms ──────────────────────────────
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next === q) return; // rien de neuf (montage ou valeur déjà synchro)
      setQ(next);
      setPage(1);
      setLoading(true);
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput, q]);

  /** Recherche en cours de debounce (squelette pendant ce délai) */
  const debouncing = searchInput.trim() !== q;

  // ── Chargement (setState uniquement dans les callbacks async) ─
  const runFetch = useCallback(
    (token: number) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
      });
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      if (wilaya) params.set("wilaya", wilaya);
      api<OrdersPage>(`/api/admin/orders?${params.toString()}`)
        .then((d) => {
          if (token !== reqId.current) return;
          setData(d);
          setError("");
        })
        .catch((e) => {
          if (token !== reqId.current) return;
          setData(null);
          setError(e instanceof ApiError ? e.message : t("admin.orders.errorGeneric"));
        })
        .finally(() => {
          if (token === reqId.current) setLoading(false);
        });
    },
    [status, q, wilaya, sort, page, t]
  );

  useEffect(() => {
    const token = ++reqId.current;
    runFetch(token);
  }, [runFetch]);

  /** Rafraîchissement manuel (bouton) */
  const reload = () => {
    setLoading(true);
    runFetch(++reqId.current);
  };

  // ── Rafraîchissement auto léger (60 s, onglet visible) ─────
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        runFetch(++reqId.current);
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [runFetch]);

  // ── Lien export CSV (filtres courants) ──────────────────────
  const csvHref = (() => {
    const params = new URLSearchParams({ format: "csv", sort });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (wilaya) params.set("wilaya", wilaya);
    return `/api/admin/orders?${params.toString()}`;
  })();

  const hasFilters = Boolean(status || q || wilaya || sort !== "recent");

  const resetFilters = () => {
    setStatus("");
    setWilaya("");
    setSort("recent");
    setSearchInput("");
    setQ("");
    setPage(1);
    setLoading(true);
  };

  const openOrder = (o: OrderDTO) => navigate(`/admin/orders/${o.id}`);

  const modeLabel = (o: OrderDTO) =>
    o.deliveryMode === "pickup" ? t("admin.orders.pickup") : t("admin.orders.home");

  /** Nom de wilaya localisé (fallback : nom stocké sur la commande) */
  const wilayaLabel = (o: OrderDTO): string => {
    const w = wilayaByCode(o.wilayaCode);
    return w ? (lang === "ar" ? w.nameAr : w.name) : o.wilayaName;
  };

  // ── Skeleton ────────────────────────────────────────────────
  const renderSkeleton = () => (
    <div className="space-y-3" aria-busy="true" aria-label={t("common.actions.loading")}>
      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      {/* Desktop */}
      <div className="hidden space-y-2 md:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── En-tête ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t("admin.orders.listTitle")}
          </h1>
          {data && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("admin.orders.resultsCount", { count: data.total })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={reload}
            disabled={loading}
            aria-label={t("admin.dash.retry")}
            title={t("admin.dash.retry")}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          </Button>
          <Button variant="outline" className="h-11" asChild>
            <a href={csvHref} target="_blank" rel="noopener noreferrer" download>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("admin.orders.exportCsv")}</span>
              <span className="sm:hidden">CSV</span>
            </a>
          </Button>
        </div>
      </div>

      {/* ── Barre de filtres ─────────────────────────────────── */}
      <div className="no-print grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Recherche */}
        <div className="relative col-span-2 sm:col-span-1">
          <Label htmlFor="orders-search" className="sr-only">
            {t("common.actions.search")}
          </Label>
          <Search
            className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="orders-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("admin.orders.searchPlaceholder")}
            className="h-11 ps-9 pe-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute inset-y-0 end-0 my-auto me-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t("common.actions.clear")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Statut */}
        <div>
          <Label htmlFor="orders-status" className="sr-only">
            {t("admin.orders.filterStatus")}
          </Label>
          <Select
            value={status || "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? "" : v);
              setPage(1);
              setLoading(true);
            }}
          >
            <SelectTrigger id="orders-status" className="h-11 w-full" aria-label={t("admin.orders.filterStatus")}>
              <SelectValue placeholder={t("admin.orders.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.orders.allStatuses")}</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s][lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wilaya */}
        <div>
          <Label htmlFor="orders-wilaya" className="sr-only">
            {t("admin.orders.filterWilaya")}
          </Label>
          <Select
            value={wilaya || "all"}
            onValueChange={(v) => {
              setWilaya(v === "all" ? "" : v);
              setPage(1);
              setLoading(true);
            }}
          >
            <SelectTrigger id="orders-wilaya" className="h-11 w-full" aria-label={t("admin.orders.filterWilaya")}>
              <SelectValue placeholder={t("admin.orders.allWilayas")} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">{t("admin.orders.allWilayas")}</SelectItem>
              {WILAYAS.map((w) => (
                <SelectItem key={w.code} value={String(w.code)}>
                  {String(w.code).padStart(2, "0")} — {lang === "ar" ? w.nameAr : w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tri */}
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="orders-sort" className="sr-only">
            {t("admin.orders.sortLabel")}
          </Label>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); setLoading(true); }}>
            <SelectTrigger id="orders-sort" className="h-11 w-full" aria-label={t("admin.orders.sortLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("admin.orders.sortRecent")}</SelectItem>
              <SelectItem value="total-desc">{t("admin.orders.sortTotalDesc")}</SelectItem>
              <SelectItem value="total-asc">{t("admin.orders.sortTotalAsc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Erreur ───────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" className="h-9" onClick={reload}>
            {t("admin.orders.retry")}
          </Button>
        </div>
      )}

      {/* ── Contenu ──────────────────────────────────────────── */}
      {loading || debouncing ? (
        renderSkeleton()
      ) : data && data.orders.length === 0 ? (
        <div className="no-print flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          <div>
            <p className="font-medium">{t("admin.orders.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.orders.emptyHint")}</p>
          </div>
          {hasFilters && (
            <Button variant="outline" onClick={resetFilters} className="h-10">
              {t("admin.orders.resetFilters")}
            </Button>
          )}
        </div>
      ) : data ? (
        <>
          {/* ── Tableau (desktop) ── */}
          <div className="no-print hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="ps-4">{t("admin.orders.colNumber")}</TableHead>
                  <TableHead>{t("admin.orders.colDate")}</TableHead>
                  <TableHead>{t("admin.orders.colClient")}</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("admin.orders.colPhone")}
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    {t("admin.orders.colWilaya")}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">{t("admin.orders.colMode")}</TableHead>
                  <TableHead>{t("admin.orders.colStatus")}</TableHead>
                  <TableHead className="pe-4 text-end">{t("admin.orders.colTotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((o) => (
                  <TableRow
                    key={o.id}
                    tabIndex={0}
                    onClick={() => openOrder(o)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openOrder(o);
                      }
                    }}
                    className="cursor-pointer transition-colors duration-150 hover:bg-accent/50 focus-visible:bg-accent/50"
                    aria-label={t("admin.orders.orderLink", { number: o.number })}
                  >
                    <TableCell className="ps-4 font-mono text-xs font-medium sm:text-[13px]">
                      {o.number}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(o.createdAt, lang)}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm">{o.fullName}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm tabular-nums text-muted-foreground lg:table-cell" dir="ltr">
                      {o.phone}
                    </TableCell>
                    <TableCell className="hidden max-w-36 truncate text-sm text-muted-foreground xl:table-cell">
                      {wilayaLabel(o)}
                      {o.commune ? ` · ${o.commune}` : ""}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {modeLabel(o)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_TONE[o.status]}>
                        {STATUS_LABELS[o.status]?.[lang] ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pe-4 text-end text-sm font-semibold tabular-nums">
                      {formatDA(o.total, lang)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Cartes empilées (mobile) ── */}
          <ul className="no-print space-y-3 md:hidden">
            {data.orders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => openOrder(o)}
                  className="w-full rounded-xl border bg-card p-4 text-start shadow-sm transition-colors duration-150 active:bg-accent/60"
                  aria-label={t("admin.orders.orderLink", { number: o.number })}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">{o.number}</span>
                    <Badge className={STATUS_TONE[o.status]}>
                      {STATUS_LABELS[o.status]?.[lang] ?? o.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{o.fullName}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatDA(o.total, lang)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span dir="ltr" className="tabular-nums">
                      {o.phone}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">
                      {wilayaLabel(o)}
                      {o.commune ? ` — ${o.commune}` : ""}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{modeLabel(o)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {formatDateTime(o.createdAt, lang)}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {/* ── Pagination ── */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {t("admin.orders.resultsCount", { count: data.total })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  setLoading(true);
                }}
                aria-label={t("admin.orders.prevPage")}
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
              <p className="min-w-28 text-center text-sm tabular-nums text-muted-foreground">
                {t("admin.orders.pageOf", { page: data.page, pages: data.pages })}
              </p>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                disabled={page >= data.pages || loading}
                onClick={() => {
                  setPage((p) => p + 1);
                  setLoading(true);
                }}
                aria-label={t("admin.orders.nextPage")}
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
