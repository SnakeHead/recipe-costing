import { parseUnitSizeNumeric } from "./unit-size";
import { toPounds } from "./units";
import type { WeightUnit } from "./types";

export function calculateCostPerPound(
  packPrice: number,
  unitsPerPack: number,
  unitSize: string,
  weightUnit: WeightUnit,
): number | null {
  const numericSize = parseUnitSizeNumeric(unitSize);
  if (numericSize === null) return null;
  const totalPounds = toPounds(unitsPerPack * numericSize, weightUnit);
  if (!totalPounds || totalPounds <= 0) return null;
  return packPrice / totalPounds;
}

export function calculateLineCost(
  recipeQuantity: number,
  recipeUnit: string,
  costPerPound: number,
): number | null {
  const pounds = toPounds(recipeQuantity, recipeUnit);
  if (pounds === null) return null;
  return pounds * costPerPound;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatWeightPerPound(costPerPound: number): string {
  return `${formatMoney(costPerPound)}/lb`;
}
