import type { ParsedRecipeLine } from "./types";
import { normalizeUnit } from "./units";

const LINE_PATTERN =
  /^\s*(?:(.+?)\s*[-–:]\s*)?(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)?\s+(.+?)\s*$|^\s*(.+?)\s*[-–:]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)?\s*$|^\s*(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)\s+(.+?)\s*$/i;

export function parseRecipeText(text: string): ParsedRecipeLine[] {
  const lines: ParsedRecipeLine[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parsed = parseLine(line);
    if (parsed) lines.push(parsed);
  }

  return lines;
}

function parseLine(line: string): ParsedRecipeLine | null {
  const tabParts = line.split("\t").map((p) => p.trim());
  if (tabParts.length >= 2) {
    const qtyUnit = tabParts[1].match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)?$/);
    if (qtyUnit) {
      const unit = qtyUnit[2] ?? "lb";
      if (normalizeUnit(unit)) {
        return {
          ingredientName: tabParts[0],
          quantity: parseFloat(qtyUnit[1]),
          unit,
        };
      }
    }
  }

  const commaParts = line.split(",").map((p) => p.trim());
  if (commaParts.length >= 2) {
    const qtyUnit = commaParts[1].match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)?$/i);
    if (qtyUnit) {
      const unit = qtyUnit[2] ?? "lb";
      if (normalizeUnit(unit)) {
        return {
          ingredientName: commaParts[0],
          quantity: parseFloat(qtyUnit[1]),
          unit,
        };
      }
    }
  }

  const match = line.match(LINE_PATTERN);
  if (!match) return null;

  if (match[8]) {
    const unit = match[9] ?? "lb";
    if (!normalizeUnit(unit)) return null;
    return {
      quantity: parseFloat(match[8]),
      unit,
      ingredientName: match[10].trim(),
    };
  }

  if (match[5]) {
    const unit = match[7] ?? "lb";
    if (!normalizeUnit(unit)) return null;
    return {
      ingredientName: match[5].trim(),
      quantity: parseFloat(match[6]),
      unit,
    };
  }

  const unit = match[3] ?? "lb";
  if (!normalizeUnit(unit)) return null;
  return {
    ingredientName: (match[1] ?? match[4]).trim(),
    quantity: parseFloat(match[2]),
    unit,
  };
}
