import { IngredientProduct } from "@/lib/models/IngredientProduct";

let synced = false;

/** Drops legacy indexes and applies current schema indexes (once per process). */
export async function syncIngredientIndexes(): Promise<void> {
  if (synced) return;

  const collection = IngredientProduct.collection;
  const legacyIndexes = ["name_1_vendor_1", "name_1_vendor_1_brand_1"];

  for (const indexName of legacyIndexes) {
    try {
      await collection.dropIndex(indexName);
    } catch {
      // Index may not exist
    }
  }

  await IngredientProduct.syncIndexes();
  synced = true;
}
