"use client";

// ─────────────────────────────────────────────────────────────
// ProductsView — liste des produits du catalogue (task C2).
// Tableau (desktop) + cartes (mobile) : vignette, titres FR/AR,
// catégorie, prix, badges visibilité/à la une/occasion. Actions
// rapides : toggle visible (PUT complet après rechargement),
// modifier (éditeur), supprimer (confirmation).
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Shirt,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { formatDA } from "@/lib/pricing";
import { OCCASIONS } from "@/lib/constants";
import type { ProductDTO } from "@/lib/types";
import { SmartImage } from "@/components/layout/smart-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buildProductBody } from "./product-editor";

/** Champ localisé (title / titleAr…) sans contrainte d'index signature */
function loc(obj: object, key: string, lang: "fr" | "ar"): string {
  const o = obj as Record<string, unknown>;
  const val = lang === "ar" ? o[`${key}Ar`] : o[key];
  return typeof val === "string" ? val : String(o[key] ?? "");
}

const iconBtn = "size-10";

function occasionLabel(value: string, lang: "fr" | "ar"): string {
  const occ = OCCASIONS.find((o) => o.value === value);
  return occ ? (lang === "ar" ? occ.ar : occ.fr) : "";
}

function VisibleBadge({ visible, label }: { visible: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        visible
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "border-zinc-500/30 bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
      )}
    >
      {visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
      {label}
    </Badge>
  );
}

export function ProductsView() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const p = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      t(`admin.products.${key}`, vars),
    [t]
  );

  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setProducts(null);
    setLoadError(null);
    api<{ products: ProductDTO[] }>("/api/admin/products")
      .then((d) => setProducts(d.products))
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : p("loadError"))
      );
  }, [p]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleVisible = useCallback(
    async (product: ProductDTO) => {
      setBusyId(product.id);
      try {
        // recharge le produit puis PUT complet avec inversion
        const fresh = await api<ProductDTO>(
          `/api/admin/products/${product.id}`
        );
        const body = buildProductBody(fresh);
        body.visible = !fresh.visible;
        const updated = await api<ProductDTO>(`/api/admin/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setProducts((prev) =>
          prev ? prev.map((x) => (x.id === updated.id ? updated : x)) : prev
        );
        toast.success(updated.visible ? p("nowVisible") : p("nowHidden"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : p("loadError"));
      } finally {
        setBusyId(null);
      }
    },
    [p]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      setProducts((prev) =>
        prev ? prev.filter((x) => x.id !== deleteTarget.id) : prev
      );
      toast.success(p("deleted"));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : p("loadError"));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, p]);

  // ── Rendu ───────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-semibold">{p("title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {p("subtitle")}
          {products ? (
            <span className="ms-2 rounded-full border bg-muted/50 px-2 py-0.5 text-xs">
              {p("count", { count: products.length })}
            </span>
          ) : null}
        </p>
      </div>
      <Button
        className="h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
        onClick={() => navigate("/admin/products/new")}
      >
        <Plus className="size-4" />
        {p("newProduct")}
      </Button>
    </div>
  );

  if (loadError) {
    return (
      <div className="space-y-4">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <TriangleAlert className="size-8 text-gold" />
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" className="h-11" onClick={load}>
              {t("common.actions.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!products) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.actions.loading")}>
        {header}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Shirt className="size-10 text-gold/70" />
            <p className="font-medium">{p("emptyTitle")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {p("emptyDesc")}
            </p>
            <Button
              className="mt-2 h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
              onClick={() => navigate("/admin/products/new")}
            >
              <Plus className="size-4" />
              {p("newProduct")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const busy = (id: string) => busyId === id;

  const actions = (prod: ProductDTO) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(iconBtn)}
        onClick={() => toggleVisible(prod)}
        disabled={busy(prod.id)}
        aria-label={prod.visible ? p("hide") : p("show")}
        title={prod.visible ? p("hide") : p("show")}
      >
        {busy(prod.id) ? (
          <Loader2 className="size-4 animate-spin text-gold" />
        ) : prod.visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={iconBtn}
        onClick={() => navigate(`/admin/products/${prod.id}`)}
        aria-label={p("edit")}
        title={p("edit")}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(iconBtn, "text-red-400 hover:text-red-500")}
        onClick={() => setDeleteTarget(prod)}
        aria-label={t("common.actions.delete")}
        title={t("common.actions.delete")}
      >
        <span className="text-base leading-none">×</span>
      </Button>
    </div>
  );

  const badges = (prod: ProductDTO) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <VisibleBadge visible={prod.visible} label={prod.visible ? p("visible") : p("hidden")} />
      {prod.featured ? (
        <Badge
          variant="outline"
          className="border-gold/40 bg-gold/15 text-gold"
        >
          <Sparkles className="size-3" />
          {p("featured")}
        </Badge>
      ) : null}
      {prod.occasion ? (
        <Badge variant="outline" className="text-muted-foreground">
          {occasionLabel(prod.occasion, lang)}
        </Badge>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      {header}

      {/* Tableau — desktop */}
      <Card className="hidden md:block">
        <CardContent className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{p("colProduct")}</TableHead>
                <TableHead className="text-start">{p("colCategory")}</TableHead>
                <TableHead className="text-start">{p("colPrice")}</TableHead>
                <TableHead className="text-start">{p("colStatus")}</TableHead>
                <TableHead className="text-end">{p("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((prod) => (
                <TableRow
                  key={prod.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/products/${prod.id}`)}
                >
                  <TableCell className="max-w-80">
                    <div className="flex items-center gap-3">
                      {prod.images[0] ? (
                        <SmartImage
                          src={prod.images[0].url}
                          alt={prod.images[0].alt || prod.title}
                          className="h-16 w-12 shrink-0 rounded-lg"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                          <Shirt className="size-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {loc(prod, "title", lang)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground" dir="rtl">
                          {prod.titleAr}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p("photos", { count: prod.images.length })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {prod.category ? loc(prod.category, "name", lang) : p("noCategory")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">
                    {formatDA(prod.basePrice, lang)}
                  </TableCell>
                  <TableCell>{badges(prod)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {actions(prod)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cartes — mobile */}
      <ul className="space-y-3 md:hidden">
        {products.map((prod) => (
          <li key={prod.id}>
            <Card>
              <CardContent className="flex gap-3 py-4">
                {prod.images[0] ? (
                  <SmartImage
                    src={prod.images[0].url}
                    alt={prod.images[0].alt || prod.title}
                    className="h-24 w-18 shrink-0 rounded-lg"
                    sizes="72px"
                  />
                ) : (
                  <div className="flex h-24 w-18 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <Shirt className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{loc(prod, "title", lang)}</p>
                      <p className="truncate text-xs text-muted-foreground" dir="rtl">
                        {prod.titleAr}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold">
                      {formatDA(prod.basePrice, lang)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {prod.category ? loc(prod.category, "name", lang) : p("noCategory")}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="min-w-0">{badges(prod)}</div>
                    {actions(prod)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {/* Confirmation suppression */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {p("deleteDesc", {
                title: deleteTarget ? loc(deleteTarget, "title", lang) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11" disabled={deleting}>
              {t("common.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={(ev) => {
                ev.preventDefault();
                confirmDelete();
              }}
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t("common.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
