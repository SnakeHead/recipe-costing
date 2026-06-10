import { connectDB } from "@/lib/mongodb";
import { ContainerProduct } from "@/lib/models/ContainerProduct";
import { buildContainerPricingFields } from "@/lib/container-pricing";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import type { ContainerCaseSize, ContainerMaterialType } from "@/lib/types";

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
    materialType?: ContainerMaterialType;
    caseSize?: ContainerCaseSize;
    casePrice?: number;
    unitsPerCase?: number;
    minOrderQty?: number;
    sku?: string;
    notes?: string;
  }>(request);

  try {
    await connectDB();
    const existing = await ContainerProduct.findById(id);
    if (!existing) return jsonError("Container not found", 404);

    if (body?.name !== undefined) existing.name = body.name.trim();
    if (body?.vendor !== undefined) existing.vendor = body.vendor.trim();
    if (body?.size !== undefined) existing.size = body.size.trim();
    if (body?.materialType !== undefined) {
      existing.materialType = body.materialType;
    }
    if (body?.minOrderQty !== undefined) {
      existing.minOrderQty = body.minOrderQty;
    }
    if (body?.sku !== undefined) existing.sku = body.sku.trim();
    if (body?.notes !== undefined) existing.notes = body.notes.trim();

    const pricingTouched =
      body?.caseSize !== undefined ||
      body?.casePrice !== undefined ||
      body?.unitsPerCase !== undefined;

    if (pricingTouched) {
      const pricing = buildContainerPricingFields({
        caseSize: body?.caseSize ?? existing.caseSize ?? "bulk",
        casePrice: body?.casePrice ?? existing.casePrice ?? existing.priceEach,
        unitsPerCase: body?.unitsPerCase ?? existing.unitsPerCase ?? 1,
      });
      existing.caseSize = pricing.caseSize;
      existing.casePrice = pricing.casePrice;
      existing.unitsPerCase = pricing.unitsPerCase;
      existing.priceEach = pricing.priceEach;
    }

    await existing.save();
    return jsonOk(existing.toObject());
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
