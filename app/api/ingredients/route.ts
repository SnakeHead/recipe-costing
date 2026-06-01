import { connectDB } from "@/lib/mongodb";
import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  try {
    await connectDB();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { vendor: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const ingredients = await IngredientProduct.find(filter)
      .sort({ name: 1, vendor: 1 })
      .lean();
    return jsonOk(ingredients);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to load ingredients",
      500,
    );
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    name?: string;
    vendor?: string;
    unitsPerPack?: number;
    weightPerUnit?: number;
    weightUnit?: "lb" | "oz" | "kg" | "g";
    packPrice?: number;
    sku?: string;
    notes?: string;
  }>(request);

  if (!body?.name?.trim() || !body?.vendor?.trim()) {
    return jsonError("Ingredient name and vendor are required");
  }
  if (
    body.unitsPerPack == null ||
    body.weightPerUnit == null ||
    body.packPrice == null
  ) {
    return jsonError("Pack size and price are required");
  }

  try {
    await connectDB();
    const ingredient = await IngredientProduct.create({
      name: body.name.trim(),
      vendor: body.vendor.trim(),
      unitsPerPack: body.unitsPerPack,
      weightPerUnit: body.weightPerUnit,
      weightUnit: body.weightUnit ?? "lb",
      packPrice: body.packPrice,
      sku: body.sku?.trim() ?? "",
      notes: body.notes?.trim() ?? "",
    });
    return jsonOk(ingredient, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create ingredient";
    if (message.includes("duplicate key")) {
      return jsonError("This ingredient already exists for that vendor");
    }
    return jsonError(message, 500);
  }
}
