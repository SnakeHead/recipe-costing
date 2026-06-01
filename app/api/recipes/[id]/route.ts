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
    const recipe = await Recipe.findById(id)
      .populate("lines.ingredientProductId")
      .lean();
    if (!recipe) return jsonError("Recipe not found", 404);
    return jsonOk(recipe);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load recipe", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await parseJsonBody<{
    name?: string;
    rawText?: string;
    lines?: Array<{
      ingredientName: string;
      quantity: number;
      unit: string;
      ingredientProductId?: string;
    }>;
    recalculate?: boolean;
  }>(request);

  try {
    await connectDB();
    const existing = await Recipe.findById(id);
    if (!existing) return jsonError("Recipe not found", 404);

    let linesPayload = existing.lines;
    let totalCost = sumLineCosts(
      existing.lines.map((l) => ({
        ingredientName: l.ingredientName,
        quantity: l.quantity,
        unit: l.unit,
        lineCost: l.lineCost ?? undefined,
      })),
    );

    if (body?.rawText !== undefined || body?.lines || body?.recalculate) {
      const parsed = body?.lines?.length
        ? body.lines
        : body?.rawText
          ? parseRecipeText(body.rawText)
          : existing.lines.map((l) => ({
              ingredientName: l.ingredientName,
              quantity: l.quantity,
              unit: l.unit,
            }));
      const costed = await costRecipeLines(parsed);
      totalCost = sumLineCosts(costed);
      linesPayload = costed.map((line) => ({
        ingredientName: line.ingredientName,
        quantity: line.quantity,
        unit: line.unit,
        ingredientProductId: line.ingredientProductId,
        vendor: line.vendor,
        costPerPound: line.costPerPound,
        lineCost: line.lineCost,
        matchNote: line.matchNote,
      })) as typeof linesPayload;
    }

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      {
        ...(body?.name !== undefined && { name: body.name.trim() }),
        ...(body?.rawText !== undefined && { rawText: body.rawText }),
        lines: linesPayload,
        totalCost,
      },
      { new: true },
    ).lean();

    return jsonOk(recipe);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update recipe", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const recipe = await Recipe.findByIdAndDelete(id);
    if (!recipe) return jsonError("Recipe not found", 404);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete recipe", 500);
  }
}
