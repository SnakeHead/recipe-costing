import { normalizeUnit } from "./units";

const VOLUME_UNIT_ALIASES: Record<string, string> = {
  cup: "cup",
  cups: "cup",
  c: "cup",
  gal: "gal",
  gallon: "gal",
  gallons: "gal",
  qt: "qt",
  qts: "qt",
  quart: "qt",
  quarts: "qt",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  can: "can",
  cans: "can",
  pkg: "pkg",
  package: "pkg",
  packages: "pkg",
};

export const RECIPE_WEIGHT_UNITS = ["lb", "oz", "kg", "g"] as const;
export const RECIPE_VOLUME_UNITS = [
  "cup",
  "gal",
  "qt",
  "tbsp",
  "tsp",
  "can",
  "pkg",
] as const;

export type RecipeVolumeUnit = (typeof RECIPE_VOLUME_UNITS)[number];

export function normalizeVolumeUnit(raw: string): RecipeVolumeUnit | null {
  const key = raw.trim().toLowerCase().replace(/\./g, "");
  const unit = VOLUME_UNIT_ALIASES[key];
  return unit ? (unit as RecipeVolumeUnit) : null;
}

export function normalizeRecipeUnit(raw: string): string | null {
  return normalizeUnit(raw) ?? normalizeVolumeUnit(raw);
}

export function isVolumeUnit(unit: string): boolean {
  return normalizeVolumeUnit(unit) !== null;
}

export function isWeightUnit(unit: string): boolean {
  return normalizeUnit(unit) !== null;
}
