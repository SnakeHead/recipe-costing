/** Build the MongoDB filter used to upsert an ingredient product. */
export function buildIngredientUpsertFilter(input: {
  name: string;
  vendor: string;
  brand?: string;
  sku?: string;
}): Record<string, string> {
  const sku = input.sku?.trim();
  if (sku) {
    return { vendor: input.vendor.trim(), sku };
  }
  return {
    name: input.name.trim(),
    vendor: input.vendor.trim(),
    brand: (input.brand ?? "").trim(),
  };
}
