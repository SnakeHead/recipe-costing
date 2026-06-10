import { connectDB } from "@/lib/mongodb";
import { CapProduct } from "@/lib/models/CapProduct";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import type { CapMaterialType } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const cap = await CapProduct.findById(id).lean();
    if (!cap) return jsonError("Cap not found", 404);
    return jsonOk(cap);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load cap", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await parseJsonBody<{
    name?: string;
    vendor?: string;
    fitsContainerName?: string;
    fitsContainerSize?: string;
    color?: string;
    materialType?: CapMaterialType;
    priceEach?: number;
    minOrderQty?: number;
    sku?: string;
    notes?: string;
  }>(request);

  try {
    await connectDB();
    const cap = await CapProduct.findByIdAndUpdate(
      id,
      {
        ...(body?.name !== undefined && { name: body.name.trim() }),
        ...(body?.vendor !== undefined && { vendor: body.vendor.trim() }),
        ...(body?.fitsContainerName !== undefined && {
          fitsContainerName: body.fitsContainerName.trim(),
        }),
        ...(body?.fitsContainerSize !== undefined && {
          fitsContainerSize: body.fitsContainerSize.trim(),
        }),
        ...(body?.color !== undefined && { color: body.color.trim() }),
        ...(body?.materialType !== undefined && {
          materialType: body.materialType,
        }),
        ...(body?.priceEach !== undefined && { priceEach: body.priceEach }),
        ...(body?.minOrderQty !== undefined && {
          minOrderQty: body.minOrderQty,
        }),
        ...(body?.sku !== undefined && { sku: body.sku.trim() }),
        ...(body?.notes !== undefined && { notes: body.notes.trim() }),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!cap) return jsonError("Cap not found", 404);
    return jsonOk(cap);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update cap", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const cap = await CapProduct.findByIdAndDelete(id);
    if (!cap) return jsonError("Cap not found", 404);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete cap", 500);
  }
}
