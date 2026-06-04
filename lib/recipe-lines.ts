import type { ParsedRecipeLine } from "./types";
import { normalizeUnit } from "./units";

export interface ManualRecipeLine {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
}

export function createManualLine(
  partial?: Partial<ManualRecipeLine>,
): ManualRecipeLine {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    ingredientName: partial?.ingredientName ?? "",
    quantity: partial?.quantity ?? "",
    unit: partial?.unit ?? "lb",
  };
}

export function manualLinesFromParsed(
  lines: ParsedRecipeLine[],
): ManualRecipeLine[] {
  return lines.map((line) =>
    createManualLine({
      ingredientName: line.ingredientName,
      quantity: String(line.quantity),
      unit: line.unit,
    }),
  );
}

export function manualLinesToParsed(
  lines: ManualRecipeLine[],
): ParsedRecipeLine[] | null {
  const parsed: ParsedRecipeLine[] = [];

  for (const line of lines) {
    const ingredientName = line.ingredientName.trim();
    const quantity = parseFloat(line.quantity);
    const unit = line.unit.trim() || "lb";

    if (!ingredientName) continue;
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    if (!normalizeUnit(unit)) return null;

    parsed.push({ ingredientName, quantity, unit });
  }

  return parsed.length > 0 ? parsed : null;
}

export function parsedLinesToRawText(lines: ParsedRecipeLine[]): string {
  return lines
    .map((line) => `${line.ingredientName}, ${line.quantity} ${line.unit}`)
    .join("\n");
}
