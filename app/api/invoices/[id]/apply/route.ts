import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/Invoice";
import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await parseJsonBody<{
    lineIndexes?: number[];
    overrides?: Array<{
      index: number;
      name?: string;
      vendor?: string;
      unitsPerPack?: number;
      weightPerUnit?: number;
      weightUnit?: "lb" | "oz" | "kg" | "g";
      packPrice?: number;
    }>;
  }>(request);

  try {
    await connectDB();
    const invoice = await Invoice.findById(id);
    if (!invoice) return jsonError("Invoice not found", 404);

    const indexes =
      body?.lineIndexes ??
      invoice.extractedLines.map((_, i) => i);

    const overrides = new Map(
      (body?.overrides ?? []).map((o) => [o.index, o]),
    );

    const created = [];

    for (const index of indexes) {
      const line = invoice.extractedLines[index];
      if (!line || line.applied) continue;

      const override = overrides.get(index);
      const name = override?.name ?? line.productName;
      const vendor =
        override?.vendor ?? line.vendor ?? invoice.vendor ?? "Unknown vendor";
      const unitsPerPack = override?.unitsPerPack ?? line.unitsPerPack;
      const weightPerUnit = override?.weightPerUnit ?? line.weightPerUnit;
      const weightUnit = override?.weightUnit ?? line.weightUnit ?? "lb";
      const packPrice =
        override?.packPrice ?? line.packPrice ?? line.lineTotal;

      if (
        !name ||
        unitsPerPack == null ||
        weightPerUnit == null ||
        packPrice == null
      ) {
        continue;
      }

      const ingredient = await IngredientProduct.findOneAndUpdate(
        { name: name.trim(), vendor: vendor.trim() },
        {
          name: name.trim(),
          vendor: vendor.trim(),
          unitsPerPack,
          weightPerUnit,
          weightUnit,
          packPrice,
        },
        { upsert: true, new: true, runValidators: true },
      );

      invoice.extractedLines[index].applied = true;
      created.push(ingredient);
    }

    await invoice.save();
    return jsonOk({ created, invoice });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to apply invoice lines",
      500,
    );
  }
}
