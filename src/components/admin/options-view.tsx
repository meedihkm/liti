"use client";

// ─────────────────────────────────────────────────────────────
// OptionsView — tissus / couleurs / broderies / catégories (C2).
// Quatre onglets, CRUD complet via Dialog (ajout/édition inline)
// + AlertDialog de suppression (409 « produits liés » → toast).
// Chaque mutation appelle refresh() de usePublicData pour
// rafraîchir la vitrine.
// ─────────────────────────────────────────────────────────────

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Shapes,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { api, uploadImage } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { formatDA } from "@/lib/pricing";
import type {
  CategoryDTO,
  ColorDTO,
  EmbroideryDTO,
  FabricDTO,
} from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const iconBtn = "size-10";

/** Champ localisé (name / nameAr…) sans contrainte d'index signature */
function loc(obj: object, key: string, lang: "fr" | "ar"): string {
  const o = obj as Record<string, unknown>;
  const val = lang === "ar" ? o[`${key}Ar`] : o[key];
  return typeof val === "string" ? val : String(o[key] ?? "");
}

// pickers stables (module scope) — évitent tout re-rendu en boucle
const pickFabrics = (d: unknown): FabricDTO[] =>
  (d as { fabrics: FabricDTO[] }).fabrics;
const pickColors = (d: unknown): ColorDTO[] =>
  (d as { colors: ColorDTO[] }).colors;
const pickEmbroideries = (d: unknown): EmbroideryDTO[] =>
  (d as { embroideries: EmbroideryDTO[] }).embroideries;
const pickCategories = (d: unknown): CategoryDTO[] =>
  (d as { categories: CategoryDTO[] }).categories;

// ── Chargement générique d'une ressource admin ────────────────

function useAdminResource<T>(path: string, pick: (data: unknown) => T[]) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  /** force un rechargement (les items restent affichés en attendant) */
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    api<unknown>(path)
      .then((d) => {
        if (cancelled) return;
        setError(null);
        setItems(pick(d));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur");
      });
    return () => {
      cancelled = true;
    };
  }, [path, pick, tick]);

  return { items, error, reload };
}

// ── Petits composants partagés ────────────────────────────────

function SectionError({
  message,
  retry,
  onRetry,
}: {
  message: string;
  retry: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <TriangleAlert className="size-8 text-gold" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" className="h-11" onClick={onRetry}>
          {retry}
        </Button>
      </CardContent>
    </Card>
  );
}

function FormDialog({
  open,
  onOpenChange,
  title,
  desc,
  submitLabel,
  cancelLabel,
  saving,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  desc?: string;
  submitLabel: string;
  cancelLabel: string;
  saving: boolean;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {desc ? <DialogDescription>{desc}</DialogDescription> : null}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {children}
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              className="h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({
  open,
  title,
  desc,
  cancelLabel,
  confirmLabel,
  deleting,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  desc: string;
  cancelLabel: string;
  confirmLabel: string;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11" disabled={deleting}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11 bg-destructive text-white hover:bg-destructive/90"
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Champ image : URL + bouton upload + vignette */
function ImageField({
  label,
  uploadLabel,
  value,
  onChange,
  onError,
}: {
  label: string;
  uploadLabel: string;
  value: string;
  onChange: (url: string) => void;
  onError: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `img-field-${label.replace(/\s/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex items-center gap-2">
        {value ? (
          <SmartImage
            src={value}
            alt=""
            className="size-11 shrink-0 rounded-lg border"
            sizes="44px"
          />
        ) : null}
        <Input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… ou /uploads/…"
          className="h-11"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          hidden
          aria-hidden="true"
          tabIndex={-1}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              const { url } = await uploadImage(file);
              onChange(url);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : onError);
            } finally {
              setUploading(false);
              if (inputRef.current) inputRef.current.value = "";
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label={uploadLabel}
          title={uploadLabel}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

/** Champ couleur hex : sélecteur + texte */
function HexField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="hex-text">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-lg border bg-transparent p-1"
          aria-label={`${label} (picker)`}
        />
        <Input
          id="hex-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="h-11 font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function rowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={iconBtn}
        onClick={onEdit}
        aria-label={editLabel}
        title={editLabel}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(iconBtn, "text-red-400 hover:text-red-500")}
        onClick={onDelete}
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        <span className="text-base leading-none">×</span>
      </Button>
    </div>
  );
}

// ── Section : Tissus ──────────────────────────────────────────

interface FabricForm {
  name: string;
  nameAr: string;
  image: string;
  priceExtra: string;
}

const EMPTY_FABRIC: FabricForm = { name: "", nameAr: "", image: "", priceExtra: "0" };

function FabricsSection() {
  const { t, lang } = useI18n();
  const { refresh } = usePublicData();
  const o = useCallback(
    (k: string, v?: Record<string, string | number>) => t(`admin.options.${k}`, v),
    [t]
  );
  const { items, error, reload } = useAdminResource<FabricDTO>(
    "/api/admin/fabrics",
    pickFabrics
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FabricDTO | null>(null);
  const [form, setForm] = useState<FabricForm>(EMPTY_FABRIC);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FabricDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const save = useCallback(async () => {
    if (form.name.trim().length < 2 || form.nameAr.trim().length < 2) {
      toast.error(o("errName"));
      return;
    }
    const extra = Math.max(0, Math.round(Number(form.priceExtra) || 0));
    if (!Number.isFinite(extra)) {
      toast.error(o("errNumber"));
      return;
    }
    const body = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      image: form.image.trim(),
      priceExtra: extra,
    };
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/fabrics/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/admin/fabrics", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast.success(o(editing ? "updated" : "created", { name: body.name }));
      setDialogOpen(false);
      reload();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : o("loadError"));
    } finally {
      setSaving(false);
    }
  }, [form, editing, o, reload, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/fabrics/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(o("deleted", { name: loc(deleteTarget, "name", lang) }));
      setDeleteTarget(null);
      reload();
      refresh();
    } catch (err) {
      // 409 si tissu lié à des produits — message serveur affiché
      toast.error(err instanceof Error ? err.message : o("loadError"));
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, o, reload, refresh, lang]);

  if (error) {
    return <SectionError message={error} retry={t("common.actions.retry")} onRetry={reload} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {o("count", { count: items?.length ?? 0 })}
        </p>
        <Button
          className="h-11"
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_FABRIC);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          {o("addFabric")}
        </Button>
      </div>

      {!items ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {o("emptyFabric")}
        </p>
      ) : (
        <Card>
          <CardContent className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{o("colName")}</TableHead>
                  <TableHead className="text-start">{o("colNameAr")}</TableHead>
                  <TableHead className="text-start">{o("colExtra")}</TableHead>
                  <TableHead className="text-end">{o("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...items]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {f.image ? (
                            <SmartImage
                              src={f.image}
                              alt={f.name}
                              className="size-11 shrink-0 rounded-lg"
                              sizes="44px"
                            />
                          ) : (
                            <div className="size-11 shrink-0 rounded-lg bg-muted/60" />
                          )}
                          <span className="font-medium">{f.name}</span>
                        </div>
                      </TableCell>
                      <TableCell dir="rtl" className="text-muted-foreground">
                        {f.nameAr}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold text-gold">
                        +{formatDA(f.priceExtra, lang)}
                      </TableCell>
                      <TableCell>
                        {rowActions({
                          onEdit: () => {
                            setEditing(f);
                            setForm({
                              name: f.name,
                              nameAr: f.nameAr,
                              image: f.image,
                              priceExtra: String(f.priceExtra),
                            });
                            setDialogOpen(true);
                          },
                          onDelete: () => setDeleteTarget(f),
                          editLabel: o("editFabric"),
                          deleteLabel: t("common.actions.delete"),
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? o("editFabric") : o("addFabric")}
        submitLabel={o("save")}
        cancelLabel={t("common.actions.cancel")}
        saving={saving}
        onSubmit={save}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fb-name">{o("fName")}</Label>
            <Input
              id="fb-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-name-ar">{o("fNameAr")}</Label>
            <Input
              id="fb-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              maxLength={60}
            />
          </div>
        </div>
        <ImageField
          label={o("fImage")}
          uploadLabel={o("fImageUpload")}
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          onError={o("loadError")}
        />
        <div className="space-y-2">
          <Label htmlFor="fb-extra">{o("fExtra")}</Label>
          <Input
            id="fb-extra"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={form.priceExtra}
            onChange={(e) =>
              setForm((f) => ({ ...f, priceExtra: e.target.value }))
            }
            className="h-11"
          />
        </div>
      </FormDialog>

      <DeleteConfirm
        open={Boolean(deleteTarget)}
        title={o("deleteTitle", { name: deleteTarget ? deleteTarget.name : "" })}
        desc={o("deleteDesc")}
        cancelLabel={t("common.actions.cancel")}
        confirmLabel={t("common.actions.delete")}
        deleting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Section : Couleurs ────────────────────────────────────────

interface ColorForm {
  name: string;
  nameAr: string;
  hex: string;
}

const EMPTY_COLOR: ColorForm = { name: "", nameAr: "", hex: "#000000" };

function ColorsSection() {
  const { t, lang } = useI18n();
  const { refresh } = usePublicData();
  const o = useCallback(
    (k: string, v?: Record<string, string | number>) => t(`admin.options.${k}`, v),
    [t]
  );
  const { items, error, reload } = useAdminResource<ColorDTO>(
    "/api/admin/colors",
    pickColors
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ColorDTO | null>(null);
  const [form, setForm] = useState<ColorForm>(EMPTY_COLOR);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ColorDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const save = useCallback(async () => {
    if (form.name.trim().length < 2 || form.nameAr.trim().length < 2) {
      toast.error(o("errName"));
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(form.hex.trim())) {
      toast.error(o("errHex"));
      return;
    }
    const body = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      hex: form.hex.trim(),
    };
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/colors/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/admin/colors", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast.success(o(editing ? "updated" : "created", { name: body.name }));
      setDialogOpen(false);
      reload();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : o("loadError"));
    } finally {
      setSaving(false);
    }
  }, [form, editing, o, reload, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/colors/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(o("deleted", { name: loc(deleteTarget, "name", lang) }));
      setDeleteTarget(null);
      reload();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : o("loadError"));
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, o, reload, refresh, lang]);

  if (error) {
    return <SectionError message={error} retry={t("common.actions.retry")} onRetry={reload} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {o("count", { count: items?.length ?? 0 })}
        </p>
        <Button
          className="h-11"
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_COLOR);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          {o("addColor")}
        </Button>
      </div>

      {!items ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {o("emptyColor")}
        </p>
      ) : (
        <Card>
          <CardContent className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{o("colName")}</TableHead>
                  <TableHead className="text-start">{o("colNameAr")}</TableHead>
                  <TableHead className="text-start">{o("colHex")}</TableHead>
                  <TableHead className="text-end">{o("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...items]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2.5">
                          <span
                            className="size-6 shrink-0 rounded-full border shadow-inner"
                            style={{ backgroundColor: c.hex }}
                            aria-hidden="true"
                          />
                          {c.name}
                        </span>
                      </TableCell>
                      <TableCell dir="rtl" className="text-muted-foreground">
                        {c.nameAr}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.hex}
                      </TableCell>
                      <TableCell>
                        {rowActions({
                          onEdit: () => {
                            setEditing(c);
                            setForm({
                              name: c.name,
                              nameAr: c.nameAr,
                              hex: c.hex,
                            });
                            setDialogOpen(true);
                          },
                          onDelete: () => setDeleteTarget(c),
                          editLabel: o("editColor"),
                          deleteLabel: t("common.actions.delete"),
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? o("editColor") : o("addColor")}
        submitLabel={o("save")}
        cancelLabel={t("common.actions.cancel")}
        saving={saving}
        onSubmit={save}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cl-name">{o("fName")}</Label>
            <Input
              id="cl-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={40}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-name-ar">{o("fNameAr")}</Label>
            <Input
              id="cl-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              maxLength={40}
            />
          </div>
        </div>
        <HexField
          label={o("fHex")}
          value={form.hex}
          onChange={(hex) => setForm((f) => ({ ...f, hex }))}
        />
      </FormDialog>

      <DeleteConfirm
        open={Boolean(deleteTarget)}
        title={o("deleteTitle", { name: deleteTarget ? deleteTarget.name : "" })}
        desc={o("deleteDesc")}
        cancelLabel={t("common.actions.cancel")}
        confirmLabel={t("common.actions.delete")}
        deleting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Section : Broderies ───────────────────────────────────────

interface EmbroideryForm {
  name: string;
  nameAr: string;
  priceExtra: string;
}

const EMPTY_EMB: EmbroideryForm = { name: "", nameAr: "", priceExtra: "0" };

function EmbroideriesSection() {
  const { t, lang } = useI18n();
  const { refresh } = usePublicData();
  const o = useCallback(
    (k: string, v?: Record<string, string | number>) => t(`admin.options.${k}`, v),
    [t]
  );
  const { items, error, reload } = useAdminResource<EmbroideryDTO>(
    "/api/admin/embroideries",
    pickEmbroideries
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmbroideryDTO | null>(null);
  const [form, setForm] = useState<EmbroideryForm>(EMPTY_EMB);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmbroideryDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const save = useCallback(async () => {
    if (form.name.trim().length < 2 || form.nameAr.trim().length < 2) {
      toast.error(o("errName"));
      return;
    }
    const extra = Math.max(0, Math.round(Number(form.priceExtra) || 0));
    const body = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      priceExtra: extra,
    };
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/embroideries/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/admin/embroideries", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast.success(o(editing ? "updated" : "created", { name: body.name }));
      setDialogOpen(false);
      reload();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : o("loadError"));
    } finally {
      setSaving(false);
    }
  }, [form, editing, o, reload, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/embroideries/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(o("deleted", { name: loc(deleteTarget, "name", lang) }));
      setDeleteTarget(null);
      reload();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : o("loadError"));
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, o, reload, refresh, lang]);

  if (error) {
    return <SectionError message={error} retry={t("common.actions.retry")} onRetry={reload} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {o("count", { count: items?.length ?? 0 })}
        </p>
        <Button
          className="h-11"
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_EMB);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          {o("addEmbroidery")}
        </Button>
      </div>

      {!items ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {o("emptyEmbroidery")}
        </p>
      ) : (
        <Card>
          <CardContent className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{o("colName")}</TableHead>
                  <TableHead className="text-start">{o("colNameAr")}</TableHead>
                  <TableHead className="text-start">{o("colExtra")}</TableHead>
                  <TableHead className="text-end">{o("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...items]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((x) => (
                    <TableRow key={x.id}>
                      <TableCell className="font-medium">{x.name}</TableCell>
                      <TableCell dir="rtl" className="text-muted-foreground">
                        {x.nameAr}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold text-gold">
                        +{formatDA(x.priceExtra, lang)}
                      </TableCell>
                      <TableCell>
                        {rowActions({
                          onEdit: () => {
                            setEditing(x);
                            setForm({
                              name: x.name,
                              nameAr: x.nameAr,
                              priceExtra: String(x.priceExtra),
                            });
                            setDialogOpen(true);
                          },
                          onDelete: () => setDeleteTarget(x),
                          editLabel: o("editEmbroidery"),
                          deleteLabel: t("common.actions.delete"),
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? o("editEmbroidery") : o("addEmbroidery")}
        submitLabel={o("save")}
        cancelLabel={t("common.actions.cancel")}
        saving={saving}
        onSubmit={save}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="em-name">{o("fName")}</Label>
            <Input
              id="em-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="em-name-ar">{o("fNameAr")}</Label>
            <Input
              id="em-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              maxLength={80}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="em-extra">{o("fExtra")}</Label>
          <Input
            id="em-extra"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={form.priceExtra}
            onChange={(e) =>
              setForm((f) => ({ ...f, priceExtra: e.target.value }))
            }
            className="h-11"
          />
        </div>
      </FormDialog>

      <DeleteConfirm
        open={Boolean(deleteTarget)}
        title={o("deleteTitle", {
          name: deleteTarget ? deleteTarget.name : "",
        })}
        desc={o("deleteDesc")}
        cancelLabel={t("common.actions.cancel")}
        confirmLabel={t("common.actions.delete")}
        deleting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Section : Catégories ──────────────────────────────────────

interface CategoryForm {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  order: string;
}

const EMPTY_CATEGORY: CategoryForm = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  image: "",
  order: "0",
};

function CategoriesSection() {
  const { t, lang } = useI18n();
  const { refresh } = usePublicData();
  const o = useCallback(
    (k: string, v?: Record<string, string | number>) => t(`admin.options.${k}`, v),
    [t]
  );
  const { items, error, reload } = useAdminResource<CategoryDTO>(
    "/api/admin/categories",
    pickCategories
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const save = useCallback(async () => {
    if (form.name.trim().length < 2 || form.nameAr.trim().length < 2) {
      toast.error(o("errName"));
      return;
    }
    const order = Math.max(0, Math.round(Number(form.order) || 0));
    const body = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      description: form.description.trim(),
      descriptionAr: form.descriptionAr.trim(),
      image: form.image.trim(),
      order,
    };
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/categories/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast.success(o(editing ? "updated" : "created", { name: body.name }));
      setDialogOpen(false);
      reload();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : o("loadError"));
    } finally {
      setSaving(false);
    }
  }, [form, editing, o, reload, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(o("deleted", { name: loc(deleteTarget, "name", lang) }));
      setDeleteTarget(null);
      reload();
      refresh();
    } catch (err) {
      // 409 si produits liés
      toast.error(err instanceof Error ? err.message : o("loadError"));
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, o, reload, refresh, lang]);

  if (error) {
    return <SectionError message={error} retry={t("common.actions.retry")} onRetry={reload} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {o("count", { count: items?.length ?? 0 })}
        </p>
        <Button
          className="h-11"
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_CATEGORY);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          {o("addCategory")}
        </Button>
      </div>

      {!items ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {o("emptyCategory")}
        </p>
      ) : (
        <Card>
          <CardContent className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{o("colName")}</TableHead>
                  <TableHead className="text-start">{o("colNameAr")}</TableHead>
                  <TableHead className="text-start">{o("colImage")}</TableHead>
                  <TableHead className="text-start">{o("colOrder")}</TableHead>
                  <TableHead className="text-end">{o("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...items]
                  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                  .map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell dir="rtl" className="text-muted-foreground">
                        {c.nameAr}
                      </TableCell>
                      <TableCell>
                        {c.image ? (
                          <SmartImage
                            src={c.image}
                            alt={c.name}
                            className="h-10 w-14 rounded-lg"
                            sizes="56px"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded-lg bg-muted/60" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.order}
                      </TableCell>
                      <TableCell>
                        {rowActions({
                          onEdit: () => {
                            setEditing(c);
                            setForm({
                              name: c.name,
                              nameAr: c.nameAr,
                              description: c.description,
                              descriptionAr: c.descriptionAr,
                              image: c.image,
                              order: String(c.order),
                            });
                            setDialogOpen(true);
                          },
                          onDelete: () => setDeleteTarget(c),
                          editLabel: o("editCategory"),
                          deleteLabel: t("common.actions.delete"),
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? o("editCategory") : o("addCategory")}
        submitLabel={o("save")}
        cancelLabel={t("common.actions.cancel")}
        saving={saving}
        onSubmit={save}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ct-name">{o("fName")}</Label>
            <Input
              id="ct-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-name-ar">{o("fNameAr")}</Label>
            <Input
              id="ct-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              maxLength={60}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ct-desc">{o("fDesc")}</Label>
            <Textarea
              id="ct-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-desc-ar">{o("fDescAr")}</Label>
            <Textarea
              id="ct-desc-ar"
              dir="rtl"
              value={form.descriptionAr}
              onChange={(e) =>
                setForm((f) => ({ ...f, descriptionAr: e.target.value }))
              }
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <ImageField
          label={o("fImage")}
          uploadLabel={o("fImageUpload")}
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          onError={o("loadError")}
        />
        <div className="space-y-2">
          <Label htmlFor="ct-order">{o("fOrder")}</Label>
          <Input
            id="ct-order"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            className="h-11 w-32"
          />
        </div>
      </FormDialog>

      <DeleteConfirm
        open={Boolean(deleteTarget)}
        title={o("deleteTitle", {
          name: deleteTarget ? deleteTarget.name : "",
        })}
        desc={o("deleteDesc")}
        cancelLabel={t("common.actions.cancel")}
        confirmLabel={t("common.actions.delete")}
        deleting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Vue ───────────────────────────────────────────────────────

export function OptionsView() {
  const { t } = useI18n();
  const o = useCallback(
    (k: string) => t(`admin.options.${k}`),
    [t]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <Shapes className="size-5 text-gold" />
          {o("title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{o("subtitle")}</p>
      </div>

      <Tabs defaultValue="fabrics">
        <TabsList className="h-11 w-full justify-start overflow-x-auto rounded-xl p-1 sm:w-fit">
          <TabsTrigger value="fabrics" className="h-9 px-4 text-sm">
            {o("tabFabrics")}
          </TabsTrigger>
          <TabsTrigger value="colors" className="h-9 px-4 text-sm">
            {o("tabColors")}
          </TabsTrigger>
          <TabsTrigger value="embroideries" className="h-9 px-4 text-sm">
            {o("tabEmbroideries")}
          </TabsTrigger>
          <TabsTrigger value="categories" className="h-9 px-4 text-sm">
            {o("tabCategories")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fabrics" className="mt-3">
          <FabricsSection />
        </TabsContent>
        <TabsContent value="colors" className="mt-3">
          <ColorsSection />
        </TabsContent>
        <TabsContent value="embroideries" className="mt-3">
          <EmbroideriesSection />
        </TabsContent>
        <TabsContent value="categories" className="mt-3">
          <CategoriesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
