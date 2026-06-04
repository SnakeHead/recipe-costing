/** Extract a numeric amount from unit size for cost-per-pound math (e.g. "10", "10#"). */
export function parseUnitSizeNumeric(unitSize: string): number | null {
  const trimmed = unitSize.trim();
  if (!trimmed) return null;

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  if (/^\d+(?:\.\d+)?#$/.test(trimmed)) {
    return parseFloat(trimmed.replace("#", ""));
  }

  // Descriptive sizes (#10 can, etc.) are stored as-is — no automatic $/lb
  return null;
}

export function formatPackLine(
  unitsPerPack: number,
  unitSize: string,
  weightUnit: string,
): string {
  const size = unitSize.trim();
  if (!size) return `${unitsPerPack} per pack`;

  const hasLettersOrHash = /[#a-zA-Z]/.test(size);
  const unitSuffix =
    weightUnit && !hasLettersOrHash && !size.toLowerCase().includes(weightUnit)
      ? ` ${weightUnit}`
      : "";

  return `${unitsPerPack} × ${size}${unitSuffix}`.trim();
}
