"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { RecipeLineEditor } from "@/components/RecipeLineEditor";
import { formatMoney } from "@/lib/costing";
import {
  createManualLine,
  manualLinesFromParsed,
  manualLinesToParsed,
  parsedLinesToRawText,
  type ManualRecipeLine,
} from "@/lib/recipe-lines";
import type { ParsedRecipeLine } from "@/lib/types";

interface PreviewLine {
  ingredientName: string;
  quantity: number;
  unit: string;
  vendor?: string;
  brand?: string;
  costPerPound?: number;
  lineCost?: number;
  matchNote?: string;
}

export function RecipeForm({
  clientId,
  recipeId,
  initial,
}: {
  clientId: string;
  recipeId?: string;
  initial?: {
    name: string;
    rawText: string;
    lines?: PreviewLine[];
    totalCost?: number;
  };
}) {
  const router = useRouter();
  const isEdit = Boolean(recipeId);

  const [name, setName] = useState(initial?.name ?? "");
  const [rawText, setRawText] = useState(initial?.rawText ?? "");
  const [manualLines, setManualLines] = useState<ManualRecipeLine[]>(() =>
    initial?.lines?.length
      ? manualLinesFromParsed(initial.lines)
      : [createManualLine()],
  );
  const [preview, setPreview] = useState<PreviewLine[]>(initial?.lines ?? []);
  const [totalCost, setTotalCost] = useState(initial?.totalCost ?? 0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  async function handlePreview() {
    setParsing(true);
    setError("");

    const fromManual = manualLinesToParsed(manualLines);
    const payload = fromManual
      ? { lines: fromManual }
      : rawText.trim()
        ? { rawText }
        : null;

    if (!payload) {
      setParsing(false);
      setError("Enter ingredients line by line or paste text below");
      return;
    }

    const res = await fetch("/api/recipes/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setParsing(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to preview costs");
      return;
    }

    setPreview(data.lines);
    setTotalCost(data.totalCost);
    if (fromManual) {
      setManualLines(manualLinesFromParsed(data.lines as ParsedRecipeLine[]));
    }
  }

  function importTextToLines() {
    const parsed = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (parsed.length === 0) {
      setError("Paste ingredients in the text area first");
      return;
    }

    setError("");
    setParsing(true);

    fetch("/api/recipes/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    })
      .then(async (res) => {
        const data = await res.json();
        setParsing(false);
        if (!res.ok) {
          setError(data.error ?? "Could not parse pasted text");
          return;
        }
        setManualLines(manualLinesFromParsed(data.lines));
        setPreview(data.lines);
        setTotalCost(data.totalCost);
      })
      .catch(() => {
        setParsing(false);
        setError("Could not parse pasted text");
      });
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setRawText(text);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipe name is required");
      return;
    }

    const fromManual = manualLinesToParsed(manualLines);
    const linesToSave =
      preview.length > 0
        ? preview
        : fromManual
          ? await (async () => {
              const res = await fetch("/api/recipes/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lines: fromManual }),
              });
              const data = await res.json();
              if (!res.ok) return null;
              return data.lines as PreviewLine[];
            })()
          : null;

    if (!linesToSave?.length && !rawText.trim()) {
      setError("Add ingredients and preview costs before saving");
      return;
    }

    if (!linesToSave?.length) {
      setError("Preview costs first, or complete all line-by-line fields");
      return;
    }

    setLoading(true);
    setError("");

    const rawTextToSave = fromManual
      ? parsedLinesToRawText(fromManual)
      : rawText;

    const url = isEdit
      ? `/api/recipes/${recipeId}`
      : `/api/clients/${clientId}/recipes`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        rawText: rawTextToSave,
        lines: linesToSave,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save recipe");
      return;
    }

    router.push(`/recipes/${isEdit ? recipeId : data._id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Recipe name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-stone-800">
          Ingredients — line by line
        </h3>
        <p className="mb-3 text-xs text-stone-500">
          Enter each ingredient and amount on its own row. Names like{" "}
          <em>Yellow Onions - Diced</em> are matched flexibly against your
          inventory (e.g. <em>Onion Yellow Diced 3/8 Inch</em>).
        </p>
        <RecipeLineEditor lines={manualLines} onChange={setManualLines} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={handlePreview} disabled={parsing}>
          {parsing ? "Working…" : "Preview costs"}
        </Button>
      </div>

      <details className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-stone-700">
          Or paste / upload ingredients (bulk)
        </summary>
        <div className="mt-4 space-y-3">
          <p className="text-xs text-stone-500">
            Formats: &quot;Ketchup, 3.4 lb&quot; · &quot;3.4 lb Ketchup&quot; ·
            &quot;Yellow Onions - Diced, 2 lb&quot;
          </p>
          <Textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={importTextToLines}
              disabled={parsing}
            >
              Parse into lines above
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50">
              Upload .txt file
              <input
                type="file"
                accept=".txt,.csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>
          </div>
        </div>
      </details>

      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-600">
              <tr>
                <th className="px-4 py-2">Ingredient</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Matched inventory</th>
                <th className="px-4 py-2">$/lb</th>
                <th className="px-4 py-2">Line cost</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((line, i) => (
                <tr key={i} className="border-t border-stone-100">
                  <td className="px-4 py-2">{line.ingredientName}</td>
                  <td className="px-4 py-2">
                    {line.quantity} {line.unit}
                  </td>
                  <td className="px-4 py-2 text-stone-500">
                    {line.matchNote
                      ? line.matchNote
                      : line.brand || line.vendor
                        ? [line.brand, line.vendor].filter(Boolean).join(" · ")
                        : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {line.costPerPound != null
                      ? formatMoney(line.costPerPound)
                      : "—"}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {line.lineCost != null ? formatMoney(line.lineCost) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone-200 bg-stone-50">
                <td colSpan={4} className="px-4 py-2 text-right font-medium">
                  Total
                </td>
                <td className="px-4 py-2 font-semibold text-emerald-800">
                  {formatMoney(totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Save changes" : "Save recipe"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/recipes/${recipeId}`)}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
