"use client";

// ─────────────────────────────────────────────────────────────
// AdminLogin — écran de connexion au back-office.
// POST /api/admin/login { email, password } → { user }.
// Message d'erreur serveur affiché en clair (401 générique).
// ─────────────────────────────────────────────────────────────
import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, LogIn, Mail, LockKeyhole, Store } from "lucide-react";
import { api, ApiError, setSessionToken } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { YazMark } from "@/components/layout/berber-divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminUserDTO } from "@/lib/types";

export function AdminLogin({ onLogin }: { onLogin: (user: AdminUserDTO) => void }) {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const data = await api<{ user: AdminUserDTO; token?: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      // Token de secours pour les iframes/previews (cookies tiers bloqués) :
      // renvoyé via Authorization à chaque appel par api-client.
      setSessionToken(data.token ?? null);
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="glass rounded-2xl p-6 sm:p-8">
          {/* Marque */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <span className="text-gold" aria-hidden="true">
              <YazMark className="h-12 w-12" />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight">
                {t("admin.login.title")}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("admin.login.subtitle")}</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="admin-email">{t("admin.login.emailLabel")}</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-9 h-11"
                  placeholder="admin@taqendurt.dz"
                  aria-invalid={Boolean(error) || undefined}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">{t("admin.login.passwordLabel")}</Label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-9 h-11"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gold text-primary-foreground hover:bg-gold-strong"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t("common.actions.loading")}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  {t("admin.login.submit")}
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground/70">
            {t("admin.login.demoHint")}
          </p>
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            {t("admin.login.backToSite")}
          </button>
        </div>
      </div>
    </div>
  );
}
