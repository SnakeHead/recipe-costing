import { connectDB } from "@/lib/mongodb";
import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const ingredient = await IngredientProduct.findById(id).lean();
    if (!ingredient) return jsonError("Ingredient not found", 404);
    return jsonOk(ingredient);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to load ingredient",
      500,
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await parseJsonBody<{
    name?: string;
    vendor?: string;
    brand?: string;
    unitsPerPack?: number;
    weightPerUnit?: number;
    weightUnit?: "lb" | "oz" | "kg" | "g";
    packPrice?: number;
    sku?: string;
    notes?: string;
  }>(request);

  try {
    await connectDB();
    const ingredient = await IngredientProduct.findByIdAndUpdate(
      id,
      {
        ...(body?.name !== undefined && { name: body.name.trim() }),
        ...(body?.vendor !== undefined && { vendor: body.vendor.trim() }),
        ...(body?.brand !== undefined && { brand: body.brand.trim() }),
        ...(body?.unitsPerPack !== undefined && {
          unitsPerPack: body.unitsPerPack,
        }),
        ...(body?.weightPerUnit !== undefined && {
          weightPerUnit: body.weightPerUnit,
        }),
        ...(body?.weightUnit !== undefined && { weightUnit: body.weightUnit }),
        ...(body?.packPrice !== undefined && { packPrice: body.packPrice }),
        ...(body?.sku !== undefined && { sku: body.sku.trim() }),
        ...(body?.notes !== undefined && { notes: body.notes.trim() }),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!ingredient) return jsonError("Ingredient not found", 404);
    return jsonOk(ingredient);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to update ingredient",
      500,
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const ingredient = await IngredientProduct.findByIdAndDelete(id);
    if (!ingredient) return jsonError("Ingredient not found", 404);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to delete ingredient",
      500,
    );
  }
}
