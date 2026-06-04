"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IngredientForm } from "@/components/IngredientForm";
import { IngredientSpreadsheetImport } from "@/components/IngredientSpreadsheetImport";
import { formatMoney, formatWeightPerPound } from "@/lib/costing";
import { Button, Card, Field, Input } from "@/components/ui";
import type { WeightUnit } from "@/lib/types";

interface IngredientRow {
  _id: string;
  name: string;
  vendor: string;
  brand: string;
  unitsPerPack: number;
  weightPerUnit: number;
  weightUnit: WeightUnit;
  packPrice: number;
  costPerPound?: number;
}

function filterIngredients(items: IngredientRow[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.vendor.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q),
  );
}

export function IngredientCatalog({
  initial,
  initialQuery,
}: {
  initial: IngredientRow[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [editing, setEditing] = useState<IngredientRow | null>(null);

  const filtered = useMemo(
    () => filterIngredients(initial, query),
    [initial, query],
  );

  useEffect(() => {
    const q = query.trim();
    const url = q
      ? `/ingredients?q=${encodeURIComponent(q)}`
      : "/ingredients";
    window.history.replaceState(null, "", url);
  }, [query]);

  return (
    <div>
      <IngredientSpreadsheetImport />
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Card className="mb-6">
            <Field label="Search ingredients">
              <Input
                type="search"
                placeholder="Type to search by ingredient, brand, or vendor…"
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
          </Card>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-stone-600">
                {initial.length === 0
                  ? "No ingredients yet."
                  : "No ingredients match your search."}
              </p>
            ) : (
              filtered.map((item) => (
                <Card key={item._id} className="!p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold leading-tight text-stone-900">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-stone-500">
                        {item.brand ? (
                          <>
                            <span className="font-medium text-stone-700">
                              {item.brand}
                            </span>
                            <span className="text-stone-400"> · </span>
                          </>
                        ) : null}
                        {item.vendor}
                      </p>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-stone-500">
                        <span>
                          {item.unitsPerPack} × {item.weightPerUnit}{" "}
                          {item.weightUnit} @ {formatMoney(item.packPrice)}
                        </span>
                        {item.costPerPound != null && (
                          <span className="text-sm font-medium text-emerald-800">
                            {formatWeightPerPound(item.costPerPound)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      onClick={() => setEditing(item)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <Card>
          <h2 className="mb-4 font-semibold">
            {editing ? `Edit — ${editing.name}` : "Add ingredient pricing"}
          </h2>
          <IngredientForm
            key={editing?._id ?? "new"}
            ingredientId={editing?._id}
            initial={
              editing
                ? {
                    name: editing.name,
                    vendor: editing.vendor,
                    brand: editing.brand,
                    unitsPerPack: editing.unitsPerPack,
                    weightPerUnit: editing.weightPerUnit,
                    weightUnit: editing.weightUnit,
                    packPrice: editing.packPrice,
                    sku: "",
                    notes: "",
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
        </Card>
      </div>
    </div>
  );
}
