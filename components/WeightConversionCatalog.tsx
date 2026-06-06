"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WeightConversionForm, type WeightConversionRow } from "@/components/WeightConversionForm";
import {
  formatMeasureLabel,
  poundsPerUnit,
} from "@/lib/weight-conversion";
import { Button, Card, Field, Input } from "@/components/ui";

function filterConversions(items: WeightConversionRow[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    item.ingredientName.toLowerCase().includes(q),
  );
}

export function WeightConversionCatalog({
  initial,
}: {
  initial: WeightConversionRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<WeightConversionRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => filterConversions(initial, query),
    [initial, query],
  );

  async function handleDelete(row: WeightConversionRow) {
    const label = `${row.ingredientName} (${formatMeasureLabel(row.measureQuantity, row.measureUnit)})`;
    if (!window.confirm(`Delete conversion for ${label}?`)) return;

    setDeletingId(row._id);
    setError("");

    const res = await fetch(`/api/ingredients/conversions/${row._id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setDeletingId(null);

    if (!res.ok) {
      setError(data.error ?? "Failed to delete conversion");
      return;
    }

    if (editing?._id === row._id) setEditing(null);
    router.refresh();
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-1 text-lg font-semibold text-stone-900">
        Manage weight conversions
      </h2>
      <p className="mb-4 text-sm text-stone-600">
        View, add, or edit how cups, gallons, and other measures convert to
        pounds for recipe costing.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Field label="Search conversions">
            <Input
              type="search"
              placeholder="Filter by ingredient name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </Field>
          {query.trim() && (
            <p className="mt-2 text-xs text-stone-500">
              {filtered.length} of {initial.length} shown
            </p>
          )}

          <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-stone-600">
                {initial.length === 0
                  ? "No conversions yet — add one or import from Excel."
                  : "No conversions match your search."}
              </p>
            ) : (
              filtered.map((row) => (
                <div
                  key={row._id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-stone-100 bg-stone-50/50 p-3"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium text-stone-900">
                      {row.ingredientName}
                    </h3>
                    <p className="mt-0.5 text-sm text-stone-600">
                      {formatMeasureLabel(row.measureQuantity, row.measureUnit)}{" "}
                      = {row.pounds} lb
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {poundsPerUnit(row.measureQuantity, row.pounds).toFixed(3)}{" "}
                      lb per {row.measureUnit}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-3 !py-1 text-xs"
                      onClick={() => setEditing(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-3 !py-1 text-xs"
                      disabled={deletingId === row._id}
                      onClick={() => void handleDelete(row)}
                    >
                      {deletingId === row._id ? "…" : "Delete"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="mb-4 font-semibold text-stone-900">
            {editing
              ? `Edit — ${editing.ingredientName}`
              : "Add conversion"}
          </h3>
          <WeightConversionForm
            key={editing?._id ?? "new"}
            conversionId={editing?._id}
            initial={
              editing
                ? {
                    ingredientName: editing.ingredientName,
                    measureQuantity: editing.measureQuantity,
                    measureUnit: editing.measureUnit,
                    pounds: editing.pounds,
                  }
                : undefined
            }
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
          {editing && (
            <button
              type="button"
              className="mt-4 text-sm text-stone-500 hover:text-stone-800"
              onClick={() => setEditing(null)}
            >
              Cancel edit
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
