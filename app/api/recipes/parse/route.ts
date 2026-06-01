import { connectDB } from "@/lib/mongodb";
import { parseRecipeText } from "@/lib/parse-recipe";
import { costRecipeLines } from "@/lib/match-ingredient";
import { sumLineCosts } from "@/lib/recipe-totals";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

export async function POST(request: Request) {
  const body = await parseJsonBody<{ rawText?: string }>(request);
  if (!body?.rawText?.trim()) {
    return jsonError("Recipe text is required");
  }

  try {
    await connectDB();
    const parsed = parseRecipeText(body.rawText);
    const costed = await costRecipeLines(parsed);
    return jsonOk({
      lines: costed,
      totalCost: sumLineCosts(costed),
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to parse recipe", 500);
  }
}
