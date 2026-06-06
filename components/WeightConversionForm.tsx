"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { RECIPE_VOLUME_UNITS } from "@/lib/recipe-units";
import {
  formatMeasureLabel,
  poundsPerUnit,
} from "@/lib/weight-conversion";

export interface WeightConversionRow {
  _id: string;
  ingredientName: string;
  measureQuantity: number;
  measureUnit: string;
  pounds: number;
}

export function WeightConversionForm({
  initial,
  conversionId,
  onSaved,
}: {
  initial?: Omit<WeightConversionRow, "_id">;
  conversionId?: string;
  onSaved?: () => void;
}) {
  const [ingredientName, setIngredientName] = useState(
    initial?.ingredientName ?? "",
  );
  const [measureQuantity, setMeasureQuantity] = useState(
    String(initial?.measureQuantity ?? 1),
  );
  const [measureUnit, setMeasureUnit] = useState(
    initial?.measureUnit ?? "cup",
  );
  const [pounds, setPounds] = useState(String(initial?.pounds ?? ""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const qty = parseFloat(measureQuantity);
  const lbs = parseFloat(pounds);
  const perUnit =
    Number.isFinite(qty) && qty > 0 && Number.isFinite(lbs) && lbs > 0
      ? poundsPerUnit(qty, lbs)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ingredientName,
      measureQuantity: parseFloat(measureQuantity),
      measureUnit,
      pounds: parseFloat(pounds),
    };

    const url = conversionId
      ? `/api/ingredients/conversions/${conversionId}`
      : "/api/ingredients/conversions";
    const method = conversionId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save conversion");
      return;
    }

    if (!conversionId) {
      setIngredientName("");
      setMeasureQuantity("1");
      setMeasureUnit("cup");
      setPounds("");
    }

    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Ingredient name *">
        <Input
          value={ingredientName}
          onChange={(e) => setIngredientName(e.target.value)}
          placeholder="Worcestershire Sauce"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Measure amount *">
          <Input
            type="number"
            min="0"
            step="any"
            value={measureQuantity}
            onChange={(e) => setMeasureQuantity(e.target.value)}
            placeholder="1"
            required
          />
        </Field>
        <Field label="Measure unit *">
          <select
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={measureUnit}
            onChange={(e) => setMeasureUnit(e.target.value)}
          >
            {RECIPE_VOLUME_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Equals (pounds) *">
        <Input
          type="number"
          min="0"
          step="any"
          value={pounds}
          onChange={(e) => setPounds(e.target.value)}
          placeholder="8.5"
          required
        />
      </Field>

      {perUnit != null && Number.isFinite(qty) && qty > 0 && (
        <p className="text-xs text-stone-500">
          {formatMeasureLabel(qty, measureUnit)} = {lbs} lb (
          {perUnit.toFixed(3)} lb per {measureUnit})
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : conversionId ? "Save changes" : "Add conversion"}
      </Button>
    </form>
  );
}
