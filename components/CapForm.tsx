"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { formatPriceEach } from "@/lib/packaging";
import type { CapMaterialType } from "@/lib/types";

export interface ContainerOption {
  name: string;
  size: string;
}

export function CapForm({
  initial,
  capId,
  containerOptions,
  onSaved,
}: {
  initial?: {
    name: string;
    vendor: string;
    fitsContainerName: string;
    fitsContainerSize: string;
    color: string;
    materialType: CapMaterialType;
    priceEach: number;
    minOrderQty: number;
    sku: string;
    notes: string;
  };
  capId?: string;
  containerOptions: ContainerOption[];
  onSaved?: () => void;
}) {
  const uniqueContainers = useMemo(() => {
    const seen = new Set<string>();
    return containerOptions.filter((c) => {
      const key = `${c.name}|${c.size}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [containerOptions]);

  const initialContainerKey =
    initial?.fitsContainerName && initial?.fitsContainerSize
      ? `${initial.fitsContainerName}|${initial.fitsContainerSize}`
      : "";

  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [containerKey, setContainerKey] = useState(initialContainerKey);
  const [fitsContainerName, setFitsContainerName] = useState(
    initial?.fitsContainerName ?? "",
  );
  const [fitsContainerSize, setFitsContainerSize] = useState(
    initial?.fitsContainerSize ?? "",
  );
  const [color, setColor] = useState(initial?.color ?? "");
  const [materialType, setMaterialType] = useState<CapMaterialType>(
    initial?.materialType ?? "plastic",
  );
  const [priceEach, setPriceEach] = useState(String(initial?.priceEach ?? 0.12));
  const [minOrderQty, setMinOrderQty] = useState(
    String(initial?.minOrderQty ?? 100),
  );
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const previewPrice = parseFloat(priceEach) || 0;

  function handleContainerSelect(value: string) {
    setContainerKey(value);
    if (!value) return;
    const [cName, cSize] = value.split("|");
    setFitsContainerName(cName ?? "");
    setFitsContainerSize(cSize ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      vendor,
      fitsContainerName,
      fitsContainerSize,
      color,
      materialType,
      priceEach: parseFloat(priceEach),
      minOrderQty: parseInt(minOrderQty, 10),
      sku,
      notes,
    };

    const url = capId ? `/api/caps/${capId}` : "/api/caps";
    const method = capId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save cap");
      return;
    }

    onSaved?.();
    if (!capId) {
      setName("");
      setSku("");
      setNotes("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <Field label="Cap / lid name *">
        <Input
          placeholder="38-400 continuous thread cap"
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
      {uniqueContainers.length > 0 ? (
        <Field label="Fits container *">
          <select
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={containerKey}
            onChange={(e) => handleContainerSelect(e.target.value)}
            required
          >
            <option value="">Select a bottle…</option>
            {uniqueContainers.map((c) => {
              const key = `${c.name}|${c.size}`;
              return (
                <option key={key} value={key}>
                  {c.name} — {c.size}
                </option>
              );
            })}
          </select>
        </Field>
      ) : (
        <>
          <Field label="Container name *">
            <Input
              placeholder="Boston round bottle"
              value={fitsContainerName}
              onChange={(e) => setFitsContainerName(e.target.value)}
              required
            />
          </Field>
          <Field label="Container size *">
            <Input
              placeholder="8 oz"
              value={fitsContainerSize}
              onChange={(e) => setFitsContainerSize(e.target.value)}
              required
            />
          </Field>
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Color *">
          <Input
            placeholder="Black, white, gold"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            required
          />
        </Field>
        <Field label="Type *">
          <select
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={materialType}
            onChange={(e) =>
              setMaterialType(e.target.value as CapMaterialType)
            }
          >
            <option value="plastic">Plastic</option>
            <option value="metal">Metal</option>
          </select>
        </Field>
      </div>
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
        {loading ? "Saving…" : capId ? "Update" : "Add cap / lid"}
      </Button>
    </form>
  );
}
