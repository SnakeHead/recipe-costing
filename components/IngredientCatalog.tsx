"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IngredientForm } from "@/components/IngredientForm";
import { formatMoney, formatWeightPerPound } from "@/lib/costing";
import { Button, Card, Field, Input } from "@/components/ui";
import type { WeightUnit } from "@/lib/types";

interface IngredientRow {
  _id: string;
  name: string;
  vendor: string;
  unitsPerPack: number;
  weightPerUnit: number;
  weightUnit: WeightUnit;
  packPrice: number;
  costPerPound?: number;
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

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/ingredients?${params.toString()}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <Card className="mb-6">
          <form onSubmit={search} className="flex gap-2">
            <Field label="Search">
              <Input
                placeholder="ketchup, Ben E. Keith…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-2">
          {initial.length === 0 ? (
            <p className="text-sm text-stone-600">No ingredients found.</p>
          ) : (
            initial.map((item) => (
              <Card key={item._id} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-stone-500">{item.vendor}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {item.unitsPerPack} × {item.weightPerUnit} {item.weightUnit}{" "}
                      @ {formatMoney(item.packPrice)}
                    </p>
                    {item.costPerPound != null && (
                      <p className="mt-1 text-sm font-medium text-emerald-800">
                        {formatWeightPerPound(item.costPerPound)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
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
  );
}
