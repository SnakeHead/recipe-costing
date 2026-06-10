import { connectDB } from "@/lib/mongodb";
import { CapProduct } from "@/lib/models/CapProduct";
import { buildCapUpsertFilter } from "@/lib/packaging-keys";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import type { CapMaterialType } from "@/lib/types";

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
            { fitsContainerName: { $regex: q, $options: "i" } },
            { fitsContainerSize: { $regex: q, $options: "i" } },
            { color: { $regex: q, $options: "i" } },
            { sku: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const caps = await CapProduct.find(filter)
      .sort({
        fitsContainerName: 1,
        fitsContainerSize: 1,
        color: 1,
        materialType: 1,
        priceEach: 1,
        vendor: 1,
      })
      .lean();
    return jsonOk(caps);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load caps", 500);
  }
}

export async function POST(request: Request) {
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

  if (
    !body?.name?.trim() ||
    !body?.vendor?.trim() ||
    !body?.fitsContainerName?.trim() ||
    !body?.fitsContainerSize?.trim() ||
    !body?.color?.trim() ||
    !body?.materialType
  ) {
    return jsonError(
      "Cap name, vendor, container, color, and material type are required",
    );
  }
  if (body.priceEach == null) {
    return jsonError("Price each is required");
  }

  try {
    await connectDB();
    const payload = {
      name: body.name.trim(),
      vendor: body.vendor.trim(),
      fitsContainerName: body.fitsContainerName.trim(),
      fitsContainerSize: body.fitsContainerSize.trim(),
      color: body.color.trim(),
      materialType: body.materialType,
      priceEach: body.priceEach,
      minOrderQty: body.minOrderQty ?? 1,
      sku: body.sku?.trim() ?? "",
      notes: body.notes?.trim() ?? "",
    };

    const filter = buildCapUpsertFilter(payload);
    const cap = await CapProduct.findOneAndUpdate(filter, payload, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    return jsonOk(cap, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create cap";
    if (message.includes("duplicate key")) {
      return jsonError(
        "A cap with this vendor and SKU (or matching details) already exists",
      );
    }
    return jsonError(message, 500);
  }
}
