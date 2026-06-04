"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { calculateCostPerPound, formatMoney } from "@/lib/costing";
import type { WeightUnit } from "@/lib/types";

export function IngredientForm({
  initial,
  ingredientId,
  onSaved,
}: {
  initial?: {
    name: string;
    vendor: string;
    brand: string;
    unitsPerPack: number;
    weightPerUnit: number;
    weightUnit: WeightUnit;
    packPrice: number;
    sku: string;
    notes: string;
  };
  ingredientId?: string;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [unitsPerPack, setUnitsPerPack] = useState(
    String(initial?.unitsPerPack ?? 6),
  );
  const [weightPerUnit, setWeightPerUnit] = useState(
    String(initial?.weightPerUnit ?? 10),
  );
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    initial?.weightUnit ?? "lb",
  );
  const [packPrice, setPackPrice] = useState(
    String(initial?.packPrice ?? 75.23),
  );
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const previewCost = calculateCostPerPound(
    parseFloat(packPrice) || 0,
    parseFloat(unitsPerPack) || 0,
    parseFloat(weightPerUnit) || 0,
    weightUnit,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      vendor,
      brand,
      unitsPerPack: parseFloat(unitsPerPack),
      weightPerUnit: parseFloat(weightPerUnit),
      weightUnit,
      packPrice: parseFloat(packPrice),
      sku,
      notes,
    };

    const url = ingredientId
      ? `/api/ingredients/${ingredientId}`
      : "/api/ingredients";
    const method = ingredientId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save ingredient");
      return;
    }

    onSaved?.();
    if (!ingredientId) {
      setName("");
      setSku("");
      setNotes("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <Field label="Ingredient name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Vendor (distributor) *">
        <Input
          placeholder="Ben E. Keith"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          required
        />
      </Field>
      <Field label="Brand">
        <Input
          placeholder="Heinz, Hellmann's, etc."
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <p className="mt-1 text-xs text-stone-500">
          Product brand — same ingredient from one vendor can have multiple brands
          at different prices.
        </p>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Units per pack *">
          <Input
            type="number"
            min="0.001"
            step="any"
            value={unitsPerPack}
            onChange={(e) => setUnitsPerPack(e.target.value)}
            required
          />
        </Field>
        <Field label="Weight per unit *">
          <Input
            type="number"
            min="0.001"
            step="any"
            value={weightPerUnit}
            onChange={(e) => setWeightPerUnit(e.target.value)}
            required
          />
        </Field>
        <Field label="Weight unit">
          <select
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
          >
            <option value="lb">lb</option>
            <option value="oz">oz</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
          </select>
        </Field>
      </div>
      <Field label="Pack price ($) *">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={packPrice}
          onChange={(e) => setPackPrice(e.target.value)}
          required
        />
      </Field>
      {previewCost != null && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Cost per pound: <strong>{formatMoney(previewCost)}</strong>
          <span className="text-emerald-700">
            {" "}
            (e.g. 3.4 lb → {formatMoney(previewCost * 3.4)})
          </span>
        </p>
      )}
      <Field label="SKU">
        <Input value={sku} onChange={(e) => setSku(e.target.value)} />
      </Field>
      <Field label="Notes">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : ingredientId ? "Update" : "Add ingredient"}
      </Button>
    </form>
  );
}
