import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { calculateCostPerPound, calculateLineCost } from "./costing";
import type { CostedRecipeLine, ParsedRecipeLine } from "./types";

export async function costRecipeLines(
  lines: ParsedRecipeLine[],
): Promise<CostedRecipeLine[]> {
  const products = await IngredientProduct.find().lean();

  return lines.map((line) => {
    const match = findBestMatch(line.ingredientName, products as ProductMatch[]);
    if (!match) {
      return {
        ...line,
        matchNote: "No matching ingredient in database",
      };
    }

    const costPerPound =
      match.costPerPound ??
      calculateCostPerPound(
        match.packPrice,
        match.unitsPerPack,
        match.weightPerUnit,
        match.weightUnit,
      );

    if (costPerPound === null) {
      return {
        ...line,
        ingredientProductId: String(match._id),
        vendor: match.vendor,
        matchNote: "Could not calculate cost per pound",
      };
    }

    const lineCost = calculateLineCost(
      line.quantity,
      line.unit,
      costPerPound,
    );

    return {
      ...line,
      ingredientProductId: String(match._id),
      vendor: match.vendor,
      costPerPound,
      lineCost: lineCost ?? undefined,
    };
  });
}

type ProductMatch = {
  _id: unknown;
  name: string;
  vendor: string;
  packPrice: number;
  unitsPerPack: number;
  weightPerUnit: number;
  weightUnit: "lb" | "oz" | "kg" | "g";
  costPerPound?: number;
};

function findBestMatch(name: string, products: ProductMatch[]) {
  const normalized = name.trim().toLowerCase();

  const exact = products.find((p) => p.name.toLowerCase() === normalized);
  if (exact) return exact;

  const contains = products.filter(
    (p) =>
      p.name.toLowerCase().includes(normalized) ||
      normalized.includes(p.name.toLowerCase()),
  );
  if (contains.length === 1) return contains[0];

  return contains.sort((a, b) => a.name.length - b.name.length)[0];
}
