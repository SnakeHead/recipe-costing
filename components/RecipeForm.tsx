"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { formatMoney } from "@/lib/costing";

interface PreviewLine {
  ingredientName: string;
  quantity: number;
  unit: string;
  vendor?: string;
  costPerPound?: number;
  lineCost?: number;
  matchNote?: string;
}

export function RecipeForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rawText, setRawText] = useState(
    "Ketchup, 3.4 lb\nMayonnaise, 1.5 lb\n",
  );
  const [preview, setPreview] = useState<PreviewLine[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  async function handleParse() {
    setParsing(true);
    setError("");
    const res = await fetch("/api/recipes/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });
    const data = await res.json();
    setParsing(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to parse recipe");
      return;
    }
    setPreview(data.lines);
    setTotalCost(data.totalCost);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setRawText(text);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/clients/${clientId}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        rawText,
        lines: preview.length > 0 ? preview : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save recipe");
      return;
    }

    router.push(`/recipes/${data._id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Recipe name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <Field label="Ingredients (one per line)">
        <p className="mb-2 text-xs text-stone-500">
          Formats: &quot;Ketchup, 3.4 lb&quot; · &quot;3.4 lb Ketchup&quot; ·
          tab-separated name and weight
        </p>
        <Textarea
          rows={10}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={handleParse} disabled={parsing}>
          {parsing ? "Parsing…" : "Preview costs"}
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

      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-600">
              <tr>
                <th className="px-4 py-2">Ingredient</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Vendor</th>
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
                    {line.vendor ?? line.matchNote ?? "—"}
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
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save recipe"}
      </Button>
    </form>
  );
}
