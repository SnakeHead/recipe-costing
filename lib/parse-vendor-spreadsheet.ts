import * as XLSX from "xlsx";
import { normalizeUnit } from "./units";
import type { WeightUnit } from "./types";

export interface VendorSpreadsheetRow {
  name: string;
  vendor: string;
  brand: string;
  unitsPerPack: number;
  unitSize: string;
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
  | "brand"
  | "unitsPerPack"
  | "unitSize"
  | "weightUnit"
  | "packPrice"
  | "sku"
  | "notes"
  | "packSize";

/** Exact header text (lowercase) before normalization — avoids "Item #" becoming "item". */
const RAW_HEADER_ALIASES: Record<string, FieldKey> = {
  "item #": "sku",
  "item#": "sku",
};

const HEADER_ALIASES: Record<string, FieldKey> = {
  name: "name",
  ingredient: "name",
  "ingredient name": "name",
  "item name": "name",
  product: "name",
  "product name": "name",
  description: "name",
  vendor: "vendor",
  supplier: "vendor",
  distributor: "vendor",
  brand: "brand",
  manufacturer: "brand",
  pack: "unitsPerPack",
  "units per pack": "unitsPerPack",
  unitsperpack: "unitsPerPack",
  units: "unitsPerPack",
  "pack units": "unitsPerPack",
  "case count": "unitsPerPack",
  count: "unitsPerPack",
  "unit size": "unitSize",
  unitsize: "unitSize",
  size: "unitSize",
  "weight per unit": "unitSize",
  weightperunit: "unitSize",
  weight: "unitSize",
  "unit weight": "unitSize",
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

function resolveHeaderField(cell: unknown): FieldKey | undefined {
  const raw = String(cell ?? "").trim().toLowerCase();
  if (RAW_HEADER_ALIASES[raw]) return RAW_HEADER_ALIASES[raw];
  return HEADER_ALIASES[normalizeHeader(cell)];
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
  unitSize: string;
  weightUnit: WeightUnit;
} | null {
  const str = String(value ?? "").trim().toLowerCase();
  if (!str) return null;

  const slashMatch = str.match(
    /^(\d+(?:\.\d+)?)\s*[/x]\s*(\d+(?:\.\d+)?)\s*(lb|lbs|oz|kg|g)?$/,
  );
  if (slashMatch) {
    const unit = normalizeUnit(slashMatch[3] ?? "lb") ?? "lb";
    const sizePart = slashMatch[2];
    const unitPart = slashMatch[3];
    const unitSize = unitPart ? `${sizePart} ${unitPart}` : sizePart;
    return {
      unitsPerPack: parseFloat(slashMatch[1]),
      unitSize,
      weightUnit: unit,
    };
  }

  return null;
}

function mapHeaders(headerRow: unknown[]): Map<FieldKey, number> {
  const mapping = new Map<FieldKey, number>();

  headerRow.forEach((cell, index) => {
    const key = resolveHeaderField(cell);
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
    const hasVendorFormat =
      candidate.has("name") &&
      candidate.has("packPrice") &&
      candidate.has("unitsPerPack") &&
      candidate.has("unitSize");
    const hasPackSizeFormat =
      candidate.has("name") &&
      (candidate.has("packPrice") || candidate.has("packSize"));
    const hasLegacyFormat =
      candidate.has("name") &&
      candidate.has("unitsPerPack") &&
      candidate.has("unitSize");

    if (hasVendorFormat || hasPackSizeFormat || hasLegacyFormat) {
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
            'Could not find a header row. Expected: Item #, Pack, Size, Unit, Brand, Item Name, Price (or similar names).',
        },
      ],
      skipped: 0,
    };
  }

  if (!columnMap.has("vendor") && !defaultVendor.trim()) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message:
            "Set the distributor (vendor) on the import form — your file has no Vendor column.",
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
      errors.push({
        row: rowNumber,
        message: `Missing distributor for "${name}" — set the vendor on the import form`,
      });
      continue;
    }

    const brand = String(getCell(row, "brand")).trim();

    let unitsPerPack = parseNumber(getCell(row, "unitsPerPack"));
    let unitSize = String(getCell(row, "unitSize")).trim();
    let weightUnit =
      normalizeUnit(String(getCell(row, "weightUnit")).trim()) ?? "lb";

    const packSize = getCell(row, "packSize");
    if (packSize) {
      const packStr = String(packSize).trim();
      const parsed = parsePackSize(packStr);
      if (parsed) {
        if (unitsPerPack == null) unitsPerPack = parsed.unitsPerPack;
        if (!unitSize) unitSize = parsed.unitSize;
        weightUnit = parsed.weightUnit;
      } else if (!unitSize) {
        unitSize = packStr;
      }
    }

    const packPrice = parseNumber(getCell(row, "packPrice"));
    if (unitsPerPack == null || !unitSize || packPrice == null) {
      errors.push({
        row: rowNumber,
        message: `Incomplete pricing for "${name}" (need pack, unit size, and price)`,
      });
      continue;
    }

    rows.push({
      name,
      vendor,
      brand,
      unitsPerPack,
      unitSize,
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
    ["Item #", "Pack", "Size", "Unit", "Brand", "Item Name", "Price"],
    ["KECH-001", 6, 10, "lb", "Heinz", "Ketchup", 75.23],
    ["CAN-003", 6, "#10 can", "lb", "Del Monte", "Corn", 48.0],
    ["MAYO-002", 4, 5, "lb", "Hellmann's", "Mayonnaise", 42.5],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Vendor pricing");
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}
