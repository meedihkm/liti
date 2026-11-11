// ─────────────────────────────────────────────────────────────
// Types pour le module de prise de mesures
// ─────────────────────────────────────────────────────────────

import type { MeasurementKey } from "../constants";

export type MeasurementMethod = "tape" | "dress" | "estimation";
export type MeasurementFit = "fitted" | "comfortable" | "loose";
export type MeasurementUnit = "cm" | "inches";
export type MeasurementRelation = "self" | "daughter" | "sister" | "other";
export type ValidationStatus = "pending" | "approved" | "needs_correction";

export interface MeasurementValues {
  chest: number;
  waist: number;
  hips: number;
  shoulders: number;
  sleeve: number;
  length: number;
}

export interface MeasurementProfile {
  id: string;
  userId: string;
  sessionId: string;
  name: string;
  relation: MeasurementRelation;
  createdAt: string;
  updatedAt: string;
  measurements: MeasurementSet[];
}

export interface MeasurementSet {
  id: string;
  profileId: string;
  method: MeasurementMethod;
  values: MeasurementValues;
  fit: MeasurementFit;
  displayUnit: MeasurementUnit;
  confirmed: Partial<Record<MeasurementKey, boolean>>;
  note: string;
  createdAt: string;
  validations?: MeasurementValidation[];
}

export interface MeasurementValidation {
  id: string;
  measurementSetId: string;
  status: ValidationStatus;
  corrections: Partial<Record<MeasurementKey, string>>;
  validatedBy: string;
  validatedAt: string;
  comment: string;
}

export interface MeasurementHistory {
  id: string;
  measurementSetId: string;
  field: MeasurementKey;
  oldValue: number;
  newValue: number;
  modifiedBy: string;
  modifiedAt: string;
}

export interface DressReferenceInput {
  shoulderWidth: number;
  chestWidth: number;
  waistWidth: number;
  hipWidth: number;
  totalLength: number;
}

export interface EstimationInput {
  height: number; // cm
  weight: number; // kg
}

export interface CoherenceAlert {
  field: MeasurementKey;
  rule: string;
  message: string;
  delta?: number;
}

export interface SilhouetteFactors {
  torsoWidth: number;
  waistWidth: number;
  hipsWidth: number;
  shouldersWidth: number;
  totalHeight: number;
}
