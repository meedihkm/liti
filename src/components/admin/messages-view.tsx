"use client";

// ─────────────────────────────────────────────────────────────
// MessagesView — messages de contact (task C2).
// Cartes : nom, téléphone (appel + WhatsApp normalisé 0X→213X),
// e-mail, sujet, message complet, date, badge de statut.
// Actions PATCH : marquer lu / traité / remettre en nouveau.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ContactMessageDTO } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Status = ContactMessageDTO["status"];
type Filter = "all" | Status;

/** 0771122334 / +213771122334 → https://wa.me/213771122334 */
function whatsappLink(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `213${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

function StatusBadge({ status, labels }: { status: Status; labels: Record<Status, string> }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "new" && "border-gold/40 bg-gold/15 text-gold",
        status === "read" && "border-zinc-500/30 bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
        status === "handled" &&
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      )}
    >
      {status === "new" ? (
        <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
      ) : null}
      {status === "handled" ? <CheckCheck className="size-3" /> : null}
      {labels[status]}
    </Badge>
  );
}

export function MessagesView() {
  const { t, lang } = useI18n();
  const m = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      t(`admin.messages.${key}`, vars),
    [t]
  );

  const [messages, setMessages] = useState<ContactMessageDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const labels: Record<Status, string> = useMemo(
    () => ({
      new: m("statusNew"),
      read: m("statusRead"),
      handled: m("statusHandled"),
    }),
    [m]
  );

  const load = useCallback(() => {
    setMessages(null);
    setLoadError(null);
    api<{ messages: ContactMessageDTO[] }>("/api/admin/messages")
      .then((d) => setMessages(d.messages))
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : m("loadError"))
      );
  }, [m]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = useCallback(
    async (message: ContactMessageDTO, status: Status) => {
      setBusyId(message.id);
      try {
        const updated = await api<ContactMessageDTO>(
          `/api/admin/messages/${message.id}`,
          { method: "PATCH", body: JSON.stringify({ status }) }
        );
        setMessages((prev) =>
          prev ? prev.map((x) => (x.id === updated.id ? updated : x)) : prev
        );
        toast.success(m("statusUpdated"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : m("loadError"));
      } finally {
        setBusyId(null);
      }
    },
    [m]
  );

  const filtered = useMemo(() => {
    if (!messages) return null;
    if (filter === "all") return messages;
    return messages.filter((x) => x.status === filter);
  }, [messages, filter]);

  const newCount = messages?.filter((x) => x.status === "new").length ?? 0;

  const formatDate = useCallback(
    (iso: string) =>
      new Date(iso).toLocaleString(lang === "ar" ? "ar-DZ" : "fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [lang]
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-semibold">{m("title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{m("subtitle")}</p>
      </div>
      {messages ? (
        <Badge
          variant="outline"
          className={cn(
            "h-8 px-3",
            newCount > 0
              ? "border-gold/40 bg-gold/15 text-gold"
              : "border-zinc-500/30 bg-zinc-500/15 text-zinc-500"
          )}
        >
          {m("statusNew")} : {newCount}
        </Badge>
      ) : null}
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

  if (!messages || !filtered) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.actions.loading")}>
        {header}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
      >
        <TabsList className="h-11 rounded-xl p-1">
          <TabsTrigger value="all" className="h-9 px-4 text-sm">
            {m("filterAll")}
          </TabsTrigger>
          <TabsTrigger value="new" className="h-9 px-4 text-sm">
            {m("filterNew")}
          </TabsTrigger>
          <TabsTrigger value="read" className="h-9 px-4 text-sm">
            {m("filterRead")}
          </TabsTrigger>
          <TabsTrigger value="handled" className="h-9 px-4 text-sm">
            {m("filterHandled")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Inbox className="size-10 text-gold/70" />
            <p className="font-medium">{m("emptyTitle")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {m("emptyDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((msg) => (
            <li key={msg.id}>
              <Card
                className={cn(
                  "transition-opacity duration-200",
                  msg.status === "new" && "border-gold/40"
                )}
              >
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{msg.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={msg.status} labels={labels} />
                  </div>

                  {/* Coordonnées */}
                  <div className="flex flex-wrap items-center gap-2">
                    {msg.phone ? (
                      <>
                        <a
                          href={`tel:${msg.phone.replace(/\s/g, "")}`}
                          className="flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-accent"
                        >
                          <Phone className="size-3.5" />
                          {msg.phone}
                        </a>
                        <a
                          href={whatsappLink(msg.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          <MessageCircle className="size-3.5" />
                          {m("whatsapp")}
                        </a>
                      </>
                    ) : null}
                    {msg.email ? (
                      <a
                        href={`mailto:${msg.email}`}
                        className="flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <Mail className="size-3.5" />
                        <span className="max-w-48 truncate">{msg.email}</span>
                      </a>
                    ) : null}
                  </div>

                  {/* Sujet + message */}
                  {msg.subject ? (
                    <p className="text-sm font-semibold">{msg.subject}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {msg.message}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                    {busyId === msg.id ? (
                      <Loader2 className="size-4 animate-spin text-gold" />
                    ) : null}
                    {msg.status !== "read" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10"
                        onClick={() => setStatus(msg, "read")}
                        disabled={busyId === msg.id}
                      >
                        {m("markRead")}
                      </Button>
                    ) : null}
                    {msg.status !== "handled" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                        onClick={() => setStatus(msg, "handled")}
                        disabled={busyId === msg.id}
                      >
                        <CheckCheck className="size-3.5" />
                        {m("markHandled")}
                      </Button>
                    ) : null}
                    {msg.status !== "new" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 text-muted-foreground"
                        onClick={() => setStatus(msg, "new")}
                        disabled={busyId === msg.id}
                      >
                        <RotateCcw className="size-3.5" />
                        {m("markNew")}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
