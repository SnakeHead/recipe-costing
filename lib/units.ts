import type { WeightUnit } from "./types";

const TO_POUNDS: Record<WeightUnit, number> = {
  lb: 1,
  oz: 1 / 16,
  kg: 2.2046226218,
  g: 2.2046226218 / 1000,
};

const UNIT_ALIASES: Record<string, WeightUnit> = {
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  g: "g",
  gram: "g",
  grams: "g",
};

export function normalizeUnit(raw: string): WeightUnit | null {
  const key = raw.trim().toLowerCase().replace(/\./g, "");
  return UNIT_ALIASES[key] ?? null;
}

export function toPounds(quantity: number, unit: string): number | null {
  const normalized = normalizeUnit(unit);
  if (!normalized) return null;
  return quantity * TO_POUNDS[normalized];
}

export function poundsToUnit(pounds: number, unit: WeightUnit): number {
  return pounds / TO_POUNDS[unit];
}
