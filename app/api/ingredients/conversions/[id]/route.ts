import { connectDB } from "@/lib/mongodb";
import { IngredientWeightConversion } from "@/lib/models/IngredientWeightConversion";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { normalizeWeightConversionInput } from "@/lib/weight-conversion";

type Params = { params: Promise<{ id: string }> };

function serialize(row: {
  _id: unknown;
  ingredientName: string;
  measureQuantity: number;
  measureUnit: string;
  pounds: number;
}) {
  return {
    _id: String(row._id),
    ingredientName: row.ingredientName,
    measureQuantity: row.measureQuantity,
    measureUnit: row.measureUnit,
    pounds: row.pounds,
  };
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const row = await IngredientWeightConversion.findById(id).lean();
    if (!row) return jsonError("Conversion not found", 404);
    return jsonOk(serialize(row));
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to load conversion",
      500,
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await parseJsonBody<{
    ingredientName?: string;
    measureQuantity?: number;
    measureUnit?: string;
    pounds?: number;
  }>(request);

  try {
    await connectDB();
    const existing = await IngredientWeightConversion.findById(id).lean();
    if (!existing) return jsonError("Conversion not found", 404);

    const normalized = normalizeWeightConversionInput({
      ingredientName: body?.ingredientName ?? existing.ingredientName,
      measureQuantity: body?.measureQuantity ?? existing.measureQuantity,
      measureUnit: body?.measureUnit ?? existing.measureUnit,
      pounds: body?.pounds ?? existing.pounds,
    });

    if (!("value" in normalized)) {
      return jsonError(normalized.error);
    }

    const row = await IngredientWeightConversion.findByIdAndUpdate(
      id,
      normalized.value,
      { new: true, runValidators: true },
    ).lean();

    if (!row) return jsonError("Conversion not found", 404);
    return jsonOk(serialize(row));
  } catch (e) {
    if (e instanceof Error && e.message.includes("duplicate key")) {
      return jsonError(
        "A conversion already exists for this ingredient and measure",
        409,
      );
    }
    return jsonError(
      e instanceof Error ? e.message : "Failed to update conversion",
      500,
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const row = await IngredientWeightConversion.findByIdAndDelete(id);
    if (!row) return jsonError("Conversion not found", 404);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to delete conversion",
      500,
    );
  }
}
