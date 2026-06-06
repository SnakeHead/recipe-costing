import { IngredientWeightConversion } from "@/lib/models/IngredientWeightConversion";
import type { ParsedWeightConversion } from "@/lib/parse-weight-conversions";

export async function upsertWeightConversionRows(
  rows: ParsedWeightConversion[],
): Promise<{ created: number; updated: number; failures: string[] }> {
  let created = 0;
  let updated = 0;
  const failures: string[] = [];

  for (const row of rows) {
    try {
      const existing = await IngredientWeightConversion.findOne({
        ingredientName: row.ingredientName,
        measureQuantity: row.measureQuantity,
        measureUnit: row.measureUnit,
      });

      await IngredientWeightConversion.findOneAndUpdate(
        {
          ingredientName: row.ingredientName,
          measureQuantity: row.measureQuantity,
          measureUnit: row.measureUnit,
        },
        {
          $set: {
            pounds: row.pounds,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (existing) updated++;
      else created++;
    } catch (e) {
      failures.push(
        `${row.ingredientName} (${row.measureQuantity} ${row.measureUnit}): ${
          e instanceof Error ? e.message : "save failed"
        }`,
      );
    }
  }

  return { created, updated, failures };
}
