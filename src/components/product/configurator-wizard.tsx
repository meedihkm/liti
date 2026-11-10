"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check, Sparkles, Ruler, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { computeUnitPrice, formatDA } from "@/lib/pricing";
import { useCart } from "@/components/cart/cart-store";
import { SmartImage } from "@/components/layout/smart-image";
import { STANDARD_SIZES, MEASUREMENT_FIELDS } from "@/lib/constants";
import type { ProductDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// CONFIGURATEUR WIZARD — Assistant plein écran par étapes
// Design futuriste, fluide, très tactile (zones >= 48px)
// Barre de progression en anneau, transitions latérales (RTL aware)
// Barre de prix collante en bas avec compteur animé
// ─────────────────────────────────────────────────────────────

type WizardStep = "fabric" | "color" | "size" | "embroidery" | "details" | "summary";

const STEPS: WizardStep[] = ["fabric", "color", "size", "embroidery", "details", "summary"];

interface ConfiguratorWizardProps {
  product: ProductDTO;
  onClose: () => void;
  onColorHexChange?: (hex: string | undefined) => void;
}

export function ConfiguratorWizard({ product, onClose, onColorHexChange }: ConfiguratorWizardProps) {
  const { t, lang, L, dir } = useI18n();
  const addItem = useCart((s) => s.add);

  // État
  const [currentStep, setCurrentStep] = useState<WizardStep>("fabric");
  const [fabricId, setFabricId] = useState(product.fabrics[0]?.id ?? "");
  const [colorId, setColorId] = useState("");
  const [size, setSize] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [embroideryIds, setEmbroideryIds] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Disponibilités
  const fabricConfig = product.fabrics.find((f) => f.id === fabricId);
  const availableColors = useMemo(() => {
    const ids = fabricConfig?.colorIds ?? [];
    return product.colors.filter((c) => ids.length === 0 || ids.includes(c.id));
  }, [product.colors, fabricConfig]);

  const effectiveColor = availableColors.find((c) => c.id === colorId) ?? availableColors[0];
  const effectiveColorId = effectiveColor?.id ?? "";

  // Prix
  const isCustom = size === "sur-mesure";
  const selectedEmbroideries = product.embroideries.filter((e) => embroideryIds.includes(e.id));
  const fabricExtra = fabricConfig?.productExtra ?? 0;
  const unitPrice = computeUnitPrice({
    basePrice: product.basePrice,
    fabricExtra,
    embroideryExtras: selectedEmbroideries.map((e) => e.priceExtra),
    isCustomSize: isCustom,
    customSizeFee: product.customSizeFee,
  });
  const total = unitPrice * quantity;

  // Progression
  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case "fabric":
        return !!fabricId;
      case "color":
        return !!effectiveColorId;
      case "size":
        if (!size) return false;
        if (isCustom) {
          return MEASUREMENT_FIELDS.every((f) => {
            const v = measurements[f.key];
            return v !== undefined && v >= f.min && v <= f.max;
          });
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!canGoNext()) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleAddToCart = () => {
    if (!canGoNext()) return;

    addItem({
      productId: product.id,
      fabricId,
      colorId: effectiveColorId,
      embroideryIds,
      size,
      measurements: isCustom ? measurements : undefined,
      length: "",
      eventDate,
      note,
      quantity,
    });

    toast.success(t("product.added"));
    onClose();
  };

  // Changement de couleur
  if (effectiveColor && onColorHexChange) {
    onColorHexChange(effectiveColor.hex);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background"
    >
      {/* Header avec progression en anneau */}
      <header className="glass-strong relative flex items-center justify-between border-b px-4 py-4">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
          aria-label={t("common.actions.close")}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Barre de progression en anneau */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-12 w-12">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted"
                opacity="0.2"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-gold"
                strokeDasharray={`${2 * Math.PI * 20}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - progress / 100) }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xs font-semibold text-gold">{stepIndex + 1}/{STEPS.length}</span>
            </div>
          </div>
        </div>

        <div className="w-10" />
      </header>

      {/* Contenu des étapes */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          {currentStep === "fabric" && (
            <StepFabric
              key="fabric"
              product={product}
              fabricId={fabricId}
              setFabricId={setFabricId}
              dir={dir}
            />
          )}
          {currentStep === "color" && (
            <StepColor
              key="color"
              availableColors={availableColors}
              colorId={effectiveColorId}
              setColorId={setColorId}
              dir={dir}
            />
          )}
          {currentStep === "size" && (
            <StepSize
              key="size"
              product={product}
              size={size}
              setSize={setSize}
              measurements={measurements}
              setMeasurements={setMeasurements}
              dir={dir}
            />
          )}
          {currentStep === "embroidery" && (
            <StepEmbroidery
              key="embroidery"
              product={product}
              embroideryIds={embroideryIds}
              setEmbroideryIds={setEmbroideryIds}
              dir={dir}
            />
          )}
          {currentStep === "details" && (
            <StepDetails
              key="details"
              eventDate={eventDate}
              setEventDate={setEventDate}
              note={note}
              setNote={setNote}
              quantity={quantity}
              setQuantity={setQuantity}
              dir={dir}
            />
          )}
          {currentStep === "summary" && (
            <StepSummary
              key="summary"
              product={product}
              fabricId={fabricId}
              colorId={effectiveColorId}
              size={size}
              measurements={measurements}
              embroideryIds={embroideryIds}
              eventDate={eventDate}
              note={note}
              quantity={quantity}
              unitPrice={unitPrice}
              total={total}
              dir={dir}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Barre de prix collante + navigation */}
      <motion.footer
        className="glass-strong border-t"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          {/* Prix animé */}
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {quantity > 1 ? `${quantity} × ${formatDA(unitPrice, lang)}` : t("product.price")}
            </span>
            <motion.div
              key={total}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-2xl font-bold text-gold"
            >
              {formatDA(total, lang)}
            </motion.div>
          </div>

          {/* Boutons navigation */}
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={prevStep}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-transform hover:-translate-y-0.5 active:scale-95"
                aria-label={t("common.actions.previous")}
              >
                {dir === "rtl" ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            )}

            {currentStep !== "summary" ? (
              <button
                onClick={nextStep}
                disabled={!canGoNext()}
                className="flex h-12 min-w-[120px] items-center justify-center gap-2 rounded-full bg-gold px-6 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                {t("common.actions.next")}
                {dir === "rtl" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-full bg-gold px-6 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                <Check className="h-5 w-5" />
                {t("product.add")}
              </button>
            )}
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// ÉTAPES INDIVIDUELLES
// ═══════════════════════════════════════════════════════════

function StepFabric({
  product,
  fabricId,
  setFabricId,
  dir,
}: {
  product: ProductDTO;
  fabricId: string;
  setFabricId: (id: string) => void;
  dir: string;
}) {
  const { t, L, lang } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-bold">{t("product.fabric.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("product.fabric.hint")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {product.fabrics.map((fabric) => {
            const selected = fabric.id === fabricId;
            const extra = fabric.productExtra;

            return (
              <motion.button
                key={fabric.id}
                onClick={() => {
                  setFabricId(fabric.id);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 p-4 text-start transition-all",
                  selected
                    ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                    : "border-border bg-card hover:border-gold/40"
                )}
              >
                {fabric.image && (
                  <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl">
                    <SmartImage
                      src={fabric.image}
                      alt={L(fabric, "name")}
                      width={300}
                      height={225}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold">{L(fabric, "name")}</h3>
                    {extra > 0 && (
                      <p className="mt-1 text-xs text-gold">+ {formatDA(extra, lang)}</p>
                    )}
                  </div>

                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-primary-foreground"
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function StepColor({
  availableColors,
  colorId,
  setColorId,
  dir,
}: {
  availableColors: Array<{ id: string; name: string; nameAr: string; hex: string }>;
  colorId: string;
  setColorId: (id: string) => void;
  dir: string;
}) {
  const { t, L } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-bold">{t("product.color.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("product.color.hint")}</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {availableColors.map((color) => {
            const selected = color.id === colorId;

            return (
              <motion.button
                key={color.id}
                onClick={() => {
                  setColorId(color.id);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all",
                  selected
                    ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                    : "border-border bg-card hover:border-gold/40"
                )}
              >
                {/* Pastille de couleur */}
                <div
                  className={cn(
                    "relative h-16 w-16 rounded-full border-4 shadow-lg transition-transform group-hover:scale-110",
                    selected ? "border-gold" : "border-background"
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check className="h-6 w-6 text-white drop-shadow-lg" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>

                <span className="text-center text-sm font-medium">{L(color, "name")}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function StepSize({
  product,
  size,
  setSize,
  measurements,
  setMeasurements,
  dir,
}: {
  product: ProductDTO;
  size: string;
  setSize: (s: string) => void;
  measurements: Record<string, number>;
  setMeasurements: (m: Record<string, number>) => void;
  dir: string;
}) {
  const { t, lang } = useI18n();
  const isCustom = size === "sur-mesure";

  return (
    <motion.div
      initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-bold">{t("product.size.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("product.size.hint")}</p>

        {/* Bascule standard / sur-mesure */}
        <div className="mt-6 inline-flex rounded-full border border-border bg-muted p-1">
          <button
            onClick={() => setSize("")}
            className={cn(
              "rounded-full px-6 py-2 text-sm font-semibold transition-all",
              !isCustom ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {t("product.size.standard")}
          </button>
          <button
            onClick={() => setSize("sur-mesure")}
            className={cn(
              "rounded-full px-6 py-2 text-sm font-semibold transition-all",
              isCustom ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Ruler className="me-2 inline h-4 w-4" />
            {t("product.size.custom")}
          </button>
        </div>

        {!isCustom ? (
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {STANDARD_SIZES.map((sz) => {
              const selected = size === sz;
              return (
                <motion.button
                  key={sz}
                  onClick={() => {
                    setSize(sz);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex h-14 items-center justify-center rounded-xl border-2 font-display font-semibold transition-all",
                    selected
                      ? "border-gold bg-gold text-primary-foreground shadow-lg shadow-gold/30"
                      : "border-border bg-card hover:border-gold/40"
                  )}
                >
                  {sz}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {product.customSizeFee > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold">
                <Sparkles className="h-4 w-4" />
                {t("product.size.customFee")}: +{formatDA(product.customSizeFee, lang)}
              </div>
            )}

            {MEASUREMENT_FIELDS.map((field) => {
              const value = measurements[field.key] ?? "";
              const valid = value >= field.min && value <= field.max;

              return (
                <div key={field.key} className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium">
                    <span>{field.label[lang]}</span>
                    <span className="text-xs text-muted-foreground">
                      {field.min}–{field.max} cm
                    </span>
                  </label>

                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step="0.5"
                    value={value || field.min}
                    onChange={(e) => {
                      setMeasurements({ ...measurements, [field.key]: parseFloat(e.target.value) });
                      if (navigator.vibrate) navigator.vibrate(5);
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-gold"
                  />

                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-semibold", valid ? "text-gold" : "text-muted-foreground")}>
                      {value ? `${value} cm` : "—"}
                    </span>
                    {valid && <Check className="h-4 w-4 text-gold" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StepEmbroidery({
  product,
  embroideryIds,
  setEmbroideryIds,
  dir,
}: {
  product: ProductDTO;
  embroideryIds: string[];
  setEmbroideryIds: (ids: string[]) => void;
  dir: string;
}) {
  const { t, L, lang } = useI18n();

  const toggle = (id: string) => {
    setEmbroideryIds(
      embroideryIds.includes(id) ? embroideryIds.filter((x) => x !== id) : [...embroideryIds, id]
    );
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-bold">{t("product.embroidery.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("product.embroidery.hint")}</p>

        {product.embroideries.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">{t("product.embroidery.none")}</p>
        ) : (
          <div className="mt-8 space-y-3">
            {product.embroideries.map((emb) => {
              const selected = embroideryIds.includes(emb.id);

              return (
                <motion.button
                  key={emb.id}
                  onClick={() => toggle(emb.id)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-xl border-2 p-4 text-start transition-all",
                    selected
                      ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                      : "border-border bg-card hover:border-gold/40"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{L(emb, "name")}</h3>
                    <p className="mt-1 text-xs text-gold">+{formatDA(emb.priceExtra, lang)}</p>
                  </div>

                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                      selected ? "border-gold bg-gold" : "border-border"
                    )}
                  >
                    {selected && <Check className="h-4 w-4 text-primary-foreground" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StepDetails({
  eventDate,
  setEventDate,
  note,
  setNote,
  quantity,
  setQuantity,
  dir,
}: {
  eventDate: string;
  setEventDate: (d: string) => void;
  note: string;
  setNote: (n: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  dir: string;
}) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">{t("product.details.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("product.details.hint")}</p>
        </div>

        {/* Quantité */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("product.quantity")}</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-40"
              disabled={quantity <= 1}
            >
              <span className="text-xl">−</span>
            </button>
            <span className="flex-1 text-center font-display text-2xl font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <span className="text-xl">+</span>
            </button>
          </div>
        </div>

        {/* Date événement */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            {t("product.eventDate")}
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("product.note")}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder={t("product.notePlaceholder")}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-base focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
      </div>
    </motion.div>
  );
}

function StepSummary({
  product,
  fabricId,
  colorId,
  size,
  measurements,
  embroideryIds,
  eventDate,
  note,
  quantity,
  unitPrice,
  total,
  dir,
}: {
  product: ProductDTO;
  fabricId: string;
  colorId: string;
  size: string;
  measurements: Record<string, number>;
  embroideryIds: string[];
  eventDate: string;
  note: string;
  quantity: number;
  unitPrice: number;
  total: number;
  dir: string;
}) {
  const { t, L, lang } = useI18n();

  const fabric = product.fabrics.find((f) => f.id === fabricId);
  const color = product.colors.find((c) => c.id === colorId);
  const embroideries = product.embroideries.filter((e) => embroideryIds.includes(e.id));
  const isCustom = size === "sur-mesure";

  return (
    <motion.div
      initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">{t("product.summary.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("product.summary.hint")}</p>
        </div>

        {/* Carte récapitulatif */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold">{L(product, "name")}</h3>
            <p className="text-sm text-muted-foreground">{formatDA(product.basePrice, lang)}</p>
          </div>

          <div className="space-y-2 text-sm">
            {fabric && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("product.fabric.title")}:</span>
                <span className="font-medium">{L(fabric, "name")}</span>
              </div>
            )}

            {color && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("product.color.title")}:</span>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: color.hex }} />
                  <span className="font-medium">{L(color, "name")}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("product.size.title")}:</span>
              <span className="font-medium">{isCustom ? t("product.size.custom") : size}</span>
            </div>

            {embroideries.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("product.embroidery.title")}:</span>
                <span className="font-medium">{embroideries.map((e) => L(e, "name")).join(", ")}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("product.quantity")}:</span>
              <span className="font-medium">{quantity}</span>
            </div>

            {eventDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("product.eventDate")}:</span>
                <span className="font-medium">{new Date(eventDate).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-DZ")}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t("checkout.cart.subtotal")}</span>
              <span className="font-display text-xl font-bold text-gold">{formatDA(total, lang)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
