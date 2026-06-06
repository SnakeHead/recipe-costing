"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field } from "@/components/ui";

interface PreviewRow {
  ingredientName: string;
  measureQuantity: number;
  measureUnit: string;
  pounds: number;
}

export function WeightConversionImport({ initialCount = 0 }: { initialCount?: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [message, setMessage] = useState(
    initialCount > 0
      ? `${initialCount} weight conversions loaded — upload a new file to replace or add more.`
      : "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(dryRun: boolean) {
    if (!file) {
      setError("Choose your Ingredient Weight Conversions Excel file first");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const form = new FormData();
    form.append("file", file);
    form.append("dryRun", dryRun ? "true" : "false");

    const res = await fetch("/api/ingredients/conversions/import", {
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
      setSkipped(data.skipped ?? 0);
      setMessage(
        `Ready to import ${data.readyCount ?? 0} conversions${
          data.skipped ? ` (${data.skipped} rows skipped)` : ""
        }`,
      );
      return;
    }

    setPreview([]);
    setMessage(
      `Imported ${data.imported ?? 0} conversions${
        data.skipped ? ` · ${data.skipped} rows skipped` : ""
      }`,
    );
    router.refresh();
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-1 text-lg font-semibold text-stone-900">
        Weight conversions (cups, gallons → lb)
      </h2>
      <p className="mb-4 text-sm text-stone-600">
        Upload your cheat sheet (Amount, Ingredient, Pounds columns) so recipe
        lines in cups or gallons convert to pounds for costing.
      </p>

      <Field label="Excel file (.xlsx)">
        <input
          type="file"
          accept=".xlsx,.xls"
          className="block w-full text-sm text-stone-600"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview([]);
            setMessage("");
            setError("");
          }}
        />
      </Field>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !file}
          onClick={() => upload(true)}
        >
          {loading ? "Working…" : "Preview import"}
        </Button>
        <Button type="button" disabled={loading || !file} onClick={() => upload(false)}>
          {loading ? "Importing…" : "Import conversions"}
        </Button>
      </div>

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {preview.length > 0 && (
        <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-stone-200">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-600">
              <tr>
                <th className="px-3 py-2">Ingredient</th>
                <th className="px-3 py-2">Measure</th>
                <th className="px-3 py-2">Pounds</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 30).map((row, i) => (
                <tr key={i} className="border-t border-stone-100">
                  <td className="px-3 py-2">{row.ingredientName}</td>
                  <td className="px-3 py-2">
                    {row.measureQuantity} {row.measureUnit}
                  </td>
                  <td className="px-3 py-2">{row.pounds} lb</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 30 && (
            <p className="px-3 py-2 text-xs text-stone-500">
              …and {preview.length - 30} more
            </p>
          )}
          {skipped > 0 && (
            <p className="px-3 py-2 text-xs text-stone-500">
              {skipped} rows skipped (missing pounds or unparseable amounts)
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
