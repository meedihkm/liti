"use client";

// ─────────────────────────────────────────────────────────────
// ShippingView — frais de livraison à domicile par wilaya (C2).
// Table des 58 wilayas (tarif éditable + switch active), filtre
// de recherche, indicateur « actives », enregistrement global
// (PUT /api/admin/shipping) avec suivi des modifications.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Save,
  Search,
  Truck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { WILAYAS } from "@/lib/constants";
import type { ShippingRateDTO } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Champ localisé (wilayaName / wilayaNameAr…) sans index signature */
function loc(obj: object, key: string, lang: "fr" | "ar" | "kab"): string {
  const o = obj as Record<string, unknown>;
  if (lang === "ar") {
    const val = o[`${key}Ar`];
    if (typeof val === "string" && val) return val;
  }
  if (lang === "kab") {
    const val = o[`${key}Kab`];
    if (typeof val === "string" && val) return val;
  }
  const val = o[key];
  return typeof val === "string" ? val : "";
}

interface RateDraft {
  wilayaCode: number;
  wilayaName: string;
  wilayaNameAr: string;
  /** texte libre — parsé à l'enregistrement */
  homePrice: string;
  active: boolean;
}

function toDrafts(rates: ShippingRateDTO[]): RateDraft[] {
  return rates
    .slice()
    .sort((a, b) => a.wilayaCode - b.wilayaCode)
    .map((r) => ({
      wilayaCode: r.wilayaCode,
      wilayaName: r.wilayaName,
      wilayaNameAr: r.wilayaNameAr,
      homePrice: String(r.homePrice),
      active: r.active,
    }));
}

export function ShippingView() {
  const { t, lang } = useI18n();
  const s = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      t(`admin.shipping.${key}`, vars),
    [t]
  );

  const [drafts, setDrafts] = useState<RateDraft[] | null>(null);
  const [baseline, setBaseline] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setDrafts(null);
    setLoadError(null);
    api<{ rates: ShippingRateDTO[] }>("/api/admin/shipping")
      .then((d) => {
        const next = toDrafts(
          // complétude défensive : fusion avec la liste constante des 58
          WILAYAS.map(
            (w) =>
              d.rates.find((r) => r.wilayaCode === w.code) ?? {
                wilayaCode: w.code,
                wilayaName: w.name,
                wilayaNameAr: w.nameAr,
                homePrice: 0,
                active: true,
              }
          )
        );
        setDrafts(next);
        setBaseline(JSON.stringify(next));
      })
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : s("loadError"))
      );
  }, [s]);

  useEffect(() => {
    load();
  }, [load]);

  const patchRate = useCallback(
    (code: number, patch: Partial<Pick<RateDraft, "homePrice" | "active">>) => {
      setDrafts((prev) => {
        if (!prev) return prev;
        return prev.map((r) =>
          r.wilayaCode === code ? { ...r, ...patch } : r
        );
      });
    },
    []
  );

  const filtered = useMemo(() => {
    if (!drafts) return null;
    const q = query.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter(
      (r) =>
        String(r.wilayaCode).startsWith(q) ||
        r.wilayaName.toLowerCase().includes(q) ||
        r.wilayaNameAr.includes(query.trim())
    );
  }, [drafts, query]);

  const dirty = drafts ? JSON.stringify(drafts) !== baseline : false;
  const activeCount = drafts?.filter((r) => r.active).length ?? 0;

  const saveAll = useCallback(async () => {
    if (!drafts) return;
    for (const r of drafts) {
      const price = Math.round(Number(r.homePrice));
      if (!Number.isFinite(price) || price < 0) {
        toast.error(`${loc(r, "wilayaName", lang)} — ${s("loadError")}`);
        return;
      }
    }
    setSaving(true);
    try {
      await api("/api/admin/shipping", {
        method: "PUT",
        body: JSON.stringify(
          drafts.map((r) => ({
            wilayaCode: r.wilayaCode,
            homePrice: Math.max(0, Math.round(Number(r.homePrice) || 0)),
            active: r.active,
          }))
        ),
      });
      setBaseline(JSON.stringify(drafts));
      toast.success(s("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : s("loadError"));
    } finally {
      setSaving(false);
    }
  }, [drafts, s, lang]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <Truck className="size-5 text-gold" />
          {s("title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{s("subtitle")}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="h-8 gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-3 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3.5" />
          {s("activeBadge", { count: activeCount })}
        </Badge>
        <Button
          className="h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
          onClick={saveAll}
          disabled={!drafts || saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span className="hidden sm:inline">
            {saving ? s("saving") : s("saveAll")}
          </span>
        </Button>
      </div>
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

  if (!drafts || !filtered) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.actions.loading")}>
        {header}
        <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}

      {dirty ? (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-medium text-gold">
          {s("dirty")}
        </p>
      ) : null}

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s("searchPh")}
          className="h-11 ps-9"
          aria-label={s("searchPh")}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {s("searchNoResult", { q: query.trim() })}
        </p>
      ) : (
        <Card>
          <CardContent className="py-0">
            <div className="max-h-[560px] overflow-y-auto overscroll-contain">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-14 text-start">{s("colCode")}</TableHead>
                    <TableHead className="text-start">{s("colWilaya")}</TableHead>
                    <TableHead className="text-start">{s("colPrice")}</TableHead>
                    <TableHead className="w-20 text-center">{s("colActive")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow
                      key={r.wilayaCode}
                      className={cn(!r.active && "opacity-60")}
                    >
                      <TableCell className="tabular-nums text-muted-foreground">
                        {String(r.wilayaCode).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {loc(r, "wilayaName", lang)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={50}
                          value={r.homePrice}
                          onChange={(e) =>
                            patchRate(r.wilayaCode, { homePrice: e.target.value })
                          }
                          className="h-11 w-32"
                          aria-label={`${s("colPrice")} — ${loc(r, "wilayaName", lang)}`}
                          disabled={!r.active}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={r.active}
                          onCheckedChange={(v) =>
                            patchRate(r.wilayaCode, { active: v })
                          }
                          aria-label={`${s("colActive")} — ${loc(r, "wilayaName", lang)}`}
                          className="scale-110 data-[state=checked]:bg-gold"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sauvegarde bas de page (mobile) */}
      <div className="flex items-center justify-end gap-2 pb-2">
        {dirty ? (
          <span className="text-xs font-medium text-gold">{s("dirty")}</span>
        ) : null}
        <Button
          className="h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
          onClick={saveAll}
          disabled={!drafts || saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? s("saving") : s("saveAll")}
        </Button>
      </div>
    </div>
  );
}
