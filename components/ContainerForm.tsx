"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { formatPriceEach } from "@/lib/packaging";

export function ContainerForm({
  initial,
  containerId,
  onSaved,
}: {
  initial?: {
    name: string;
    vendor: string;
    size: string;
    priceEach: number;
    minOrderQty: number;
    sku: string;
    notes: string;
  };
  containerId?: string;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [size, setSize] = useState(initial?.size ?? "");
  const [priceEach, setPriceEach] = useState(String(initial?.priceEach ?? 0.45));
  const [minOrderQty, setMinOrderQty] = useState(
    String(initial?.minOrderQty ?? 100),
  );
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const previewPrice = parseFloat(priceEach) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      vendor,
      size,
      priceEach: parseFloat(priceEach),
      minOrderQty: parseInt(minOrderQty, 10),
      sku,
      notes,
    };

    const url = containerId
      ? `/api/containers/${containerId}`
      : "/api/containers";
    const method = containerId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save container");
      return;
    }

    onSaved?.();
    if (!containerId) {
      setName("");
      setSku("");
      setNotes("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <Field label="Container name *">
        <Input
          placeholder="Boston round bottle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>
      <Field label="Vendor *">
        <Input
          placeholder="Berlin Packaging"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          required
        />
      </Field>
      <Field label="Size *">
        <Input
          placeholder="8 oz, 16 oz, 750 ml"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price each ($) *">
          <Input
            type="number"
            min="0"
            step="0.0001"
            value={priceEach}
            onChange={(e) => setPriceEach(e.target.value)}
            required
          />
        </Field>
        <Field label="Min order qty *">
          <Input
            type="number"
            min="1"
            step="1"
            value={minOrderQty}
            onChange={(e) => setMinOrderQty(e.target.value)}
            required
          />
        </Field>
      </div>
      {previewPrice > 0 && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Unit price: <strong>{formatPriceEach(previewPrice)}</strong>
        </p>
      )}
      <Field label="SKU / item #">
        <Input value={sku} onChange={(e) => setSku(e.target.value)} />
      </Field>
      <Field label="Notes">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : containerId ? "Update" : "Add container"}
      </Button>
    </form>
  );
}
