import type { ContainerCaseSize } from "@/lib/types";

export function unitsPerCaseForSize(
  caseSize: ContainerCaseSize,
  bulkCount: number,
): number {
  if (caseSize === "6pk") return 6;
  if (caseSize === "12pk") return 12;
  return bulkCount;
}

export function calculateContainerPriceEach(
  casePrice: number,
  unitsPerCase: number,
): number | null {
  if (!unitsPerCase || unitsPerCase <= 0) return null;
  return casePrice / unitsPerCase;
}

export function caseSizeLabel(caseSize: ContainerCaseSize): string {
  if (caseSize === "bulk") return "Bulk";
  return caseSize;
}

export function buildContainerPricingFields(input: {
  caseSize: ContainerCaseSize;
  casePrice: number;
  unitsPerCase?: number;
}): {
  caseSize: ContainerCaseSize;
  casePrice: number;
  unitsPerCase: number;
  priceEach: number;
} {
  const units = unitsPerCaseForSize(
    input.caseSize,
    input.unitsPerCase ?? 1,
  );
  const priceEach = calculateContainerPriceEach(input.casePrice, units);
  if (priceEach === null) {
    throw new Error("Case price and units per case must be greater than zero");
  }
  return {
    caseSize: input.caseSize,
    casePrice: input.casePrice,
    unitsPerCase: units,
    priceEach,
  };
}
