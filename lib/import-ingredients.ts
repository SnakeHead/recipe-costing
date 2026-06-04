import { IngredientProduct } from "@/lib/models/IngredientProduct";
import type { VendorSpreadsheetRow } from "./parse-vendor-spreadsheet";

export async function upsertIngredientRows(rows: VendorSpreadsheetRow[]) {
  let created = 0;
  let updated = 0;
  const failures: Array<{
    name: string;
    vendor: string;
    brand: string;
    message: string;
  }> = [];

  for (const row of rows) {
    try {
      const filter = {
        name: row.name,
        vendor: row.vendor,
        brand: row.brand,
      };

      const existing = await IngredientProduct.findOne(filter);

      await IngredientProduct.findOneAndUpdate(
        filter,
        {
          name: row.name,
          vendor: row.vendor,
          brand: row.brand,
          unitsPerPack: row.unitsPerPack,
          weightPerUnit: row.weightPerUnit,
          weightUnit: row.weightUnit,
          packPrice: row.packPrice,
          sku: row.sku ?? "",
          notes: row.notes ?? "",
        },
        { upsert: true, new: true, runValidators: true },
      );

      if (existing) updated++;
      else created++;
    } catch (e) {
      failures.push({
        name: row.name,
        vendor: row.vendor,
        brand: row.brand,
        message: e instanceof Error ? e.message : "Import failed",
      });
    }
  }

  return { created, updated, failures };
}
