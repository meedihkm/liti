// ─────────────────────────────────────────────────────────────
// Hook pour gérer les profils de mesures
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import type { MeasurementProfile } from "@/lib/measurements/types";

export function useMeasurementProfiles() {
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/measurements/profiles");
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error("Failed to fetch profiles", err);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (name: string, relation: string) => {
    const res = await fetch("/api/measurements/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, relation }),
    });
    const newProfile = await res.json();
    setProfiles((prev) => [newProfile, ...prev]);
    return newProfile;
  };

  const deleteProfile = async (id: string) => {
    await fetch(`/api/measurements/profiles/${id}`, { method: "DELETE" });
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  return { profiles, loading, createProfile, deleteProfile, refresh: fetchProfiles };
}
