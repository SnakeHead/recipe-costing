import {
  MIN_MATCH_SCORE,
  scoreIngredientSimilarity,
  tokenizeIngredientName,
} from "./ingredient-match";
import { isVolumeUnit, isWeightUnit } from "./recipe-units";
import { toPounds } from "./units";

export interface WeightConversionRow {
  ingredientName: string;
  measureQuantity: number;
  measureUnit: string;
  pounds: number;
}

const CONVERSION_STRIP_TOKENS = new Set([
  "sauce",
  "oil",
  "vinegar",
  "juice",
  "powder",
  "extract",
  "concentrate",
  "smoke",
]);

/** Lenient match for cheat-sheet names that omit words like "sauce". */
export function scoreConversionSimilarity(
  recipeName: string,
  conversionName: string,
): number {
  const recipeTokens = tokenizeIngredientName(recipeName).filter(
    (token) => !CONVERSION_STRIP_TOKENS.has(token),
  );
  const effectiveRecipe =
    recipeTokens.length > 0 ? recipeTokens.join(" ") : recipeName;
  return scoreIngredientSimilarity(effectiveRecipe, conversionName);
}

/** Convert a recipe quantity to pounds using weight units or the conversion table. */
export function recipeQuantityToPounds(
  quantity: number,
  unit: string,
  ingredientName: string,
  conversions: WeightConversionRow[],
): { pounds: number | null; note?: string } {
  if (isWeightUnit(unit)) {
    const pounds = toPounds(quantity, unit);
    return pounds === null
      ? { pounds: null, note: `Unknown weight unit "${unit}"` }
      : { pounds };
  }

  if (!isVolumeUnit(unit)) {
    return {
      pounds: null,
      note: `Unknown unit "${unit}" — use lb/oz/kg/g or a volume unit with a conversion`,
    };
  }

  const normalizedUnit = unit.trim().toLowerCase();
  const ranked = conversions
    .map((conversion) => ({
      item: conversion,
      score: scoreConversionSimilarity(ingredientName, conversion.ingredientName),
    }))
    .filter((entry) => entry.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score);

  for (const { item: conversion, score } of ranked) {
    if (conversion.measureUnit !== normalizedUnit) continue;

    const poundsPerMeasure =
      conversion.pounds / conversion.measureQuantity;
    const pounds = quantity * poundsPerMeasure;
    const hint =
      score >= 0.99
        ? undefined
        : `Used conversion for "${conversion.ingredientName}" (${conversion.measureQuantity} ${conversion.measureUnit} = ${conversion.pounds} lb)`;

    return { pounds, note: hint };
  }

  const ingredientMatches = conversions.filter(
    (conversion) =>
      scoreConversionSimilarity(ingredientName, conversion.ingredientName) >=
      MIN_MATCH_SCORE,
  );

  if (ingredientMatches.length > 0) {
    const units = [
      ...new Set(ingredientMatches.map((c) => c.measureUnit)),
    ].join(", ");
    return {
      pounds: null,
      note: `No ${normalizedUnit} conversion for "${ingredientName}" — available: ${units}`,
    };
  }

  return {
    pounds: null,
    note: `No weight conversion found for "${ingredientName}" in ${normalizedUnit}`,
  };
}
