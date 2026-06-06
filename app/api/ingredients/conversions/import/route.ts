import { connectDB } from "@/lib/mongodb";
import { jsonError, jsonOk } from "@/lib/api";
import { parseWeightConversionSpreadsheet } from "@/lib/parse-weight-conversions";
import { upsertWeightConversionRows } from "@/lib/import-weight-conversions";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const dryRun = form.get("dryRun") === "true";

    if (!(file instanceof File)) {
      return jsonError("Upload an Excel file (.xlsx or .xls)");
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return jsonError("File must be .xlsx or .xls");
    }

    if (file.size > MAX_FILE_BYTES) {
      return jsonError("File must be 5 MB or smaller");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseWeightConversionSpreadsheet(buffer);

    if (dryRun) {
      return jsonOk({
        dryRun: true,
        fileName: file.name,
        rows: parsed.rows,
        errors: parsed.errors,
        skipped: parsed.skipped,
        readyCount: parsed.rows.length,
      });
    }

    if (parsed.rows.length === 0) {
      return jsonError("No valid conversion rows to import", 400);
    }

    await connectDB();
    const result = await upsertWeightConversionRows(parsed.rows);

    return jsonOk({
      dryRun: false,
      fileName: file.name,
      imported: parsed.rows.length,
      created: result.created,
      updated: result.updated,
      errors: parsed.errors,
      failures: result.failures,
      skipped: parsed.skipped,
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Conversion import failed",
      500,
    );
  }
}
