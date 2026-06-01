import { connectDB } from "@/lib/mongodb";
import { Recipe } from "@/lib/models/Recipe";
import { costRecipeLines } from "@/lib/match-ingredient";
import { parseRecipeText } from "@/lib/parse-recipe";
import { sumLineCosts } from "@/lib/recipe-totals";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const recipes = await Recipe.find({ clientId: id }).sort({ updatedAt: -1 }).lean();
    return jsonOk(recipes);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load recipes", 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { id: clientId } = await params;
  const body = await parseJsonBody<{
    name?: string;
    rawText?: string;
    lines?: Array<{
      ingredientName: string;
      quantity: number;
      unit: string;
      ingredientProductId?: string;
    }>;
  }>(request);

  if (!body?.name?.trim()) {
    return jsonError("Recipe name is required");
  }

  try {
    await connectDB();
    const parsed =
      body.lines && body.lines.length > 0
        ? body.lines
        : body.rawText
          ? parseRecipeText(body.rawText)
          : [];

    if (parsed.length === 0) {
      return jsonError("Add ingredients via text or parsed lines");
    }

    const costedLines = await costRecipeLines(parsed);
    const totalCost = sumLineCosts(costedLines);

    const recipe = await Recipe.create({
      clientId,
      name: body.name.trim(),
      rawText: body.rawText ?? "",
      lines: costedLines,
      totalCost,
    });

    return jsonOk(recipe, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create recipe", 500);
  }
}
