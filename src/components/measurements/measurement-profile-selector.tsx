"use client";

// ─────────────────────────────────────────────────────────────
// MeasurementProfileSelector — Sélecteur de profil de mesures
// Affiche les profils sauvegardés, permet d'en créer un nouveau
// Intégré dans le configurateur pour la sélection "sur-mesure"
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Plus, Check, Loader2, User, Calendar } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Lang } from "@/i18n";

interface MeasurementSet {
  id: string;
  chest: number;
  waist: number;
  hips: number;
  shoulders: number;
  sleeve: number;
  length: number;
  createdAt: string;
}

interface MeasurementProfile {
  id: string;
  name: string | null;
  isValidated: boolean;
  createdAt: string;
  measurements: MeasurementSet[];
}

interface MeasurementProfileSelectorProps {
  onSelect: (measurements: Record<string, number>) => void;
  onCreateNew: () => void;
  selectedProfileId?: string;
  lang?: Lang;
}

const translations = {
  fr: {
    title: "Mes profils de mesures",
    noProfiles: "Aucun profil sauvegardé",
    createFirst: "Créez votre premier profil avec l'assistant",
    createNew: "Nouveau profil",
    select: "Utiliser ce profil",
    selected: "Profil sélectionné",
    validated: "Validé",
    pending: "En attente",
    createdOn: "Créé le",
    measurements: "mesures",
    loading: "Chargement...",
  },
  ar: {
    title: "ملفات القياسات الخاصة بي",
    noProfiles: "لا توجد ملفات محفوظة",
    createFirst: "أنشئ ملفك الأول باستخدام المساعد",
    createNew: "ملف جديد",
    select: "استخدم هذا الملف",
    selected: "الملف المحدد",
    validated: "مصادق عليه",
    pending: "قيد الانتظار",
    createdOn: "تم الإنشاء في",
    measurements: "قياسات",
    loading: "جار التحميل...",
  },
  kab: {
    title: "Imaɣnuten-iw n tsektayin",
    noProfiles: "Ulac amaɣnu yettwasekles",
    createFirst: "Snulfu-d amaɣnu-nwen amezwaru s umɛiwen",
    createNew: "Amaɣnu amaynut",
    select: "Seqdec amaɣnu-a",
    selected: "Amaɣnu yettwafernen",
    validated: "Yettwasegger",
    pending: "Irajy",
    createdOn: "Yettwarna ass n",
    measurements: "tisektayin",
    loading: "Asali...",
  },
};

export function MeasurementProfileSelector({
  onSelect,
  onCreateNew,
  selectedProfileId,
  lang = "fr",
}: MeasurementProfileSelectorProps) {
  const t = translations[lang];
  const [profiles, setProfiles] = useState<MeasurementProfile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api<{ profiles: MeasurementProfile[] }>(
        "/api/measurements/profiles"
      );
      setProfiles(data.profiles);
    } catch (err) {
      console.error("Failed to load profiles:", err);
      setError(err instanceof Error ? err.message : "Erreur");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = (profile: MeasurementProfile) => {
    // Utilise le dernier ensemble de mesures
    const latestMeasurements = profile.measurements[0];
    if (latestMeasurements) {
      onSelect({
        chest: latestMeasurements.chest,
        waist: latestMeasurements.waist,
        hips: latestMeasurements.hips,
        shoulders: latestMeasurements.shoulders,
        sleeve: latestMeasurements.sleeve,
        length: latestMeasurements.length,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
        <span className="ml-2 text-sm text-muted-foreground">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-50/5 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-gold/20 bg-gold/5 p-6 text-center">
        <Ruler className="mx-auto h-12 w-12 text-gold/50" />
        <div>
          <p className="font-medium text-foreground">{t.noProfiles}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.createFirst}</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          {t.createNew}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec bouton nouveau */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">{t.title}</h4>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
        >
          <Plus className="h-4 w-4" />
          {t.createNew}
        </button>
      </div>

      {/* Liste des profils */}
      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {profiles.map((profile) => {
            const isSelected = profile.id === selectedProfileId;
            const latestMeasurements = profile.measurements[0];

            return (
              <motion.button
                key={profile.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleSelectProfile(profile)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 p-4 text-start transition-all",
                  isSelected
                    ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                    : "border-border bg-card hover:border-gold/40"
                )}
              >
                {/* Badge validation */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {profile.name || `Profil ${profile.id.slice(0, 6)}`}
                    </span>
                  </div>
                  {profile.isValidated && (
                    <span className="flex items-center gap-1 rounded-full bg-jade/15 px-2 py-0.5 text-xs font-medium text-jade">
                      <Check className="h-3 w-3" />
                      {t.validated}
                    </span>
                  )}
                </div>

                {/* Mesures preview */}
                {latestMeasurements && (
                  <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Poitrine</span>
                      <div className="font-semibold">{latestMeasurements.chest} cm</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taille</span>
                      <div className="font-semibold">{latestMeasurements.waist} cm</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hanches</span>
                      <div className="font-semibold">{latestMeasurements.hips} cm</div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(profile.createdAt).toLocaleDateString(
                      lang === "ar" ? "ar-DZ" : "fr-FR"
                    )}
                  </div>
                  <span>
                    {profile.measurements.length} {t.measurements}
                  </span>
                </div>

                {/* Icône sélection */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-primary-foreground"
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
