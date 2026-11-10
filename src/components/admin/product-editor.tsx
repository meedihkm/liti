"use client";

// ─────────────────────────────────────────────────────────────
// ProductEditor — création / modification d'un produit (task C2).
// Sections empilées : infos, photos (upload + URL), tissus avec
// supplément et couleurs par tissu, couleurs, broderies, aperçu
// des prix. Enregistrement POST/PUT → retour au catalogue.
// ─────────────────────────────────────────────────────────────

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  Link2,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, uploadImage } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { formatDA } from "@/lib/pricing";
import { OCCASIONS } from "@/lib/constants";
import type {
  CategoryDTO,
  ColorDTO,
  EmbroideryDTO,
  FabricDTO,
  ProductDTO,
} from "@/lib/types";
import { SmartImage } from "@/components/layout/smart-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Champ localisé (name / nameAr / nameKab…) sans contrainte d'index signature */
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

// ── Body d'upsert produit (contrat productUpsertSchema) ───────

export interface ProductUpsertBody {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  basePrice: number;
  customSizeFee: number;
  leadTimeDays: number;
  featured: boolean;
  visible: boolean;
  hasCustomLength: boolean;
  occasion: string;
  categoryId: string;
  images: { url: string; alt: string }[];
  fabrics: { fabricId: string; priceExtra: number; colorIds: string[] }[];
  colorIds: string[];
  embroideryIds: string[];
}

/** Reconstruit le body PUT complet à partir d'un DTO produit. */
export function buildProductBody(p: ProductDTO): ProductUpsertBody {
  return {
    title: p.title,
    titleAr: p.titleAr,
    description: p.description,
    descriptionAr: p.descriptionAr,
    basePrice: p.basePrice,
    customSizeFee: p.customSizeFee,
    leadTimeDays: p.leadTimeDays,
    featured: p.featured,
    visible: p.visible,
    hasCustomLength: p.hasCustomLength,
    occasion: p.occasion ?? "",
    categoryId: p.categoryId,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    fabrics: p.fabrics.map((f) => ({
      fabricId: f.id,
      priceExtra: f.productExtra,
      colorIds: f.colorIds ?? [],
    })),
    colorIds: p.colors.map((c) => c.id),
    embroideryIds: p.embroideries.map((e) => e.id),
  };
}

// ── Types locaux ──────────────────────────────────────────────

interface ImageEntry {
  url: string;
  alt: string;
}

interface FabricSelection {
  active: boolean;
  /** supplément appliqué pour CE produit (texte libre, parsé à l'enregistrement) */
  extra: string;
  /** couleurs sélectionnées pour ce tissu (⊂ couleurs du produit) */
  colors: string[];
}

interface EditorForm {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string;
  occasion: string;
  basePrice: string;
  customSizeFee: string;
  leadTimeDays: string;
  featured: boolean;
  visible: boolean;
  hasCustomLength: boolean;
}

const DEFAULT_FORM: EditorForm = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  categoryId: "",
  occasion: "",
  basePrice: "",
  customSizeFee: "1500",
  leadTimeDays: "14",
  featured: false,
  visible: true,
  hasCustomLength: false,
};

// petit bouton icône confortable au doigt (≥ 40 px)
const iconBtn = "size-10";

function parsePrice(value: string): number | null {
  const n = Number(value.trim());
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

// ── Composants internes ───────────────────────────────────────

function SwitchRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium leading-none">{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="scale-110 data-[state=checked]:bg-gold"
      />
    </div>
  );
}

function SectionCard({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <span
            className="flex size-7 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-semibold text-gold"
            aria-hidden="true"
          >
            {step}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function GoldCheckbox({
  className,
  ...props
}: ComponentProps<typeof Checkbox>) {
  return (
    <Checkbox
      className={cn(
        "size-4.5 data-[state=checked]:border-gold data-[state=checked]:bg-gold",
        className
      )}
      {...props}
    />
  );
}

// ── Vue ───────────────────────────────────────────────────────

export function ProductEditor({ id }: { id?: string }) {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const e = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      t(`admin.products.editor.${key}`, vars),
    [t]
  );

  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EditorForm>(DEFAULT_FORM);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [fabricSel, setFabricSel] = useState<Record<string, FabricSelection>>({});
  const [colorIds, setColorIds] = useState<string[]>([]);
  const [embroideryIds, setEmbroideryIds] = useState<string[]>([]);

  const [fabrics, setFabrics] = useState<FabricDTO[]>([]);
  const [colors, setColors] = useState<ColorDTO[]>([]);
  const [embroideries, setEmbroideries] = useState<EmbroideryDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);

  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Chargement initial ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const lists = Promise.all([
      api<{ fabrics: FabricDTO[] }>("/api/admin/fabrics"),
      api<{ colors: ColorDTO[] }>("/api/admin/colors"),
      api<{ embroideries: EmbroideryDTO[] }>("/api/admin/embroideries"),
      api<{ categories: CategoryDTO[] }>("/api/admin/categories"),
    ]);
    const productReq = id
      ? api<ProductDTO>(`/api/admin/products/${id}`).catch((err) => {
          throw err;
        })
      : Promise.resolve(null);

    Promise.all([lists, productReq])
      .then(([l, p]) => {
        if (cancelled) return;
        setFabrics(l[0].fabrics);
        setColors(l[1].colors);
        setEmbroideries(l[2].embroideries);
        setCategories(
          [...l[3].categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        );

        if (p) {
          setForm({
            title: p.title,
            titleAr: p.titleAr,
            description: p.description,
            descriptionAr: p.descriptionAr,
            categoryId: p.categoryId,
            occasion: p.occasion ?? "",
            basePrice: String(p.basePrice),
            customSizeFee: String(p.customSizeFee),
            leadTimeDays: String(p.leadTimeDays),
            featured: p.featured,
            visible: p.visible,
            hasCustomLength: p.hasCustomLength,
          });
          setImages(p.images.map((i) => ({ url: i.url, alt: i.alt })));
          const productColors = p.colors.map((c) => c.id);
          setColorIds(productColors);
          setEmbroideryIds(p.embroideries.map((x) => x.id));
          const sel: Record<string, FabricSelection> = {};
          for (const f of l[0].fabrics) {
            const pf = p.fabrics.find((x) => x.id === f.id);
            sel[f.id] = {
              active: Boolean(pf),
              extra: String(pf ? pf.productExtra : f.priceExtra),
              // colorIds [] = « toutes les couleurs du produit »
              colors: pf && pf.colorIds.length ? pf.colorIds : productColors,
            };
          }
          setFabricSel(sel);
        } else {
          const sel: Record<string, FabricSelection> = {};
          for (const f of l[0].fabrics) {
            sel[f.id] = { active: false, extra: String(f.priceExtra), colors: [] };
          }
          setFabricSel(sel);
        }
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(
          err instanceof Error && err.message ? err.message : e("loadError")
        );
        navigate("/admin/products");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Mutations d'état ────────────────────────────────────────
  const patch = useCallback((p: Partial<EditorForm>) => {
    setForm((prev) => ({ ...prev, ...p }));
  }, []);

  const moveImage = useCallback((index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      let added = 0;
      for (const file of Array.from(files)) {
        try {
          const { url } = await uploadImage(file);
          setImages((prev) => [...prev, { url, alt: "" }]);
          added += 1;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : e("loadError"));
        }
      }
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (added > 0) toast.success(e("imagesCount", { count: added }));
    },
    [e]
  );

  const addByUrl = useCallback(() => {
    const url = urlDraft.trim();
    if (!url || !/^(https?:\/\/|\/)/i.test(url)) {
      toast.error(e("imagesUrlPh"));
      return;
    }
    setImages((prev) => [...prev, { url, alt: "" }]);
    setUrlDraft("");
  }, [urlDraft, e]);

  const toggleProductColor = useCallback((cid: string, checked: boolean) => {
    setColorIds((prev) =>
      checked ? [...prev, cid] : prev.filter((c) => c !== cid)
    );
    if (!checked) {
      // retire la couleur des sélections par tissu
      setFabricSel((prev) => {
        const next: Record<string, FabricSelection> = {};
        for (const [fid, sel] of Object.entries(prev)) {
          next[fid] = { ...sel, colors: sel.colors.filter((c) => c !== cid) };
        }
        return next;
      });
    }
  }, []);

  const toggleEmbroidery = useCallback((eid: string, checked: boolean) => {
    setEmbroideryIds((prev) =>
      checked ? [...prev, eid] : prev.filter((x) => x !== eid)
    );
  }, []);

  const toggleFabricActive = useCallback((fid: string, active: boolean) => {
    setFabricSel((prev) => ({
      ...prev,
      [fid]: { ...prev[fid], active },
    }));
  }, []);

  const setFabricExtra = useCallback((fid: string, extra: string) => {
    setFabricSel((prev) => ({ ...prev, [fid]: { ...prev[fid], extra } }));
  }, []);

  const toggleFabricColor = useCallback(
    (fid: string, cid: string, checked: boolean) => {
      setFabricSel((prev) => {
        const sel = prev[fid];
        if (!sel) return prev;
        const nextColors = checked
          ? sel.colors.includes(cid)
            ? sel.colors
            : [...sel.colors, cid]
          : sel.colors.filter((c) => c !== cid);
        return { ...prev, [fid]: { ...sel, colors: nextColors } };
      });
    },
    []
  );

  const setFabricAllColors = useCallback(
    (fid: string, all: boolean) => {
      setFabricSel((prev) => ({
        ...prev,
        [fid]: { ...prev[fid], colors: all ? [...colorIds] : [] },
      }));
    },
    [colorIds]
  );

  // ── Aperçu des prix ─────────────────────────────────────────
  const activeExtras = useMemo(
    () =>
      Object.values(fabricSel)
        .filter((s) => s.active)
        .map((s) => Math.max(0, Math.round(Number(s.extra) || 0))),
    [fabricSel]
  );
  const minExtra = activeExtras.length ? Math.min(...activeExtras) : 0;
  const maxExtra = activeExtras.length ? Math.max(...activeExtras) : 0;
  const embTotal = useMemo(
    () =>
      embroideries
        .filter((x) => embroideryIds.includes(x.id))
        .reduce((sum, x) => sum + x.priceExtra, 0),
    [embroideries, embroideryIds]
  );
  const basePriceNum = Math.max(0, Math.round(Number(form.basePrice) || 0));
  const customFeeNum = Math.max(0, Math.round(Number(form.customSizeFee) || 0));

  // ── Enregistrement ──────────────────────────────────────────
  const save = useCallback(async () => {
    if (saving) return;
    // validation légère côté client (le serveur revalide tout)
    if (form.title.trim().length < 2 || form.titleAr.trim().length < 2) {
      toast.error(e("errTitle"));
      return;
    }
    if (!form.categoryId) {
      toast.error(e("errCategory"));
      return;
    }
    const bp = parsePrice(form.basePrice);
    const cf = parsePrice(form.customSizeFee);
    const lt = Number(form.leadTimeDays);
    if (bp === null || cf === null) {
      toast.error(e("errPrice"));
      return;
    }
    if (!Number.isInteger(lt) || lt < 1 || lt > 180) {
      toast.error(e("errLeadTime"));
      return;
    }

    const body: ProductUpsertBody = {
      title: form.title.trim(),
      titleAr: form.titleAr.trim(),
      description: form.description,
      descriptionAr: form.descriptionAr,
      basePrice: bp,
      customSizeFee: cf,
      leadTimeDays: lt,
      featured: form.featured,
      visible: form.visible,
      hasCustomLength: form.hasCustomLength,
      occasion: form.occasion,
      categoryId: form.categoryId,
      images: images.map((i) => ({ url: i.url, alt: i.alt })),
      fabrics: Object.entries(fabricSel)
        .filter(([, s]) => s.active)
        .map(([fid, s]) => ({
          fabricId: fid,
          priceExtra: Math.max(0, Math.round(Number(s.extra) || 0)),
          // toutes cochées (ou aucune) → [] = « toutes les couleurs du produit »
          colorIds:
            s.colors.length >= colorIds.length ? [] : s.colors.filter((c) => colorIds.includes(c)),
        })),
      colorIds,
      embroideryIds,
    };

    setSaving(true);
    try {
      if (id) {
        await api(`/api/admin/products/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast.success(e("saved"));
      navigate("/admin/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : e("loadError"));
    } finally {
      setSaving(false);
    }
  }, [saving, form, images, fabricSel, colorIds, embroideryIds, id, e, navigate]);

  // ── Rendu ───────────────────────────────────────────────────
  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.actions.loading")}>
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'actions collée sous le header global */}
      <div className="glass-strong sticky top-14 z-30 -mx-1 flex items-center gap-2 rounded-xl border px-3 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/products")}
          className="h-10 gap-1.5 px-2.5"
          aria-label={e("back")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          <span className="hidden sm:inline">{e("back")}</span>
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-display text-base font-semibold">
          {id ? e("titleEdit") : e("titleNew")}
          {id && form.title ? (
            <span className="ms-2 hidden text-sm font-normal text-muted-foreground sm:inline">
              · {lang === "ar" && form.titleAr ? form.titleAr : form.title}
            </span>
          ) : null}
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-10 sm:inline-flex"
          onClick={() => navigate("/admin/products")}
        >
          {t("common.actions.cancel")}
        </Button>
        <Button
          size="sm"
          className="h-10 bg-gold font-semibold text-black hover:bg-gold-strong"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? e("saving") : e("save")}
        </Button>
      </div>

      {/* 1. Informations */}
      <SectionCard title={e("sectionInfo")} step={1}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pe-title">{e("fTitle")}</Label>
              <Input
                id="pe-title"
                value={form.title}
                onChange={(ev) => patch({ title: ev.target.value })}
                placeholder="Robe Tamurt"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-title-ar">
                {e("fTitleAr")} <span className="text-xs text-muted-foreground">· {t("admin.settings.ar")}</span>
              </Label>
              <Input
                id="pe-title-ar"
                dir="rtl"
                value={form.titleAr}
                onChange={(ev) => patch({ titleAr: ev.target.value })}
                placeholder="فستان تامورت"
                maxLength={120}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pe-desc">{e("fDesc")}</Label>
              <Textarea
                id="pe-desc"
                value={form.description}
                onChange={(ev) => patch({ description: ev.target.value })}
                rows={5}
                maxLength={4000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-desc-ar">
                {e("fDescAr")} <span className="text-xs text-muted-foreground">· {t("admin.settings.ar")}</span>
              </Label>
              <Textarea
                id="pe-desc-ar"
                dir="rtl"
                value={form.descriptionAr}
                onChange={(ev) => patch({ descriptionAr: ev.target.value })}
                rows={5}
                maxLength={4000}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pe-category">{e("fCategory")}</Label>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(v) => patch({ categoryId: v })}
              >
                <SelectTrigger id="pe-category" className="h-11 w-full">
                  <SelectValue placeholder={e("fCategoryPh")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {loc(c, "name", lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-occasion">{e("fOccasion")}</Label>
              <Select
                value={form.occasion || "none"}
                onValueChange={(v) => patch({ occasion: v === "none" ? "" : v })}
              >
                <SelectTrigger id="pe-occasion" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{e("fOccasionNone")}</SelectItem>
                  {OCCASIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {lang === "ar" ? o.ar : o.fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pe-price">{e("fBasePrice")}</Label>
              <Input
                id="pe-price"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={form.basePrice}
                onChange={(ev) => patch({ basePrice: ev.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-customfee">{e("fCustomFee")}</Label>
              <Input
                id="pe-customfee"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={form.customSizeFee}
                onChange={(ev) => patch({ customSizeFee: ev.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-lead">{e("fLeadTime")}</Label>
              <Input
                id="pe-lead"
                type="number"
                inputMode="numeric"
                min={1}
                max={180}
                value={form.leadTimeDays}
                onChange={(ev) => patch({ leadTimeDays: ev.target.value })}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <SwitchRow
              label={e("fVisible")}
              hint={e("fVisibleHint")}
              checked={form.visible}
              onCheckedChange={(v) => patch({ visible: v })}
            />
            <SwitchRow
              label={e("fFeatured")}
              hint={e("fFeaturedHint")}
              checked={form.featured}
              onCheckedChange={(v) => patch({ featured: v })}
            />
            <SwitchRow
              label={e("fCustomLength")}
              hint={e("fCustomLengthHint")}
              checked={form.hasCustomLength}
              onCheckedChange={(v) => patch({ hasCustomLength: v })}
            />
          </div>
        </div>
      </SectionCard>

      {/* 2. Photos */}
      <SectionCard title={e("sectionImages")} step={2}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              hidden
              onChange={(ev) => handleFiles(ev.target.files)}
              aria-hidden="true"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {uploading ? e("imagesUploading") : e("imagesAdd")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {e("imagesCount", { count: images.length })}
            </span>
          </div>

          {/* Ajout par URL */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={urlDraft}
                onChange={(ev) => setUrlDraft(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    addByUrl();
                  }
                }}
                placeholder={e("imagesUrlPh")}
                className="h-11 ps-9"
                aria-label={e("imagesUrlPh")}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={addByUrl}
              disabled={!urlDraft.trim()}
            >
              {e("imagesUrlAdd")}
            </Button>
          </div>

          {images.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              {e("imagesEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {images.map((img, i) => (
                <li
                  key={`${img.url}-${i}`}
                  className="flex items-center gap-3 rounded-xl border bg-background p-2.5"
                >
                  <SmartImage
                    src={img.url}
                    alt={img.alt || form.title || "produit"}
                    className="h-20 w-16 shrink-0 rounded-lg"
                    sizes="64px"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {i === 0 ? (
                      <span className="w-fit rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                        {e("imagesMain")}
                      </span>
                    ) : null}
                    <Input
                      value={img.alt}
                      onChange={(ev) =>
                        setImages((prev) =>
                          prev.map((x, xi) =>
                            xi === i ? { ...x, alt: ev.target.value } : x
                          )
                        )
                      }
                      placeholder={e("imagesAltPh")}
                      maxLength={120}
                      aria-label={`${e("imagesAltPh")} ${i + 1}`}
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={iconBtn}
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      aria-label={`${e("imagesMoveUp")} ${i + 1}`}
                      title={e("imagesMoveUp")}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={iconBtn}
                      onClick={() => moveImage(i, 1)}
                      disabled={i === images.length - 1}
                      aria-label={`${e("imagesMoveDown")} ${i + 1}`}
                      title={e("imagesMoveDown")}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(iconBtn, "text-red-400 hover:text-red-500")}
                      onClick={() => removeImage(i)}
                      aria-label={`${e("imagesRemove")} ${i + 1}`}
                      title={e("imagesRemove")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      {/* 3. Couleurs (au niveau produit) */}
      <SectionCard title={e("sectionColors")} step={3}>
        <p className="text-sm text-muted-foreground">{e("colorsHint")}</p>
        {colors.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            {e("noneGlobalColors")}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {colors.map((c) => {
              const checked = colorIds.includes(c.id);
              return (
                <li key={c.id}>
                  <label
                    className={cn(
                      "flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3 transition-colors",
                      checked
                        ? "border-gold/50 bg-gold/8"
                        : "hover:bg-accent"
                    )}
                  >
                    <GoldCheckbox
                      checked={checked}
                      onCheckedChange={(v) => toggleProductColor(c.id, v === true)}
                      aria-label={loc(c, "name", lang)}
                    />
                    <span
                      className="size-5 shrink-0 rounded-full border shadow-inner"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 truncate text-sm">{loc(c, "name", lang)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* 4. Tissus & suppléments */}
      <SectionCard title={e("sectionFabrics")} step={4}>
        <p className="text-sm text-muted-foreground">{e("fabricsHint")}</p>
        {fabrics.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            {e("noneGlobalFabrics")}
          </p>
        ) : (
          <ul className="space-y-2">
            {fabrics.map((f) => {
              const sel = fabricSel[f.id] ?? {
                active: false,
                extra: String(f.priceExtra),
                colors: [],
              };
              const allChecked =
                colorIds.length > 0 && sel.colors.length >= colorIds.length;
              return (
                <li
                  key={f.id}
                  className={cn(
                    "rounded-xl border transition-colors",
                    sel.active ? "border-gold/40 bg-gold/5" : "bg-background"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3 p-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <GoldCheckbox
                        checked={sel.active}
                        onCheckedChange={(v) =>
                          toggleFabricActive(f.id, v === true)
                        }
                        aria-label={loc(f, "name", lang)}
                      />
                      {f.image ? (
                        <SmartImage
                          src={f.image}
                          alt={loc(f, "name", lang)}
                          className="size-11 shrink-0 rounded-lg"
                          sizes="44px"
                        />
                      ) : null}
                      <span className="min-w-0 truncate text-sm font-medium">
                        {loc(f, "name", lang)}
                        <span className="ms-2 text-xs font-normal text-muted-foreground">
                          {e("fabricDefault", {
                            extra: formatDA(f.priceExtra, lang),
                          })}
                        </span>
                      </span>
                    </label>
                    {sel.active ? (
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`fe-${f.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          {e("fabricExtra")}
                        </Label>
                        <Input
                          id={`fe-${f.id}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={100}
                          value={sel.extra}
                          onChange={(ev) => setFabricExtra(f.id, ev.target.value)}
                          className="h-11 w-32"
                        />
                      </div>
                    ) : null}
                  </div>
                  {sel.active ? (
                    <div className="border-t px-3 pb-3 pt-2.5">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {e("fabricColors")}
                      </p>
                      {colorIds.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {e("fabricNoColors")}
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm">
                            <GoldCheckbox
                              checked={allChecked}
                              onCheckedChange={(v) =>
                                setFabricAllColors(f.id, v === true)
                              }
                              aria-label={e("fabricAllColors")}
                            />
                            <span className="font-medium">
                              {e("fabricAllColors")}
                            </span>
                          </label>
                          {colors
                            .filter((c) => colorIds.includes(c.id))
                            .map((c) => {
                              const ckd = sel.colors.includes(c.id);
                              return (
                                <label
                                  key={c.id}
                                  className={cn(
                                    "flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                                    ckd ? "border-gold/50 bg-gold/8" : "hover:bg-accent"
                                  )}
                                >
                                  <GoldCheckbox
                                    checked={ckd}
                                    onCheckedChange={(v) =>
                                      toggleFabricColor(f.id, c.id, v === true)
                                    }
                                    aria-label={loc(c, "name", lang)}
                                  />
                                  <span
                                    className="size-4 shrink-0 rounded-full border"
                                    style={{ backgroundColor: c.hex }}
                                    aria-hidden="true"
                                  />
                                  {loc(c, "name", lang)}
                                </label>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* 5. Broderies */}
      <SectionCard title={e("sectionEmbroideries")} step={5}>
        <p className="text-sm text-muted-foreground">{e("embroideriesHint")}</p>
        {embroideries.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            {e("noneGlobalEmbroideries")}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {embroideries.map((x) => {
              const checked = embroideryIds.includes(x.id);
              return (
                <li key={x.id}>
                  <label
                    className={cn(
                      "flex h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 transition-colors",
                      checked ? "border-gold/50 bg-gold/8" : "hover:bg-accent"
                    )}
                  >
                    <GoldCheckbox
                      checked={checked}
                      onCheckedChange={(v) => toggleEmbroidery(x.id, v === true)}
                      aria-label={loc(x, "name", lang)}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {loc(x, "name", lang)}
                    </span>
                    <span className="text-xs font-semibold text-gold">
                      +{formatDA(x.priceExtra, lang)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* 6. Aperçu des prix */}
      <SectionCard title={e("sectionPreview")} step={6}>
        <div className="grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 border-b pb-2 sm:border-b-0 sm:pb-0">
            <span className="text-muted-foreground">{e("previewBase")}</span>
            <span className="font-semibold">{formatDA(basePriceNum, lang)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-b pb-2 sm:border-b-0 sm:pb-0">
            <span className="text-muted-foreground">{e("previewFrom")}</span>
            <span className="font-semibold">
              {formatDA(basePriceNum + minExtra, lang)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-b pb-2 sm:border-b-0 sm:pb-0">
            <span className="text-muted-foreground">{e("previewCustom")}</span>
            <span className="font-semibold text-gold">
              +{formatDA(customFeeNum, lang)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{e("previewEmbroideries")}</span>
            <span className="font-semibold text-gold">
              +{formatDA(embTotal, lang)}
            </span>
          </div>
          <p className="col-span-full text-xs text-muted-foreground">
            {e("previewUpTo")}{" "}
            <strong className="text-foreground">
              {formatDA(
                basePriceNum + maxExtra + embTotal + customFeeNum,
                lang
              )}
            </strong>
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {e("previewFrom")} = {e("previewBase")} +{" "}
          {formatDA(minExtra, lang)}
        </p>
      </SectionCard>

      {/* Sauvegarde bas de page (pratique sur longs formulaires mobiles) */}
      <div className="flex items-center justify-end gap-2 pb-2">
        <Button
          variant="outline"
          className="h-11"
          onClick={() => navigate("/admin/products")}
        >
          {t("common.actions.cancel")}
        </Button>
        <Button
          className="h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? e("saving") : e("save")}
        </Button>
      </div>
    </div>
  );
}
