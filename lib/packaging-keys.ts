/** Build the MongoDB filter used to upsert a container product. */
export function buildContainerUpsertFilter(input: {
  name: string;
  vendor: string;
  size: string;
  materialType: string;
  caseSize: string;
  sku?: string;
}): Record<string, string> {
  const sku = input.sku?.trim();
  if (sku) {
    return { vendor: input.vendor.trim(), sku };
  }
  return {
    name: input.name.trim(),
    vendor: input.vendor.trim(),
    size: input.size.trim(),
    materialType: input.materialType.trim(),
    caseSize: input.caseSize.trim(),
  };
}

/** Build the MongoDB filter used to upsert a cap/lid product. */
export function buildCapUpsertFilter(input: {
  name: string;
  vendor: string;
  fitsContainerName: string;
  fitsContainerSize: string;
  color: string;
  materialType: string;
  sku?: string;
}): Record<string, string> {
  const sku = input.sku?.trim();
  if (sku) {
    return { vendor: input.vendor.trim(), sku };
  }
  return {
    name: input.name.trim(),
    vendor: input.vendor.trim(),
    fitsContainerName: input.fitsContainerName.trim(),
    fitsContainerSize: input.fitsContainerSize.trim(),
    color: input.color.trim(),
    materialType: input.materialType.trim(),
  };
}
