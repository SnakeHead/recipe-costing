import { connectDB } from "@/lib/mongodb";
import { parseRecipeText } from "@/lib/parse-recipe";
import { costRecipeLines } from "@/lib/match-ingredient";
import { sumLineCosts } from "@/lib/recipe-totals";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import type { RecipeLineInput } from "@/lib/types";

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    rawText?: string;
    lines?: RecipeLineInput[];
  }>(request);

  let parsed: RecipeLineInput[] = [];

  if (body?.lines?.length) {
    parsed = body.lines.filter(
      (line) =>
        line.ingredientName?.trim() &&
        line.quantity > 0 &&
        line.unit?.trim(),
    ).map((line) => ({
      ingredientName: line.ingredientName.trim(),
      quantity: line.quantity,
      unit: line.unit.trim(),
      ingredientProductId: line.ingredientProductId,
    }));
  } else if (body?.rawText?.trim()) {
    parsed = parseRecipeText(body.rawText);
  }

  if (parsed.length === 0) {
    return jsonError(
      "Add at least one ingredient with a name, amount, and unit",
    );
  }

  try {
    await connectDB();
    const costed = await costRecipeLines(parsed);
    return jsonOk({
      lines: costed,
      totalCost: sumLineCosts(costed),
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to parse recipe", 500);
  }
}
