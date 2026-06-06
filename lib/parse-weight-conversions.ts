import * as XLSX from "xlsx";
import { normalizeVolumeUnit } from "./recipe-units";

export interface ParsedWeightConversion {
  ingredientName: string;
  measureQuantity: number;
  measureUnit: string;
  pounds: number;
}

export interface ParseWeightConversionResult {
  rows: ParsedWeightConversion[];
  errors: Array<{ row: number; message: string }>;
  skipped: number;
}

/** Parse "1 Gal", "#10 Can", "18 oz", "1 Qt." into quantity + unit. */
export function parseMeasureAmount(raw: string): {
  measureQuantity: number;
  measureUnit: string;
} | null {
  const text = raw.trim();
  if (!text) return null;

  const hashCan = text.match(/^#(\d+(?:\.\d+)?)\s*can$/i);
  if (hashCan) {
    const unit = normalizeVolumeUnit("can");
    if (!unit) return null;
    return { measureQuantity: parseFloat(hashCan[1]), measureUnit: unit };
  }

  const match = text.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z.#]+)\.?$/);
  if (!match) return null;

  const measureQuantity = parseFloat(match[1]);
  const measureUnit = normalizeVolumeUnit(match[2].replace(/#/g, ""));
  if (!measureUnit || !Number.isFinite(measureQuantity)) return null;

  return { measureQuantity, measureUnit };
}

export function parseWeightConversionSpreadsheet(
  buffer: Buffer,
): ParseWeightConversionResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows: ParsedWeightConversion[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  let skipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const grid = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: "",
    });

    let headerRow = -1;
    for (let i = 0; i < Math.min(grid.length, 10); i++) {
      const row = grid[i].map((cell) => String(cell).trim().toLowerCase());
      if (row.includes("ingredient") && row.includes("pounds")) {
        headerRow = i;
        break;
      }
    }
    if (headerRow < 0) continue;

    for (let i = headerRow + 1; i < grid.length; i++) {
      const row = grid[i];
      const amountRaw = String(row[0] ?? "").trim();
      const ingredientName = String(row[1] ?? "").trim();
      const poundsRaw = row[2];

      if (!amountRaw && !ingredientName) continue;
      if (
        amountRaw.toLowerCase().includes("other conversion") ||
        ingredientName.toLowerCase().includes("other conversion")
      ) {
        skipped++;
        continue;
      }

      if (!ingredientName) {
        skipped++;
        continue;
      }

      const measure = parseMeasureAmount(amountRaw);
      if (!measure) {
        if (amountRaw) {
          errors.push({
            row: i + 1,
            message: `Could not parse amount "${amountRaw}" for ${ingredientName}`,
          });
        } else {
          skipped++;
        }
        continue;
      }

      const pounds =
        typeof poundsRaw === "number"
          ? poundsRaw
          : parseFloat(String(poundsRaw).replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(pounds) || pounds <= 0) {
        skipped++;
        continue;
      }

      rows.push({
        ingredientName,
        measureQuantity: measure.measureQuantity,
        measureUnit: measure.measureUnit,
        pounds,
      });
    }
  }

  return { rows, errors, skipped };
}
