import { connectDB } from "@/lib/mongodb";
import { IngredientWeightConversion } from "@/lib/models/IngredientWeightConversion";
import { jsonError, jsonOk } from "@/lib/api";

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
