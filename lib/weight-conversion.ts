import { normalizeVolumeUnit } from "./recipe-units";

export interface WeightConversionInput {
  ingredientName: string;
  measureQuantity: number;
  measureUnit: string;
  pounds: number;
}

export function normalizeWeightConversionInput(
  body: Partial<WeightConversionInput>,
): { value: WeightConversionInput; error?: string } | { error: string } {
  const ingredientName = body.ingredientName?.trim() ?? "";
  const measureUnit = normalizeVolumeUnit(body.measureUnit ?? "");
  const measureQuantity =
    typeof body.measureQuantity === "number" ? body.measureQuantity : NaN;
  const pounds = typeof body.pounds === "number" ? body.pounds : NaN;

  if (!ingredientName) {
    return { error: "Ingredient name is required" };
  }
  if (!measureUnit) {
    return { error: "Choose a valid measure unit (cup, gal, qt, etc.)" };
  }
  if (!Number.isFinite(measureQuantity) || measureQuantity <= 0) {
    return { error: "Measure quantity must be greater than zero" };
  }
  if (!Number.isFinite(pounds) || pounds <= 0) {
    return { error: "Pounds must be greater than zero" };
  }

  return {
    value: {
      ingredientName,
      measureQuantity,
      measureUnit,
      pounds,
    },
  };
}

export function formatMeasureLabel(
  measureQuantity: number,
  measureUnit: string,
): string {
  if (measureUnit === "can" && measureQuantity !== 1) {
    return `#${measureQuantity} can`;
  }
  return `${measureQuantity} ${measureUnit}`;
}

export function poundsPerUnit(
  measureQuantity: number,
  pounds: number,
): number {
  return pounds / measureQuantity;
}
