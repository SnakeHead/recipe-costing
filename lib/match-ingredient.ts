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

    if ("ambiguous" in match && match.ambiguous) {
      return {
        ...line,
        matchNote: match.message,
      };
    }

    const product = match as ProductMatch;

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
      ingredientProductId: String(product._id),
      vendor: product.vendor,
      brand: product.brand,
      costPerPound,
      lineCost: lineCost ?? undefined,
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

type AmbiguousMatch = { ambiguous: true; message: string };

function findBestMatch(
  name: string,
  products: ProductMatch[],
): ProductMatch | AmbiguousMatch | null {
  const normalized = name.trim().toLowerCase();

  const exact = products.filter((p) => p.name.toLowerCase() === normalized);
  if (exact.length > 1) {
    const labels = exact
      .map((p) => [p.brand, p.vendor].filter(Boolean).join(" / "))
      .join("; ");
    return {
      ambiguous: true,
      message: `Multiple products match "${name}" (${labels}) — use distinct ingredient names or brands in your database`,
    };
  }
  if (exact.length === 1) return exact[0];

  const contains = products.filter(
    (p) =>
      p.name.toLowerCase().includes(normalized) ||
      normalized.includes(p.name.toLowerCase()),
  );
  if (contains.length > 1) {
    const labels = contains
      .slice(0, 3)
      .map((p) => [p.brand, p.vendor].filter(Boolean).join(" / "))
      .join("; ");
    return {
      ambiguous: true,
      message: `Multiple possible matches for "${name}" (${labels}${contains.length > 3 ? "…" : ""})`,
    };
  }
  if (contains.length === 1) return contains[0];

  return contains.sort((a, b) => a.name.length - b.name.length)[0] ?? null;
}
