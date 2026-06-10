import { connectDB } from "@/lib/mongodb";
import { ContainerProduct } from "@/lib/models/ContainerProduct";
import { buildContainerUpsertFilter } from "@/lib/packaging-keys";
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
            { size: { $regex: q, $options: "i" } },
            { sku: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const containers = await ContainerProduct.find(filter)
      .sort({ name: 1, size: 1, priceEach: 1, vendor: 1 })
      .lean();
    return jsonOk(containers);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to load containers",
      500,
    );
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    name?: string;
    vendor?: string;
    size?: string;
    priceEach?: number;
    minOrderQty?: number;
    sku?: string;
    notes?: string;
  }>(request);

  if (!body?.name?.trim() || !body?.vendor?.trim() || !body?.size?.trim()) {
    return jsonError("Container name, vendor, and size are required");
  }
  if (body.priceEach == null) {
    return jsonError("Price each is required");
  }

  try {
    await connectDB();
    const payload = {
      name: body.name.trim(),
      vendor: body.vendor.trim(),
      size: body.size.trim(),
      priceEach: body.priceEach,
      minOrderQty: body.minOrderQty ?? 1,
      sku: body.sku?.trim() ?? "",
      notes: body.notes?.trim() ?? "",
    };

    const filter = buildContainerUpsertFilter(payload);
    const container = await ContainerProduct.findOneAndUpdate(filter, payload, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    return jsonOk(container, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create container";
    if (message.includes("duplicate key")) {
      return jsonError(
        "A container with this vendor and SKU (or name + size) already exists",
      );
    }
    return jsonError(message, 500);
  }
}
