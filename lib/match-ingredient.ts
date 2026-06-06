import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { IngredientWeightConversion } from "@/lib/models/IngredientWeightConversion";
import {
  MIN_MATCH_SCORE,
  rankIngredientMatches,
  scoreIngredientSimilarity,
} from "@/lib/ingredient-match";
import { calculateCostPerPound, calculateLineCost } from "./costing";
import type {
  CostedRecipeLine,
  IngredientMatchCandidate,
  RecipeLineInput,
} from "./types";

const AMBIGUITY_GAP = 0.08;
const CANDIDATE_LIMIT = 12;

export async function costRecipeLines(
  lines: RecipeLineInput[],
): Promise<CostedRecipeLine[]> {
  const [products, conversionDocs] = await Promise.all([
    IngredientProduct.find().lean(),
    IngredientWeightConversion.find().lean(),
  ]);

  const productList = products as ProductMatch[];
  const conversions = conversionDocs.map((row) => ({
    ingredientName: row.ingredientName,
    measureQuantity: row.measureQuantity,
    measureUnit: row.measureUnit,
    pounds: row.pounds,
  }));

  return lines.map((line) =>
    costSingleLine(line, productList, conversions),
  );
}

function costSingleLine(
  line: RecipeLineInput,
  products: ProductMatch[],
  conversions: Array<{
    ingredientName: string;
    measureQuantity: number;
    measureUnit: string;
    pounds: number;
  }>,
): CostedRecipeLine {
  const candidates = buildCandidates(line, products, conversions);
  const forced = line.ingredientProductId
    ? products.find((product) => String(product._id) === line.ingredientProductId)
    : undefined;

  if (line.ingredientProductId && !forced) {
    return {
      ...line,
      matchCandidates: candidates,
      needsSelection: true,
      matchNote: "Selected inventory item was not found — choose another",
    };
  }

  const autoMatch: AutoMatchResult | null = forced
    ? {
        product: forced,
        score: scoreIngredientSimilarity(line.ingredientName, forced.name),
        ambiguous: false,
        competitors: [],
      }
    : pickAutoMatch(line.ingredientName, products);

  if (!autoMatch) {
    return {
      ...line,
      matchCandidates: candidates,
      needsSelection: candidates.length > 0,
      matchNote:
        candidates.length > 0
          ? "No confident match — select an inventory item below"
          : "No matching ingredient in database",
    };
  }

  if (
    !forced &&
    autoMatch.ambiguous &&
    autoMatch.competitors.length > 0
  ) {
    const labels = autoMatch.competitors
      .slice(0, 3)
      .map(
        (entry) =>
          `${entry.product.name} (${Math.round(entry.score * 100)}%)`,
      )
      .join("; ");
    return {
      ...line,
      matchCandidates: candidates,
      needsSelection: true,
      matchNote: `Multiple possible matches for "${line.ingredientName}" — ${labels}${autoMatch.competitors.length > 3 ? "…" : ""}. Select the correct item below.`,
    };
  }

  return applyProductMatch(
    line,
    autoMatch.product,
    autoMatch.score,
    conversions,
    candidates,
  );
}

function buildCandidates(
  line: RecipeLineInput,
  products: ProductMatch[],
  conversions: Array<{
    ingredientName: string;
    measureQuantity: number;
    measureUnit: string;
    pounds: number;
  }>,
): IngredientMatchCandidate[] {
  return rankIngredientMatches(line.ingredientName, products, CANDIDATE_LIMIT).map(
    ({ item, score }) => {
      const costPerPound =
        item.costPerPound ??
        calculateCostPerPound(
          item.packPrice,
          item.unitsPerPack,
          item.unitSize,
          item.weightUnit,
        );

      const { lineCost } =
        costPerPound !== null
          ? calculateLineCost(
              line.quantity,
              line.unit,
              costPerPound,
              line.ingredientName,
              conversions,
            )
          : { lineCost: null };

      return {
        ingredientProductId: String(item._id),
        name: item.name,
        vendor: item.vendor,
        brand: item.brand,
        score,
        packPrice: item.packPrice,
        costPerPound: costPerPound ?? undefined,
        estimatedLineCost: lineCost ?? undefined,
      };
    },
  );
}

type AutoMatchResult = {
  product: ProductMatch;
  score: number;
  ambiguous: boolean;
  competitors: Array<{ product: ProductMatch; score: number }>;
};

function pickAutoMatch(
  name: string,
  products: ProductMatch[],
): AutoMatchResult | null {
  const scored = products
    .map((product) => ({
      product,
      score: scoreIngredientSimilarity(name, product.name),
    }))
    .filter((entry) => entry.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const competitors =
    scored.length > 1 && scored[0].score - scored[1].score < AMBIGUITY_GAP
      ? scored
      : [];

  return {
    product: scored[0].product,
    score: scored[0].score,
    ambiguous: competitors.length > 0,
    competitors,
  };
}

function applyProductMatch(
  line: RecipeLineInput,
  product: ProductMatch,
  matchScore: number,
  conversions: Array<{
    ingredientName: string;
    measureQuantity: number;
    measureUnit: string;
    pounds: number;
  }>,
  candidates: IngredientMatchCandidate[],
): CostedRecipeLine {
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
      matchCandidates: candidates,
      matchNote:
        matchScore < 0.75
          ? `Matched "${product.name}" (${Math.round(matchScore * 100)}% similar) — could not calculate cost per pound`
          : `Matched "${product.name}" — could not calculate cost per pound`,
    };
  }

  const { lineCost, conversionNote } = calculateLineCost(
    line.quantity,
    line.unit,
    costPerPound,
    line.ingredientName,
    conversions,
  );

  const matchHint =
    matchScore >= 0.99 ? undefined : `Matched inventory: ${product.name}`;

  const notes = [matchHint, conversionNote].filter(Boolean).join(" · ");

  return {
    ...line,
    ingredientProductId: String(product._id),
    vendor: product.vendor,
    brand: product.brand,
    costPerPound,
    lineCost: lineCost ?? undefined,
    matchCandidates: candidates,
    matchNote:
      lineCost == null
        ? (conversionNote ?? notes ?? matchHint)
        : (notes || undefined),
  };
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
