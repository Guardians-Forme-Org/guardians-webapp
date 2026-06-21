import type { LocationResult } from "@/components/ui/LocationPicker";
import type { Intervention } from "./shared";

export type LogFormData = {
  siteName: string;
  permissionHolder: string;
  permissionConfirmed: boolean;
  markComplete: boolean;
  locationResult: LocationResult | null;
  baselinePhoto: string;
  plantingPhoto: string;
  estimatedArea: string;
  areaUnit: "m²" | "ha" | "km²" | "acres";
  siteCondition: string;
  surfaceType: string;
  greenSurfaceType: string;
  interventions: Intervention[];
  evidenceFiles: File[];
  impactDescription: string;
  contributors: string[];
  volunteerHours: string;
  measurementValue: string;
  measurementType: "VOLUME" | "MASS";
};

export const initForm = (): LogFormData => ({
  siteName: "",
  permissionHolder: "",
  permissionConfirmed: false,
  markComplete: false,
  locationResult: null,
  baselinePhoto: "",
  plantingPhoto: "",
  estimatedArea: "",
  areaUnit: "ha",
  siteCondition: "",
  surfaceType: "",
  greenSurfaceType: "",
  interventions: [{ id: 1, name: "", count: 1 }],
  evidenceFiles: [],
  impactDescription: "",
  contributors: [],
  volunteerHours: "",
  measurementValue: "",
  measurementType: "VOLUME",
});
