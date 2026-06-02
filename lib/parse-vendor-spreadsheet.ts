import * as XLSX from "xlsx";
import { normalizeUnit } from "./units";
import type { WeightUnit } from "./types";

export interface VendorSpreadsheetRow {
  name: string;
  vendor: string;
  unitsPerPack: number;
  weightPerUnit: number;
  weightUnit: WeightUnit;
  packPrice: number;
  sku?: string;
  notes?: string;
}

export interface SpreadsheetParseResult {
  rows: VendorSpreadsheetRow[];
  errors: Array<{ row: number; message: string }>;
  skipped: number;
}

type FieldKey =
  | "name"
  | "vendor"
  | "unitsPerPack"
  | "weightPerUnit"
  | "weightUnit"
  | "packPrice"
  | "sku"
  | "notes"
  | "packSize";

const HEADER_ALIASES: Record<string, FieldKey> = {
  name: "name",
  ingredient: "name",
  "ingredient name": "name",
  product: "name",
  "product name": "name",
  item: "name",
  description: "name",
  vendor: "vendor",
  supplier: "vendor",
  distributor: "vendor",
  "units per pack": "unitsPerPack",
  unitsperpack: "unitsPerPack",
  units: "unitsPerPack",
  "pack units": "unitsPerPack",
  "case count": "unitsPerPack",
  count: "unitsPerPack",
  "weight per unit": "weightPerUnit",
  weightperunit: "weightPerUnit",
  weight: "weightPerUnit",
  "unit weight": "weightPerUnit",
  size: "weightPerUnit",
  "weight unit": "weightUnit",
  weightunit: "weightUnit",
  unit: "weightUnit",
  uom: "weightUnit",
  "pack price": "packPrice",
  packprice: "packPrice",
  price: "packPrice",
  "case price": "packPrice",
  cost: "packPrice",
  "pack size": "packSize",
  packsize: "packSize",
  "case pack": "packSize",
  sku: "sku",
  "item number": "sku",
  "item #": "sku",
  "product code": "sku",
  notes: "notes",
  note: "notes",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[#]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const str = String(value ?? "").trim();
  if (!str) return null;
  const cleaned = str.replace(/[$,]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

/** Parses shorthand like "6/10#" or "6x10 lb" into units and weight. */
function parsePackSize(value: unknown): {
  unitsPerPack: number;
  weightPerUnit: number;
  weightUnit: WeightUnit;
} | null {
  const str = String(value ?? "").trim().toLowerCase();
  if (!str) return null;

  const slashMatch = str.match(
    /^(\d+(?:\.\d+)?)\s*[/x]\s*(\d+(?:\.\d+)?)\s*(lb|lbs|oz|kg|g)?$/,
  );
  if (slashMatch) {
    const unit = normalizeUnit(slashMatch[3] ?? "lb") ?? "lb";
    return {
      unitsPerPack: parseFloat(slashMatch[1]),
      weightPerUnit: parseFloat(slashMatch[2]),
      weightUnit: unit,
    };
  }

  return null;
}

function mapHeaders(headerRow: unknown[]): Map<FieldKey, number> {
  const mapping = new Map<FieldKey, number>();

  headerRow.forEach((cell, index) => {
    const key = HEADER_ALIASES[normalizeHeader(cell)];
    if (key && !mapping.has(key)) mapping.set(key, index);
  });

  return mapping;
}

export function parseVendorSpreadsheet(
  buffer: Buffer,
  defaultVendor = "",
): SpreadsheetParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: [{ row: 0, message: "Workbook has no sheets" }], skipped: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (grid.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "Sheet is empty" }], skipped: 0 };
  }

  let headerIndex = -1;
  let columnMap = new Map<FieldKey, number>();

  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    const candidate = mapHeaders(grid[i]);
    if (candidate.has("name") && (candidate.has("packPrice") || candidate.has("packSize"))) {
      headerIndex = i;
      columnMap = candidate;
      break;
    }
    if (
      candidate.has("name") &&
      candidate.has("unitsPerPack") &&
      candidate.has("weightPerUnit")
    ) {
      headerIndex = i;
      columnMap = candidate;
      break;
    }
  }

  if (headerIndex < 0) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message:
            'Could not find a header row. Required columns include "Ingredient" (or Name) and "Pack Price" (or Units per pack + Weight per unit).',
        },
      ],
      skipped: 0,
    };
  }

  const rows: VendorSpreadsheetRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  let skipped = 0;

  const getCell = (row: unknown[], field: FieldKey) => {
    const index = columnMap.get(field);
    if (index === undefined) return "";
    return row[index];
  };

  for (let i = headerIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    const rowNumber = i + 1;

    if (!row || row.every((cell) => String(cell ?? "").trim() === "")) {
      skipped++;
      continue;
    }

    const name = String(getCell(row, "name")).trim();
    if (!name) {
      skipped++;
      continue;
    }

    const vendor =
      String(getCell(row, "vendor")).trim() || defaultVendor.trim();
    if (!vendor) {
      errors.push({ row: rowNumber, message: `Missing vendor for "${name}"` });
      continue;
    }

    let unitsPerPack = parseNumber(getCell(row, "unitsPerPack"));
    let weightPerUnit = parseNumber(getCell(row, "weightPerUnit"));
    let weightUnit =
      normalizeUnit(String(getCell(row, "weightUnit")).trim()) ?? "lb";

    const packSize = getCell(row, "packSize");
    if (packSize && (unitsPerPack == null || weightPerUnit == null)) {
      const parsed = parsePackSize(packSize);
      if (parsed) {
        unitsPerPack = parsed.unitsPerPack;
        weightPerUnit = parsed.weightPerUnit;
        weightUnit = parsed.weightUnit;
      }
    }

    const packPrice = parseNumber(getCell(row, "packPrice"));
    if (unitsPerPack == null || weightPerUnit == null || packPrice == null) {
      errors.push({
        row: rowNumber,
        message: `Incomplete pricing for "${name}" (need pack size and price)`,
      });
      continue;
    }

    rows.push({
      name,
      vendor,
      unitsPerPack,
      weightPerUnit,
      weightUnit,
      packPrice,
      sku: String(getCell(row, "sku")).trim() || undefined,
      notes: String(getCell(row, "notes")).trim() || undefined,
    });
  }

  return { rows, errors, skipped };
}

export function buildVendorSpreadsheetTemplate(): Buffer {
  const data = [
    [
      "Ingredient",
      "Vendor",
      "Units per pack",
      "Weight per unit",
      "Weight unit",
      "Pack price",
      "Pack size",
      "SKU",
      "Notes",
    ],
    [
      "Ketchup",
      "Ben E. Keith",
      6,
      10,
      "lb",
      75.23,
      "6/10#",
      "KECH-001",
      "Example row",
    ],
    [
      "Mayonnaise",
      "Ben E. Keith",
      4,
      5,
      "lb",
      42.5,
      "",
      "",
      "",
    ],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Vendor pricing");
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}
