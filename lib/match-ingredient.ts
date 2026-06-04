import { IngredientProduct } from "@/lib/models/IngredientProduct";
import {
  MIN_MATCH_SCORE,
  scoreIngredientSimilarity,
} from "@/lib/ingredient-match";
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

    if ("ambiguous" in match && match.ambiguous) {
      return {
        ...line,
        matchNote: match.message,
      };
    }

    const product = match as ScoredMatch;

    const costPerPound =
      product.costPerPound ??
      calculateCostPerPound(
        product.packPrice,
        product.unitsPerPack,
        product.unitSize,
        product.weightUnit,
      );

    if (costPerPound === null) {
      return {
        ...line,
        ingredientProductId: String(product._id),
        vendor: product.vendor,
        brand: product.brand,
        matchNote: product.matchScore < 0.75
          ? `Matched "${product.name}" (${Math.round(product.matchScore * 100)}% similar) — could not calculate cost per pound`
          : `Matched "${product.name}" — could not calculate cost per pound`,
      };
    }

    const lineCost = calculateLineCost(
      line.quantity,
      line.unit,
      costPerPound,
    );

    const matchHint =
      product.matchScore >= 0.99
        ? undefined
        : `Matched inventory: ${product.name}`;

    return {
      ...line,
      ingredientProductId: String(product._id),
      vendor: product.vendor,
      brand: product.brand,
      costPerPound,
      lineCost: lineCost ?? undefined,
      matchNote: matchHint,
    };
  });
}

type ProductMatch = {
  _id: unknown;
  name: string;
  vendor: string;
  brand: string;
  packPrice: number;
  unitsPerPack: number;
  unitSize: string;
  weightUnit: "lb" | "oz" | "kg" | "g";
  costPerPound?: number;
};

type ScoredMatch = ProductMatch & { matchScore: number };

type AmbiguousMatch = { ambiguous: true; message: string };

function findBestMatch(
  name: string,
  products: ProductMatch[],
): ScoredMatch | AmbiguousMatch | null {
  const scored = products
    .map((product) => ({
      product,
      score: scoreIngredientSimilarity(name, product.name),
    }))
    .filter((entry) => entry.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  if (scored.length > 1 && scored[0].score - scored[1].score < 0.08) {
    const labels = scored
      .slice(0, 3)
      .map(
        (entry) =>
          `${entry.product.name} (${Math.round(entry.score * 100)}%)`,
      )
      .join("; ");
    return {
      ambiguous: true,
      message: `Multiple possible matches for "${name}" — ${labels}${scored.length > 3 ? "…" : ""}`,
    };
  }

  return { ...scored[0].product, matchScore: scored[0].score };
}
