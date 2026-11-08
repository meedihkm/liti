"use client";

// ─────────────────────────────────────────────────────────────
// OrderDetailView — fiche complète d'une commande.
// GET /api/admin/orders/:id · PATCH (statut, note interne, refus)
// · PUT (édition avant validation). Actions : valider, refuser,
// changer de statut, note interne, modifier, WhatsApp, impression
// (fiche atelier « print-only », noir sur blanc).
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Copy,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
  RefreshCw,
  SearchX,
  Store,
  Truck,
  User,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { formatDA } from "@/lib/pricing";
import {
  LENGTHS,
  MEASUREMENT_FIELDS,
  ORDER_STATUSES,
  STATUS_LABELS,
  STATUS_TONE,
  wilayaByCode,
} from "@/lib/constants";
import { SmartImage } from "@/components/layout/smart-image";
import { YazMark } from "@/components/layout/berber-divider";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { AdminUserDTO, OrderDTO, OrderItemDTO } from "@/lib/types";

// ── Helpers purs ──────────────────────────────────────────────

interface EmbroideryLine {
  name: string
  nameAr: string
  priceExtra: number
}

function parseEmbroidery(json: string): EmbroideryLine[] {
  try {
    const v: unknown = JSON.parse(json)
    if (!Array.isArray(v)) return []
    return v.filter(
      (x): x is EmbroideryLine =>
        Boolean(x) && typeof x === "object" && typeof (x as EmbroideryLine).name === "string"
    )
  } catch {
    return []
  }
}

function parseMeasurements(json: string): Record<string, number> {
  try {
    const v: unknown = JSON.parse(json)
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const out: Record<string, number> = {}
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (typeof val === "number" && Number.isFinite(val)) out[k] = val
      }
      return out
    }
  } catch {}
  return {}
}

function formatDateTime(iso: string, lang: "fr" | "ar"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function lengthLabel(value: string, lang: "fr" | "ar"): string {
  const l = LENGTHS.find((x) => x.value === value)
  return l ? (lang === "ar" ? l.ar : l.fr) : value
}

/** 0550112233 → 213550112233 (format wa.me) */
function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("213")) return digits
  if (digits.startsWith("0")) return `213${digits.slice(1)}`
  return `213${digits}`
}

/** Statuts proposés par le sélecteur « changer le statut » */
const NEXT_STATUSES = ["crafting", "ready", "shipped", "delivered", "cancelled"] as const

interface EditFormState {
  fullName: string
  phone: string
  email: string
  commune: string
  address: string
  deliveryMode: "home" | "pickup"
  shippingFee: string
  quantities: Record<string, string>
}

export function OrderDetailView({ id, user }: { id: string; user: AdminUserDTO }) {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status: number } | null>(null);

  // Actions asynchrones : clé de l'action en cours
  const [busy, setBusy] = useState("");

  // Refus
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");

  // Changement de statut (Select + AlertDialog)
  const [statusTarget, setStatusTarget] = useState<string | null>(null);

  // Note interne
  const [noteValue, setNoteValue] = useState("");

  // Édition (pending uniquement)
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  const apiUrl = `/api/admin/orders/${encodeURIComponent(id)}`;

  // ── Chargement (setState uniquement dans les callbacks async) ─
  const runFetch = useCallback(() => {
    api<OrderDTO>(apiUrl)
      .then((o) => {
        setOrder(o);
        setError(null);
      })
      .catch((e) => {
        setOrder(null);
        setError({
          message: e instanceof ApiError ? e.message : "",
          status: e instanceof ApiError ? e.status : 0,
        });
      })
      .finally(() => setLoading(false));
  }, [apiUrl]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  /** Rafraîchissement manuel (bouton réessayer) */
  const load = () => {
    setLoading(true);
    runFetch();
  };

  // Note interne synchronisée à la commande chargée
  useEffect(() => {
    setNoteValue(order?.internalNote ?? "");
  }, [order?.id]);

  const errToast = (e: unknown) =>
    toast.error(e instanceof ApiError ? e.message : t("admin.orders.errorGeneric"));

  /** PATCH : statut / refus / note interne → OrderDTO mis à jour */
  const patch = async (body: Record<string, unknown>, successKey: string, busyKey: string) => {
    setBusy(busyKey);
    try {
      const updated = await api<OrderDTO>(apiUrl, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setOrder(updated);
      toast.success(t(successKey));
      return true;
    } catch (e) {
      errToast(e);
      return false;
    } finally {
      setBusy("");
    }
  };

  /** PUT : édition complète avant validation */
  const putEdit = async (body: Record<string, unknown>) => {
    setBusy("edit");
    try {
      const updated = await api<OrderDTO>(apiUrl, { method: "PUT", body: JSON.stringify(body) });
      setOrder(updated);
      toast.success(t("admin.orders.orderUpdated"));
      return true;
    } catch (e) {
      errToast(e);
      return false;
    } finally {
      setBusy("");
    }
  };

  const copyNumber = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.number);
      toast.success(t("common.actions.copied"));
    } catch {
      toast.error(t("admin.orders.errorGeneric"));
    }
  };

  const wilayaLabel = (o: OrderDTO): string => {
    const w = wilayaByCode(o.wilayaCode);
    return w ? (lang === "ar" ? w.nameAr : w.name) : o.wilayaName;
  };

  // ── Skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label={t("common.actions.loading")}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Erreurs ─────────────────────────────────────────────────
  if (error) {
    const notFound = error.status === 404;
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <SearchX className="h-9 w-9 text-muted-foreground/60" aria-hidden="true" />
          <div>
            <p className="font-medium">
              {notFound ? t("admin.orders.notFoundTitle") : error.message || t("admin.orders.loadError")}
            </p>
            {notFound && (
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.orders.notFoundHint")}</p>
            )}
          </div>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="outline" onClick={load} className="h-11">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t("admin.orders.retry")}
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate("/admin/orders")} className="h-11">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t("admin.orders.back")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) return null;

  const isPending = order.status === "pending";
  const embsByItem = order.items.map((it) => parseEmbroidery(it.embroideryJson));

  const waMessage = t("admin.orders.whatsappMessage", {
    name: order.fullName,
    number: order.number,
  });
  const waHref = `https://wa.me/${waNumber(order.phone)}?text=${encodeURIComponent(waMessage)}`;

  const statusBadge = (status: string) => (
    <Badge className={STATUS_TONE[status]}>{STATUS_LABELS[status]?.[lang] ?? status}</Badge>
  );

  // ── Détail d'un article (toutes les options) ────────────────
  const renderItem = (item: OrderItemDTO, index: number) => {
    const embs = embsByItem[index];
    const measures = parseMeasurements(item.measurementsJson);
    const isCustom = item.size === "sur-mesure";
    return (
      <div key={item.id} className={index > 0 ? "border-t pt-5" : undefined}>
        <div className="flex gap-4">
          <SmartImage
            src={item.productImage || "/images/products/p1.jpg"}
            alt={item.productName}
            className="h-24 w-20 shrink-0 rounded-lg sm:h-28 sm:w-24"
            sizes="96px"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-medium leading-snug">{item.productName}</h3>
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                ×{item.quantity}
              </span>
            </div>

            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">{t("admin.orders.fabric")} :</dt>
                <dd className="font-medium">{item.fabricName}</dd>
              </div>
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="text-muted-foreground">{t("admin.orders.color")} :</dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                    style={{ backgroundColor: item.colorHex || "#888" }}
                    aria-hidden="true"
                  />
                  {item.colorName}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">{t("admin.orders.size")} :</dt>
                <dd className="font-medium">
                  {isCustom ? t("admin.orders.customSize") : item.size}
                  {item.length
                    ? ` — ${t("admin.orders.length")} : ${lengthLabel(item.length, lang)}`
                    : ""}
                </dd>
              </div>
            </dl>

            {/* Broderies */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-muted-foreground">{t("admin.orders.embroidery")} :</span>
              {embs.length === 0 ? (
                <span className="text-sm">{t("admin.orders.noEmbroidery")}</span>
              ) : (
                embs.map((e) => (
                  <span
                    key={e.name}
                    className="inline-flex items-center rounded-full border border-gold/30 bg-gold/8 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {lang === "ar" ? e.nameAr : e.name}
                    {e.priceExtra > 0 && (
                      <span className="ms-1 text-gold/80">+{formatDA(e.priceExtra, lang)}</span>
                    )}
                  </span>
                ))
              )}
            </div>

            {/* Mesures (sur-mesure) */}
            {isCustom && (
              <div className="mt-3 max-w-xs overflow-hidden rounded-lg border">
                <table className="w-full text-xs">
                  <tbody>
                    {MEASUREMENT_FIELDS.map((f) => (
                      <tr key={f.key} className="border-b last:border-0">
                        <td className="bg-muted/40 px-3 py-1.5 text-muted-foreground">
                          {lang === "ar" ? f.ar : f.fr}
                        </td>
                        <td className="px-3 py-1.5 text-end font-semibold tabular-nums">
                          {f.key in measures ? `${measures[f.key]} ${t("admin.orders.measurementUnit")}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {item.note && (
              <p className="mt-2.5 rounded-lg bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
                {t("admin.orders.noteLabel")} : « {item.note} »
              </p>
            )}

            <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                {t("admin.orders.unitPrice")} :{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatDA(item.unitPrice, lang)}
                </span>
              </span>
              <span className="font-semibold tabular-nums">
                {t("admin.orders.lineTotal")} : {formatDA(item.lineTotal, lang)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Fiche atelier (impression) ──────────────────────────────
  const qualityChecks = ["cut", "sewing", "embroideryCheck", "finishing", "ironing", "finalCheck"];

  const printSheet = (
    <div className="print-only" aria-hidden="true">
      {/* Masque le shell admin (header/nav) pendant l'impression de cette vue */}
      <style>{`@media print { header, nav { display: none !important; } main { padding-bottom: 0 !important; } }`}</style>
      <div className="mx-auto max-w-2xl text-neutral-900">
        <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-3">
          <div>
            <p className="text-lg font-bold uppercase tracking-wide">Taqendurt</p>
            <p className="mt-1 text-sm font-semibold">{t("admin.orders.sheet.title")}</p>
            <p className="mt-1 text-sm">
              {t("admin.orders.sheet.order")} : <span className="font-bold">{order.number}</span>
              {" — "}
              {t("admin.orders.sheet.date")} : {formatDateTime(order.createdAt, lang)}
            </p>
          </div>
          <YazMark className="h-12 w-12 text-neutral-900" />
        </div>

        {/* Client */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-b border-neutral-400 py-3 text-sm">
          <p>
            <span className="font-semibold">{t("admin.orders.sheet.client")} :</span> {order.fullName}
          </p>
          <p>
            <span className="font-semibold">{t("admin.orders.sheet.phone")} :</span> {order.phone}
          </p>
          <p>
            <span className="font-semibold">{wilayaLabel(order)}</span>
            {order.commune ? ` — ${order.commune}` : ""}
          </p>
          <p>
            <span className="font-semibold">{t("admin.orders.sheet.delivery")} :</span>{" "}
            {order.deliveryMode === "pickup"
              ? t("admin.orders.deliveryPickup")
              : t("admin.orders.deliveryHome")}
          </p>
          {order.address && (
            <p className="col-span-2">
              <span className="font-semibold">{t("admin.orders.sheet.address")} :</span>{" "}
              {order.address}
            </p>
          )}
        </div>

        {/* Articles */}
        <div className="border-b border-neutral-400 py-3">
          <p className="mb-2 text-sm font-bold uppercase">{t("admin.orders.sheet.items")}</p>
          {order.items.map((item, index) => {
            const embs = embsByItem[index];
            const measures = parseMeasurements(item.measurementsJson);
            const isCustom = item.size === "sur-mesure";
            return (
              <div key={item.id} className="mb-3 border border-neutral-400 p-3 text-sm last:mb-0">
                <p className="font-semibold">
                  {index + 1}. {item.productName} — ×{item.quantity}
                </p>
                <p>
                  {t("admin.orders.fabric")} : {item.fabricName} · {t("admin.orders.color")} :{" "}
                  {item.colorName}
                </p>
                <p>
                  {t("admin.orders.size")} :{" "}
                  {isCustom ? t("admin.orders.customSize") : item.size}
                  {item.length ? ` · ${t("admin.orders.length")} : ${lengthLabel(item.length, lang)}` : ""}
                </p>
                <p>
                  {t("admin.orders.sheet.embroidery")} :{" "}
                  {embs.length === 0
                    ? t("admin.orders.sheet.none")
                    : embs.map((e) => (lang === "ar" ? e.nameAr : e.name)).join(", ")}
                </p>
                {isCustom && (
                  <div className="mt-1.5 grid grid-cols-3 gap-x-4 gap-y-0.5 border border-dashed border-neutral-400 p-2">
                    {MEASUREMENT_FIELDS.map((f) => (
                      <p key={f.key}>
                        {lang === "ar" ? f.ar : f.fr} :{" "}
                        <span className="font-semibold tabular-nums">
                          {f.key in measures ? measures[f.key] : "—"}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
                {item.note && (
                  <p className="mt-1.5 italic">
                    {t("admin.orders.sheet.note")} : {item.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Totaux */}
        <div className="border-b border-neutral-400 py-3 text-sm">
          <div className="flex justify-between">
            <span>{t("admin.orders.sheet.subtotal")}</span>
            <span className="tabular-nums">{formatDA(order.subtotal, lang)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("admin.orders.sheet.shipping")}</span>
            <span className="tabular-nums">
              {order.shippingFee === 0 ? t("admin.orders.free") : formatDA(order.shippingFee, lang)}
            </span>
          </div>
          <div className="mt-1 flex justify-between border-t border-neutral-900 pt-1 text-base font-bold">
            <span>{t("admin.orders.sheet.total")}</span>
            <span className="tabular-nums">{formatDA(order.total, lang)}</span>
          </div>
        </div>

        {/* Contrôle qualité */}
        <div className="py-3">
          <p className="mb-2 text-sm font-bold uppercase">{t("admin.orders.sheet.quality")}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {qualityChecks.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 shrink-0 border-2 border-neutral-900"
                  aria-hidden="true"
                />
                {t(`admin.orders.sheet.${c}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-2 gap-10 text-xs">
          <div className="border-t border-neutral-900 pt-1">
            {t("admin.orders.sheet.seamstress")}
          </div>
          <div className="border-t border-neutral-900 pt-1">{t("admin.orders.sheet.manager")}</div>
        </div>
      </div>
    </div>
  );

  // ── Édition : ouverture & soumission ────────────────────────
  const openEdit = () => {
    setEditForm({
      fullName: order.fullName,
      phone: order.phone,
      email: order.email,
      commune: order.commune,
      address: order.address,
      deliveryMode: order.deliveryMode,
      shippingFee: String(order.shippingFee),
      quantities: Object.fromEntries(order.items.map((it) => [it.id, String(it.quantity)])),
    });
    setEditOpen(true);
  };

  const submitEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm || busy) return;
    const fullName = editForm.fullName.trim();
    const phone = editForm.phone.replace(/[\s.\-()]/g, "");
    if (fullName.length < 3 || !/^(?:\+213|0)(5|6|7)\d{8}$/.test(phone)) {
      toast.error(t("admin.orders.editInvalid"));
      return;
    }
    const items: { id: string; quantity: number }[] = [];
    for (const it of order.items) {
      const n = Number(editForm.quantities[it.id]);
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        toast.error(t("admin.orders.editInvalid"));
        return;
      }
      items.push({ id: it.id, quantity: n });
    }
    const fee =
      editForm.deliveryMode === "pickup"
        ? 0
        : Math.max(0, Math.floor(Number(editForm.shippingFee) || 0));
    const commune = editForm.commune.trim();
    const address = editForm.address.trim();
    const email = editForm.email.trim();
    const ok = await putEdit({
      fullName,
      phone,
      email,
      ...(commune ? { commune } : {}),
      ...(address ? { address } : {}),
      deliveryMode: editForm.deliveryMode,
      shippingFee: fee,
      items,
    });
    if (ok) setEditOpen(false);
  };

  const editEstimate = (() => {
    if (!editForm) return 0;
    const subtotal = order.items.reduce(
      (s, it) => s + it.unitPrice * (Number(editForm.quantities[it.id]) || 0),
      0
    );
    const fee =
      editForm.deliveryMode === "pickup"
        ? 0
        : Math.max(0, Math.floor(Number(editForm.shippingFee) || 0));
    return subtotal + fee;
  })();

  // ── Rendu principal ─────────────────────────────────────────
  return (
    <div className="space-y-5">
      <style>{`@media print { header, nav { display: none !important; } main { padding-bottom: 0 !important; } }`}</style>

      {/* En-tête */}
      <div className="no-print flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={() => navigate("/admin/orders")}
          aria-label={t("admin.orders.back")}
          title={t("admin.orders.back")}
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
        <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">
          {order.number}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={copyNumber}
          aria-label={t("admin.orders.copyNumber")}
          title={t("admin.orders.copyNumber")}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </Button>
        {statusBadge(order.status)}
        <span className="text-sm text-muted-foreground">{formatDateTime(order.createdAt, lang)}</span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* ── Colonne principale ── */}
        <div className="no-print space-y-5 lg:col-span-2">
          {/* Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("admin.orders.itemsCard")}</CardTitle>
              <CardDescription>
                {t("admin.orders.itemsCount", { count: order.items.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">{order.items.map(renderItem)}</CardContent>
          </Card>

          {/* Totaux */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("admin.orders.totalsCard")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("admin.orders.subtotal")}</span>
                <span className="font-medium tabular-nums">{formatDA(order.subtotal, lang)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("admin.orders.shipping")}</span>
                <span className="font-medium tabular-nums">
                  {order.shippingFee === 0
                    ? t("admin.orders.free")
                    : formatDA(order.shippingFee, lang)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t("admin.orders.total")}</span>
                <span className="font-display text-xl font-semibold tabular-nums text-gold">
                  {formatDA(order.total, lang)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("admin.orders.historyCard")}</CardTitle>
            </CardHeader>
            <CardContent>
              {order.history.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("admin.orders.historyEmpty")}
                </p>
              ) : (
                <ol className="relative">
                  <span
                    className="absolute bottom-2 start-[7px] top-2 w-px bg-border"
                    aria-hidden="true"
                  />
                  {order.history.map((h) => (
                    <li key={h.id} className="relative ps-6 pb-6 last:pb-0">
                      <span
                        className="absolute start-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-gold bg-background"
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(h.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(h.createdAt, lang)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{h.actor}</p>
                      {h.note && <p className="mt-1 text-sm">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Colonne latérale ── */}
        <div className="no-print space-y-5">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("admin.orders.clientCard")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="font-medium">{order.fullName}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <a
                  href={`tel:${order.phone}`}
                  dir="ltr"
                  className="font-medium tabular-nums transition-colors hover:text-gold"
                >
                  {order.phone}
                </a>
              </div>
              {order.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <a
                    href={`mailto:${order.email}`}
                    dir="ltr"
                    className="truncate text-sm transition-colors hover:text-gold"
                  >
                    {order.email}
                  </a>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-medium">
                    {wilayaLabel(order)}
                    {order.commune ? ` — ${order.commune}` : ""}
                  </p>
                  {order.address ? (
                    <p className="mt-0.5 text-muted-foreground">{order.address}</p>
                  ) : (
                    <p className="mt-0.5 text-xs italic text-muted-foreground">
                      {t("admin.orders.noAddress")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                {order.deliveryMode === "pickup" ? (
                  <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <div className="text-sm">
                  <p className="font-medium">
                    {order.deliveryMode === "pickup"
                      ? t("admin.orders.deliveryPickup")
                      : t("admin.orders.deliveryHome")}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {t("admin.orders.shippingLabel")} :{" "}
                    {order.shippingFee === 0
                      ? t("admin.orders.free")
                      : formatDA(order.shippingFee, lang)}
                  </p>
                </div>
              </div>
              {order.note && (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
                  {t("admin.orders.clientNoteLabel")} : « {order.note} »
                </p>
              )}
            </CardContent>
          </Card>

          {/* Motif du refus */}
          {order.status === "refused" && order.refusalReason && (
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="text-base text-red-500 dark:text-red-400">
                  {t("admin.orders.refusalCard")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.refusalReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("admin.orders.actionsCard")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Valider / Refuser (pending) */}
              {isPending && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-11 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                        disabled={busy !== ""}
                      >
                        {busy === "validate" ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <CircleCheck className="h-4 w-4" aria-hidden="true" />
                        )}
                        {t("admin.orders.validate")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("admin.orders.validateTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("admin.orders.validateDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-11">{t("common.actions.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          className="h-11 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => patch({ status: "validated" }, "admin.orders.statusUpdated", "validate")}
                        >
                          {t("common.actions.confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    variant="outline"
                    className="h-11 font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                    onClick={() => {
                      setRefuseReason("");
                      setRefuseOpen(true);
                    }}
                    disabled={busy !== ""}
                  >
                    <CircleX className="h-4 w-4" aria-hidden="true" />
                    {t("admin.orders.refuse")}
                  </Button>
                </div>
              )}

              {/* Changer le statut */}
              <div className="space-y-1.5">
                <Label htmlFor="order-status-select">{t("admin.orders.changeStatus")}</Label>
                <Select
                  value={statusTarget ?? ""}
                  onValueChange={(v) => setStatusTarget(v)}
                  disabled={busy !== ""}
                >
                  <SelectTrigger
                    id="order-status-select"
                    className="h-11 w-full"
                    aria-label={t("admin.orders.changeStatus")}
                  >
                    <SelectValue placeholder={t("admin.orders.changeStatusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {NEXT_STATUSES.filter((s) => s !== order.status).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s][lang]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Note interne */}
              <div className="space-y-1.5">
                <Label htmlFor="order-internal-note">{t("admin.orders.internalNote")}</Label>
                <Textarea
                  id="order-internal-note"
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  placeholder={t("admin.orders.internalNotePlaceholder")}
                  rows={3}
                  className="text-sm"
                />
                <Button
                  variant="secondary"
                  className="h-10 w-full"
                  disabled={busy !== "" || noteValue === order.internalNote}
                  onClick={() => patch({ internalNote: noteValue }, "admin.orders.noteSaved", "note")}
                >
                  {busy === "note" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t("admin.orders.saveNote")}
                </Button>
              </div>

              <Separator />

              {/* Modifier / WhatsApp / Imprimer */}
              <div className="grid gap-2">
                {isPending && (
                  <Button
                    variant="outline"
                    className="h-11"
                    onClick={openEdit}
                    disabled={busy !== ""}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    {t("admin.orders.edit")}
                  </Button>
                )}
                <Button variant="outline" className="h-11" asChild>
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    {t("admin.orders.whatsapp")}
                  </a>
                </Button>
                <Button variant="outline" className="h-11" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  {t("admin.orders.print")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Fiche atelier (visible uniquement à l'impression) ── */}
      {printSheet}

      {/* ── Dialog : refuser (motif obligatoire) ── */}
      <Dialog open={refuseOpen} onOpenChange={setRefuseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.orders.refuseTitle")}</DialogTitle>
            <DialogDescription>{t("admin.orders.refuseDesc")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const reason = refuseReason.trim();
              if (!reason) return;
              const ok = await patch(
                { status: "refused", refusalReason: reason },
                "admin.orders.statusUpdated",
                "refuse"
              );
              if (ok) setRefuseOpen(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="refuse-reason">
                {t("admin.orders.refuseReasonLabel")} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="refuse-reason"
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder={t("admin.orders.refuseReasonPlaceholder")}
                rows={3}
                maxLength={500}
                aria-required="true"
                aria-invalid={refuseReason.trim() === "" || undefined}
              />
              {refuseReason.trim() === "" && (
                <p className="text-xs text-muted-foreground">{t("admin.orders.refuseReasonMissing")}</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setRefuseOpen(false)}
                disabled={busy === "refuse"}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="h-11"
                disabled={refuseReason.trim() === "" || busy !== ""}
              >
                {busy === "refuse" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t("admin.orders.refuseConfirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog : confirmation de changement de statut ── */}
      <AlertDialog
        open={Boolean(statusTarget)}
        onOpenChange={(v) => {
          if (!v) setStatusTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.orders.statusConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.orders.statusConfirmDesc", {
                number: order.number,
                status: statusTarget ? STATUS_LABELS[statusTarget]?.[lang] ?? statusTarget : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">{t("common.actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="h-11"
              onClick={() => {
                if (statusTarget) {
                  patch({ status: statusTarget }, "admin.orders.statusUpdated", "status");
                  setStatusTarget(null);
                }
              }}
            >
              {t("common.actions.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog : modification (pending uniquement) ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.orders.editTitle")}</DialogTitle>
            <DialogDescription>{t("admin.orders.editDesc")}</DialogDescription>
          </DialogHeader>
          {editForm && (
            <form onSubmit={submitEdit} className="space-y-5">
              {/* Client */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">{t("admin.orders.editClientSection")}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-fullname">{t("common.misc.name")}</Label>
                    <Input
                      id="edit-fullname"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="h-11"
                      maxLength={80}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone">{t("common.misc.phone")}</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      dir="ltr"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="h-11 text-start"
                      placeholder="0550 12 34 56"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email">{t("common.misc.email")}</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      dir="ltr"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="h-11 text-start"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-commune">{t("admin.orders.colWilaya")} — commune</Label>
                    <Input
                      id="edit-commune"
                      value={editForm.commune}
                      onChange={(e) => setEditForm({ ...editForm, commune: e.target.value })}
                      className="h-11"
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="edit-address">{t("common.misc.address")}</Label>
                    <Input
                      id="edit-address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="h-11"
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-mode">{t("admin.orders.modeLabel")}</Label>
                    <Select
                      value={editForm.deliveryMode}
                      onValueChange={(v) =>
                        setEditForm({
                          ...editForm,
                          deliveryMode: v as "home" | "pickup",
                          ...(v === "pickup" ? { shippingFee: "0" } : {}),
                        })
                      }
                    >
                      <SelectTrigger id="edit-mode" className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">{t("admin.orders.deliveryHome")}</SelectItem>
                        <SelectItem value="pickup">{t("admin.orders.deliveryPickup")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-shipping">{t("admin.orders.editShippingFeeLabel")}</Label>
                    <Input
                      id="edit-shipping"
                      type="number"
                      min={0}
                      step={50}
                      inputMode="numeric"
                      value={editForm.shippingFee}
                      onChange={(e) => setEditForm({ ...editForm, shippingFee: e.target.value })}
                      className="h-11"
                      disabled={editForm.deliveryMode === "pickup"}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("admin.orders.editShippingFeeHint")}
                    </p>
                  </div>
                </div>
              </fieldset>

              {/* Articles */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">
                  {t("admin.orders.editItemsSection")}
                </legend>
                <div className="space-y-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 rounded-lg border p-2.5"
                    >
                      <SmartImage
                        src={it.productImage || "/images/products/p1.jpg"}
                        alt={it.productName}
                        className="h-14 w-11 shrink-0 rounded-md"
                        sizes="44px"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{it.productName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {it.fabricName} · {it.colorName} ·{" "}
                          {it.size === "sur-mesure"
                            ? t("admin.orders.customSize")
                            : it.size}{" "}
                          · {formatDA(it.unitPrice, lang)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Label htmlFor={`edit-qty-${it.id}`} className="sr-only">
                          {t("admin.orders.editQuantity")}
                        </Label>
                        <Input
                          id={`edit-qty-${it.id}`}
                          type="number"
                          min={1}
                          max={10}
                          inputMode="numeric"
                          value={editForm.quantities[it.id] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              quantities: {
                                ...editForm.quantities,
                                [it.id]: e.target.value,
                              },
                            })
                          }
                          className="h-11 w-16 text-center tabular-nums"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("admin.orders.newTotal")} :{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatDA(editEstimate, lang)}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => setEditOpen(false)}
                    disabled={busy === "edit"}
                  >
                    {t("common.actions.cancel")}
                  </Button>
                  <Button type="submit" className="h-11" disabled={busy !== ""}>
                    {busy === "edit" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {t("admin.orders.saveChanges")}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Opérateur connecté (audit) */}
      <p className="sr-only">{user.name}</p>
    </div>
  );
}
