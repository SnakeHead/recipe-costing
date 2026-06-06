import { connectDB } from "@/lib/mongodb";
import { IngredientWeightConversion } from "@/lib/models/IngredientWeightConversion";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { normalizeWeightConversionInput } from "@/lib/weight-conversion";

export async function GET() {
  try {
    await connectDB();
    const rows = await IngredientWeightConversion.find()
      .sort({ ingredientName: 1, measureUnit: 1 })
      .lean();
    return jsonOk({
      count: rows.length,
      rows: rows.map((row) => ({
        _id: String(row._id),
        ingredientName: row.ingredientName,
        measureQuantity: row.measureQuantity,
        measureUnit: row.measureUnit,
        pounds: row.pounds,
      })),
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to load conversions",
      500,
    );
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    ingredientName?: string;
    measureQuantity?: number;
    measureUnit?: string;
    pounds?: number;
  }>(request);

  const normalized = normalizeWeightConversionInput({
    ingredientName: body?.ingredientName,
    measureQuantity: body?.measureQuantity,
    measureUnit: body?.measureUnit,
    pounds: body?.pounds,
  });

  if (!("value" in normalized)) {
    return jsonError(normalized.error);
  }

  try {
    await connectDB();
    const row = await IngredientWeightConversion.create(normalized.value);
    return jsonOk(
      {
        _id: String(row._id),
        ingredientName: row.ingredientName,
        measureQuantity: row.measureQuantity,
        measureUnit: row.measureUnit,
        pounds: row.pounds,
      },
      201,
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes("duplicate key")) {
      return jsonError(
        "A conversion already exists for this ingredient and measure",
        409,
      );
    }
    return jsonError(
      e instanceof Error ? e.message : "Failed to create conversion",
      500,
    );
  }
}
