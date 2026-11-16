"use client";

// ─────────────────────────────────────────────────────────────
// MeasurementsView — gestion des profils de mesures (admin)
// Liste tous les profils avec statut de validation
// Permet validation/invalidation des profils clients
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Ruler, TriangleAlert, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useI18n } from "@/components/providers/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MeasurementProfile {
  id: string;
  userId: string;
  sessionId: string;
  name: string;
  relation: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    measurements: number;
    validations: number;
  };
}

interface MeasurementSet {
  id: string;
  profileId: string;
  method: string;
  valuesJson: string;
  fit: string;
  displayUnit: string;
  confirmedJson: string;
  note: string;
  createdAt: string;
  validations: MeasurementValidation[];
}

interface MeasurementValidation {
  id: string;
  measurementSetId: string;
  status: string;
  correctionsJson: string;
  validatedBy: string;
  validatedAt: string;
  comment: string;
}

interface ProfileDetail {
  profile: MeasurementProfile;
  measurements: MeasurementSet[];
  validations: MeasurementValidation[];
}

export function MeasurementsView() {
  const { t, lang } = useI18n();
  const [profiles, setProfiles] = useState<MeasurementProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationComment, setValidationComment] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  // Charger la liste des profils
  useEffect(() => {
    let cancelled = false;
    api<{ profiles: MeasurementProfile[] }>("/api/admin/measurements/profiles")
      .then((d) => {
        if (cancelled) return;
        setError(null);
        setProfiles(d.profiles);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur");
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Charger les détails d'un profil
  const loadProfile = async (id: string) => {
    try {
      const data = await api<ProfileDetail>(`/api/admin/measurements/profiles/${id}`);
      setSelectedProfile(data);
      setDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Valider un profil
  const validateProfile = async (status: "approved" | "rejected") => {
    if (!selectedProfile) return;

    setValidating(true);
    try {
      await api(`/api/admin/measurements/profiles/${selectedProfile.profile.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comment: validationComment || undefined,
        }),
      });

      toast.success(
        status === "approved"
          ? t("admin.measurements.validated")
          : t("admin.measurements.rejected")
      );

      setDialogOpen(false);
      setValidationComment("");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setValidating(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <TriangleAlert className="h-8 w-8 text-gold" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="h-11" onClick={reload}>
            {t("common.actions.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!profiles) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-gold" />
          <h1 className="font-display text-xl font-bold">
            {t("admin.shell.nav.measurements")}
          </h1>
        </div>
        <Badge variant="outline">{profiles.length} profils</Badge>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Ruler className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("admin.measurements.noProfiles")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.measurements.name")}</TableHead>
                <TableHead>{t("admin.measurements.sets")}</TableHead>
                <TableHead>{t("admin.measurements.status")}</TableHead>
                <TableHead>{t("admin.measurements.created")}</TableHead>
                <TableHead className="text-end">{t("common.actions.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                // Calculer si le profil est entièrement validé
                const isFullyValidated = profile._count.validations > 0 && 
                  profile._count.measurements === profile._count.validations;
                
                return (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    {profile.name || (
                      <span className="text-muted-foreground">Sans nom</span>
                    )}
                  </TableCell>
                  <TableCell>{profile._count.measurements}</TableCell>
                  <TableCell>
                    <Badge
                      variant={isFullyValidated ? "default" : "secondary"}
                      className={cn(
                        isFullyValidated
                          ? "bg-jade/15 text-jade"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isFullyValidated
                        ? t("admin.measurements.validated")
                        : t("admin.measurements.pending")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString(
                      lang === "ar" ? "ar-DZ" : "fr-FR"
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadProfile(profile.id)}
                    >
                      <Eye className="h-4 w-4" />
                      {t("common.actions.view")}
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog de détails */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProfile?.profile.name || "Profil de mesures"}
            </DialogTitle>
            <DialogDescription>
              ID: {selectedProfile?.profile.id}
            </DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-4">
              {/* Mesures */}
              {selectedProfile.measurements.map((set, idx) => {
                const values = JSON.parse(set.valuesJson) as {
                  chest?: number;
                  waist?: number;
                  hips?: number;
                  shoulders?: number;
                  sleeve?: number;
                  length?: number;
                };
                
                return (
                <div key={set.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold">
                      {t("admin.measurements.set")} {idx + 1}
                    </h4>
                    <Badge variant="outline">{set.method}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {values.chest && (
                      <div>
                        <span className="text-muted-foreground">Poitrine:</span>
                        <div className="font-semibold">{values.chest} cm</div>
                      </div>
                    )}
                    {values.waist && (
                      <div>
                        <span className="text-muted-foreground">Taille:</span>
                        <div className="font-semibold">{values.waist} cm</div>
                      </div>
                    )}
                    {values.hips && (
                      <div>
                        <span className="text-muted-foreground">Hanches:</span>
                        <div className="font-semibold">{values.hips} cm</div>
                      </div>
                    )}
                    {values.shoulders && (
                      <div>
                        <span className="text-muted-foreground">Épaules:</span>
                        <div className="font-semibold">{values.shoulders} cm</div>
                      </div>
                    )}
                    {values.sleeve && (
                      <div>
                        <span className="text-muted-foreground">Manches:</span>
                        <div className="font-semibold">{values.sleeve} cm</div>
                      </div>
                    )}
                    {values.length && (
                      <div>
                        <span className="text-muted-foreground">Longueur:</span>
                        <div className="font-semibold">{values.length} cm</div>
                      </div>
                    )}
                  </div>
                  {set.note && (
                    <p className="mt-3 text-sm text-muted-foreground italic">
                      Note: {set.note}
                    </p>
                  )}
                </div>
                );
              })}

              {/* Validations précédentes */}
              {selectedProfile.validations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">{t("admin.measurements.history")}</h4>
                  {selectedProfile.validations.map((val) => (
                    <div
                      key={val.id}
                      className={cn(
                        "rounded-lg border p-3 text-sm",
                        val.status === "approved"
                          ? "border-jade/30 bg-jade/5"
                          : "border-red-300/30 bg-red-50/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{val.validatedBy}</span>
                        <Badge
                          variant={val.status === "approved" ? "default" : "destructive"}
                        >
                          {val.status === "approved" ? "Approuvé" : val.status === "needs_correction" ? "Correction" : val.status}
                        </Badge>
                      </div>
                      {val.comment && (
                        <p className="mt-2 text-muted-foreground">{val.comment}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(val.validatedAt).toLocaleString(
                          lang === "ar" ? "ar-DZ" : "fr-FR"
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire de validation */}
              <div className="space-y-3">
                <Label htmlFor="validation-comment">
                  {t("admin.measurements.comment")}
                </Label>
                <Textarea
                  id="validation-comment"
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  placeholder={t("admin.measurements.commentPlaceholder")}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedProfile ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => validateProfile("needs_correction")}
                  disabled={validating}
                >
                  <X className="h-4 w-4" />
                  Correction nécessaire
                </Button>
                <Button
                  onClick={() => validateProfile("approved")}
                  disabled={validating}
                  className="bg-jade hover:bg-jade/90"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {t("admin.measurements.approve")}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.actions.close")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
