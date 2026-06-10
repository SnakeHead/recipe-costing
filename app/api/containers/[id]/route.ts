import { connectDB } from "@/lib/mongodb";
import { ContainerProduct } from "@/lib/models/ContainerProduct";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const container = await ContainerProduct.findById(id).lean();
    if (!container) return jsonError("Container not found", 404);
    return jsonOk(container);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to load container",
      500,
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await parseJsonBody<{
    name?: string;
    vendor?: string;
    size?: string;
    priceEach?: number;
    minOrderQty?: number;
    sku?: string;
    notes?: string;
  }>(request);

  try {
    await connectDB();
    const container = await ContainerProduct.findByIdAndUpdate(
      id,
      {
        ...(body?.name !== undefined && { name: body.name.trim() }),
        ...(body?.vendor !== undefined && { vendor: body.vendor.trim() }),
        ...(body?.size !== undefined && { size: body.size.trim() }),
        ...(body?.priceEach !== undefined && { priceEach: body.priceEach }),
        ...(body?.minOrderQty !== undefined && {
          minOrderQty: body.minOrderQty,
        }),
        ...(body?.sku !== undefined && { sku: body.sku.trim() }),
        ...(body?.notes !== undefined && { notes: body.notes.trim() }),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!container) return jsonError("Container not found", 404);
    return jsonOk(container);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to update container",
      500,
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const container = await ContainerProduct.findByIdAndDelete(id);
    if (!container) return jsonError("Container not found", 404);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to delete container",
      500,
    );
  }
}
