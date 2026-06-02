"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney, formatWeightPerPound } from "@/lib/costing";
import { Button, Card, Field, Input } from "@/components/ui";

interface PreviewRow {
  name: string;
  vendor: string;
  unitsPerPack: number;
  weightPerUnit: number;
  weightUnit: string;
  packPrice: number;
  costPerPound: number | null;
  sku?: string;
}

interface ParseError {
  row?: number;
  message: string;
  name?: string;
  vendor?: string;
}

export function IngredientSpreadsheetImport() {
  const router = useRouter();
  const [vendor, setVendor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(dryRun: boolean) {
    if (!file) {
      setError("Choose an Excel file first");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const form = new FormData();
    form.append("file", file);
    if (vendor.trim()) form.append("vendor", vendor.trim());
    form.append("dryRun", dryRun ? "true" : "false");

    const res = await fetch("/api/ingredients/import", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }

    if (dryRun) {
      setPreview(data.rows ?? []);
      setErrors(data.errors ?? []);
      setSkipped(data.skipped ?? 0);
      setMessage(
        `${data.readyCount ?? 0} row(s) ready to import${
          data.errors?.length ? ` · ${data.errors.length} issue(s)` : ""
        }`,
      );
      return;
    }

    setPreview([]);
    setMessage(
      `Imported ${data.imported ?? 0} items (${data.created ?? 0} new, ${data.updated ?? 0} updated).`,
    );
    setErrors([...(data.errors ?? []), ...(data.failures ?? [])]);
    setFile(null);
    router.refresh();
  }

  return (
    <Card className="mb-6">
      <h2 className="font-semibold">Import from Excel</h2>
      <p className="mt-1 text-sm text-stone-600">
        Upload vendor pricing from a spreadsheet (.xlsx, .xls, or .csv). Existing
        ingredient + vendor pairs are updated.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="/api/ingredients/import/template"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Download template
        </a>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Default vendor (optional)">
          <Input
            placeholder="Ben E. Keith — used when the sheet has no Vendor column"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </Field>

        <Field label="Spreadsheet file">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview([]);
              setMessage("");
              setError("");
            }}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !file}
            onClick={() => upload(true)}
          >
            {loading ? "Working…" : "Preview import"}
          </Button>
          <Button
            type="button"
            disabled={loading || !file}
            onClick={() => upload(false)}
          >
            Import to database
          </Button>
        </div>

        <details className="text-sm text-stone-600">
          <summary className="cursor-pointer font-medium text-stone-700">
            Expected columns
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Ingredient</strong> (required) — also: Product, Item
            </li>
            <li>
              <strong>Vendor</strong> — or set default vendor above
            </li>
            <li>
              <strong>Units per pack</strong> + <strong>Weight per unit</strong>{" "}
              + <strong>Weight unit</strong> (lb, oz, kg, g)
            </li>
            <li>
              Or <strong>Pack size</strong> shorthand: <code>6/10#</code> (6 × 10
              lb)
            </li>
            <li>
              <strong>Pack price</strong> (required)
            </li>
            <li>Optional: SKU, Notes</li>
          </ul>
        </details>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-800">{message}</p>}
      {skipped > 0 && preview.length > 0 && (
        <p className="mt-2 text-xs text-stone-500">{skipped} blank row(s) skipped</p>
      )}

      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Rows with issues</p>
          <ul className="mt-2 list-disc pl-5">
            {errors.slice(0, 10).map((err, i) => (
              <li key={i}>
                {err.row && err.row > 0 ? `Row ${err.row}: ` : ""}
                {err.name ? `${err.name} (${err.vendor}): ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
          {errors.length > 10 && (
            <p className="mt-1 text-xs">…and {errors.length - 10} more</p>
          )}
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-stone-200">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-600">
              <tr>
                <th className="px-3 py-2">Ingredient</th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Pack</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">$/lb</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-t border-stone-100">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.vendor}</td>
                  <td className="px-3 py-2">
                    {row.unitsPerPack} × {row.weightPerUnit} {row.weightUnit}
                  </td>
                  <td className="px-3 py-2">{formatMoney(row.packPrice)}</td>
                  <td className="px-3 py-2">
                    {row.costPerPound != null
                      ? formatWeightPerPound(row.costPerPound)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 50 && (
            <p className="px-3 py-2 text-xs text-stone-500">
              Showing first 50 of {preview.length} rows
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
