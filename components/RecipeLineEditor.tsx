"use client";

import { Button, Input } from "@/components/ui";
import type { ManualRecipeLine } from "@/lib/recipe-lines";
import { createManualLine } from "@/lib/recipe-lines";
import {
  RECIPE_VOLUME_UNITS,
  RECIPE_WEIGHT_UNITS,
} from "@/lib/recipe-units";

export function RecipeLineEditor({
  lines,
  onChange,
}: {
  lines: ManualRecipeLine[];
  onChange: (lines: ManualRecipeLine[]) => void;
}) {
  function updateLine(id: string, patch: Partial<ManualRecipeLine>) {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function removeLine(id: string) {
    if (lines.length <= 1) {
      onChange([createManualLine()]);
      return;
    }
    onChange(lines.filter((line) => line.id !== id));
  }

  function addLine() {
    onChange([...lines, createManualLine()]);
  }

  return (
    <div className="space-y-2">
      <div className="hidden gap-2 text-xs font-medium text-stone-500 sm:grid sm:grid-cols-[1fr_100px_100px_36px]">
        <span>Ingredient</span>
        <span>Amount</span>
        <span>Unit</span>
        <span />
      </div>
      {lines.map((line, index) => (
        <div
          key={line.id}
          className="grid gap-2 rounded-lg border border-stone-100 bg-stone-50/50 p-2 sm:grid-cols-[1fr_100px_100px_36px] sm:items-center"
        >
          <div>
            <label className="mb-1 block text-xs text-stone-500 sm:sr-only">
              Ingredient {index + 1}
            </label>
            <Input
              placeholder="Yellow Onions - Diced"
              value={line.ingredientName}
              onChange={(e) =>
                updateLine(line.id, { ingredientName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500 sm:sr-only">
              Amount
            </label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="2"
              value={line.quantity}
              onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500 sm:sr-only">
              Unit
            </label>
            <select
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={line.unit}
              onChange={(e) => updateLine(line.id, { unit: e.target.value })}
            >
              <optgroup label="Weight">
                {RECIPE_WEIGHT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Volume (uses conversion table)">
                {RECIPE_VOLUME_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="!px-2 !py-1 text-xs"
            onClick={() => removeLine(line.id)}
            aria-label={`Remove line ${index + 1}`}
          >
            ×
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={addLine}>
        + Add line
      </Button>
    </div>
  );
}
