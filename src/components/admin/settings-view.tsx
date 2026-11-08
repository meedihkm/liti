"use client";

// ─────────────────────────────────────────────────────────────
// SettingsView — paramètres du site (task C2).
// Sections : identité, coordonnées, réseaux, accueil (bandeau +
// bande d'annonce), administration, changement de mot de passe.
// Enregistrement PUT /api/admin/settings (bannerEnabled "true"/
// "false") puis refresh() de usePublicData pour la vitrine.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import type { AdminUserDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// clés texte des settings (bannerEnabled est un switch à part)
const SETTING_KEYS = [
  "siteName",
  "siteNameAr",
  "tagline",
  "taglineAr",
  "phone",
  "whatsapp",
  "email",
  "address",
  "addressAr",
  "instagram",
  "facebook",
  "tiktok",
  "heroTitle",
  "heroTitleAr",
  "heroSubtitle",
  "heroSubtitleAr",
  "bannerText",
  "bannerTextAr",
  "adminEmail",
] as const;

type SettingsForm = Record<(typeof SETTING_KEYS)[number], string>;

const EMPTY_FORM: SettingsForm = Object.fromEntries(
  SETTING_KEYS.map((k) => [k, ""])
) as SettingsForm;

// ── Champ bilingue FR/AR ──────────────────────────────────────

function BiField({
  label,
  frLabel,
  arLabel,
  value,
  valueAr,
  onChange,
  onArChange,
  textarea = false,
  ph,
  phAr,
}: {
  label: string;
  frLabel: string;
  arLabel: string;
  value: string;
  valueAr: string;
  onChange: (v: string) => void;
  onArChange: (v: string) => void;
  textarea?: boolean;
  ph?: string;
  phAr?: string;
}) {
  const idFr = `st-${label.replace(/\s/g, "-")}-fr`;
  const idAr = `st-${label.replace(/\s/g, "-")}-ar`;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {frLabel}
          </span>
          {textarea ? (
            <Textarea
              id={idFr}
              dir="ltr"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={2}
              placeholder={ph}
            />
          ) : (
            <Input
              id={idFr}
              dir="ltr"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={ph}
            />
          )}
        </div>
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {arLabel}
          </span>
          {textarea ? (
            <Textarea
              id={idAr}
              dir="rtl"
              value={valueAr}
              onChange={(e) => onArChange(e.target.value)}
              rows={2}
              placeholder={phAr}
            />
          ) : (
            <Input
              id={idAr}
              dir="rtl"
              value={valueAr}
              onChange={(e) => onArChange(e.target.value)}
              placeholder={phAr}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleField({
  label,
  value,
  onChange,
  ph,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ph?: string;
  hint?: string;
  type?: string;
}) {
  const id = `st-${label.replace(/\s/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        className="h-11"
        dir={type === "tel" || type === "url" ? "ltr" : undefined}
      />
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// ── Vue ───────────────────────────────────────────────────────

export function SettingsView({ user }: { user: AdminUserDTO }) {
  const { t } = useI18n();
  const { refresh } = usePublicData();
  const s = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      t(`admin.settings.${key}`, vars),
    [t]
  );

  const [form, setForm] = useState<SettingsForm | null>(null);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  const load = useCallback(() => {
    setForm(null);
    setLoadError(null);
    api<{ settings: Record<string, string> }>("/api/admin/settings")
      .then((d) => {
        setForm({
          ...EMPTY_FORM,
          ...Object.fromEntries(
            SETTING_KEYS.map((k) => [k, d.settings[k] ?? ""])
          ),
        });
        setBannerEnabled(d.settings.bannerEnabled !== "false");
      })
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : s("loadError"))
      );
  }, [s]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback((key: keyof SettingsForm, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const save = useCallback(async () => {
    if (!form || saving) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { ...form };
      body.bannerEnabled = bannerEnabled ? "true" : "false";
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      toast.success(s("saved"));
      refresh(); // la vitrine se met à jour immédiatement
    } catch (err) {
      toast.error(err instanceof Error ? err.message : s("loadError"));
    } finally {
      setSaving(false);
    }
  }, [form, saving, bannerEnabled, s, refresh]);

  const changePassword = useCallback(async () => {
    if (pwdSaving) return;
    if (!pwd.current || !pwd.next) {
      setPwdError(s("pwdHint"));
      return;
    }
    setPwdSaving(true);
    setPwdError(null);
    try {
      await api("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ current: pwd.current, next: pwd.next }),
      });
      toast.success(s("pwdChanged"));
      setPwd({ current: "", next: "" });
    } catch (err) {
      // erreurs de validation serveur affichées en place
      setPwdError(err instanceof Error ? err.message : s("loadError"));
    } finally {
      setPwdSaving(false);
    }
  }, [pwd, pwdSaving, s]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <Settings2 className="size-5 text-gold" />
          {s("title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{s("subtitle")}</p>
      </div>
      <Button
        className="h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
        onClick={save}
        disabled={!form || saving}
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {saving ? s("saving") : s("save")}
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

  if (!form) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.actions.loading")}>
        {header}
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}

      {/* Identité */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{s("secIdentity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BiField
            label={s("fSiteName")}
            frLabel={s("fr")}
            arLabel={s("ar")}
            value={form.siteName}
            valueAr={form.siteNameAr}
            onChange={(v) => patch("siteName", v)}
            onArChange={(v) => patch("siteNameAr", v)}
          />
          <BiField
            label={s("fTagline")}
            frLabel={s("fr")}
            arLabel={s("ar")}
            value={form.tagline}
            valueAr={form.taglineAr}
            onChange={(v) => patch("tagline", v)}
            onArChange={(v) => patch("taglineAr", v)}
          />
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{s("secContact")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SimpleField
              label={s("fPhone")}
              value={form.phone}
              onChange={(v) => patch("phone", v)}
              ph="+213 550 12 34 56"
              type="tel"
            />
            <SimpleField
              label={s("fWhatsapp")}
              value={form.whatsapp}
              onChange={(v) => patch("whatsapp", v)}
              ph="213550123456"
              hint={s("fWhatsappHint")}
              type="tel"
            />
          </div>
          <SimpleField
            label={s("fEmail")}
            value={form.email}
            onChange={(v) => patch("email", v)}
            ph="contact@taqendurt.dz"
            type="email"
          />
          <BiField
            label={s("fAddress")}
            frLabel={s("fr")}
            arLabel={s("ar")}
            value={form.address}
            valueAr={form.addressAr}
            onChange={(v) => patch("address", v)}
            onArChange={(v) => patch("addressAr", v)}
          />
        </CardContent>
      </Card>

      {/* Réseaux sociaux */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{s("secSocial")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <SimpleField
              label={s("fInstagram")}
              value={form.instagram}
              onChange={(v) => patch("instagram", v)}
              ph="https://instagram.com/…"
              type="url"
            />
            <SimpleField
              label={s("fFacebook")}
              value={form.facebook}
              onChange={(v) => patch("facebook", v)}
              ph="https://facebook.com/…"
              type="url"
            />
            <SimpleField
              label={s("fTiktok")}
              value={form.tiktok}
              onChange={(v) => patch("tiktok", v)}
              ph="https://tiktok.com/@…"
              type="url"
            />
          </div>
        </CardContent>
      </Card>

      {/* Page d'accueil */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{s("secHome")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BiField
            label={s("fHeroTitle")}
            frLabel={s("fr")}
            arLabel={s("ar")}
            value={form.heroTitle}
            valueAr={form.heroTitleAr}
            onChange={(v) => patch("heroTitle", v)}
            onArChange={(v) => patch("heroTitleAr", v)}
          />
          <BiField
            label={s("fHeroSubtitle")}
            frLabel={s("fr")}
            arLabel={s("ar")}
            value={form.heroSubtitle}
            valueAr={form.heroSubtitleAr}
            onChange={(v) => patch("heroSubtitle", v)}
            onArChange={(v) => patch("heroSubtitleAr", v)}
            textarea
          />
          <BiField
            label={s("fBannerText")}
            frLabel={s("fr")}
            arLabel={s("ar")}
            value={form.bannerText}
            valueAr={form.bannerTextAr}
            onChange={(v) => patch("bannerText", v)}
            onArChange={(v) => patch("bannerTextAr", v)}
            textarea
          />
          <div className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium leading-none">
                {s("fBannerEnabled")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {s("fBannerEnabledHint")}
              </p>
            </div>
            <Switch
              checked={bannerEnabled}
              onCheckedChange={setBannerEnabled}
              aria-label={s("fBannerEnabled")}
              className="scale-110 data-[state=checked]:bg-gold"
            />
          </div>
        </CardContent>
      </Card>

      {/* Administration */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{s("secAdmin")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimpleField
            label={s("fAdminEmail")}
            value={form.adminEmail}
            onChange={(v) => patch("adminEmail", v)}
            ph="admin@taqendurt.dz"
            type="email"
          />
          <p className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-gold" />
            {s("adminAccount", { name: user.name, role: user.role })}
          </p>
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-gold" />
            {s("secPassword")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              changePassword();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pwd-current">{s("pwdCurrent")}</Label>
                <Input
                  id="pwd-current"
                  type="password"
                  autoComplete="current-password"
                  value={pwd.current}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, current: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd-next">{s("pwdNext")}</Label>
                <Input
                  id="pwd-next"
                  type="password"
                  autoComplete="new-password"
                  value={pwd.next}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, next: e.target.value }))
                  }
                  className="h-11"
                  aria-invalid={Boolean(pwdError)}
                />
                <p className="text-xs text-muted-foreground">{s("pwdHint")}</p>
              </div>
            </div>
            {pwdError ? (
              <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                {pwdError}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                className="h-11"
                disabled={pwdSaving}
              >
                {pwdSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {s("pwdChange")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sauvegarde bas de page */}
      <div className="flex justify-end pb-2">
        <Button
          className="h-11 bg-gold font-semibold text-black hover:bg-gold-strong"
          onClick={save}
          disabled={!form || saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? s("saving") : s("save")}
        </Button>
      </div>
    </div>
  );
}
