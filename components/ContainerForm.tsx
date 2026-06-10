"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { VendorSelect } from "@/components/VendorSelect";
import {
  calculateCasePrice,
  calculateContainerPriceEach,
  unitsPerCaseForSize,
} from "@/lib/container-pricing";
import { formatMoney } from "@/lib/costing";
import { formatPriceEach } from "@/lib/packaging";
import type { ContainerCaseSize, ContainerMaterialType } from "@/lib/types";

type PriceSource = "case" | "each";

function formatPriceInput(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 10000) / 10000);
}

export function ContainerForm({
  initial,
  containerId,
  knownVendors = [],
  onSaved,
}: {
  initial?: {
    name: string;
    vendor: string;
    size: string;
    materialType: ContainerMaterialType;
    caseSize: ContainerCaseSize;
    casePrice: number;
    unitsPerCase: number;
    priceEach: number;
    minOrderQty: number;
    sku: string;
    notes: string;
  };
  containerId?: string;
  knownVendors?: string[];
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [size, setSize] = useState(initial?.size ?? "");
  const [materialType, setMaterialType] = useState<ContainerMaterialType>(
    initial?.materialType ?? "glass",
  );
  const [caseSize, setCaseSize] = useState<ContainerCaseSize>(
    initial?.caseSize ?? "6pk",
  );
  const [casePrice, setCasePrice] = useState(
    String(initial?.casePrice ?? 45),
  );
  const [priceEach, setPriceEach] = useState(
    String(initial?.priceEach ?? 7.5),
  );
  const [bulkUnits, setBulkUnits] = useState(
    String(
      initial?.caseSize === "bulk" ? (initial?.unitsPerCase ?? 100) : 100,
    ),
  );
  const [minOrderQty, setMinOrderQty] = useState(
    String(initial?.minOrderQty ?? 1),
  );
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const priceSource = useRef<PriceSource>("case");

  const unitsPerCase = useMemo(
    () =>
      unitsPerCaseForSize(
        caseSize,
        caseSize === "bulk" ? parseInt(bulkUnits, 10) || 0 : 0,
      ),
    [caseSize, bulkUnits],
  );

  useEffect(() => {
    if (unitsPerCase <= 0) return;

    if (priceSource.current === "case") {
      const derived = calculateContainerPriceEach(
        parseFloat(casePrice) || 0,
        unitsPerCase,
      );
      if (derived !== null) setPriceEach(formatPriceInput(derived));
      return;
    }

    const derived = calculateCasePrice(parseFloat(priceEach) || 0, unitsPerCase);
    if (derived !== null) setCasePrice(formatPriceInput(derived));
    // Recalculate the derived price when pack size changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitsPerCase]);

  function handleCasePriceChange(value: string) {
    priceSource.current = "case";
    setCasePrice(value);
    const derived = calculateContainerPriceEach(
      parseFloat(value) || 0,
      unitsPerCase,
    );
    if (derived !== null) setPriceEach(formatPriceInput(derived));
  }

  function handlePriceEachChange(value: string) {
    priceSource.current = "each";
    setPriceEach(value);
    const derived = calculateCasePrice(parseFloat(value) || 0, unitsPerCase);
    if (derived !== null) setCasePrice(formatPriceInput(derived));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      vendor,
      size,
      materialType,
      caseSize,
      casePrice: parseFloat(casePrice),
      unitsPerCase:
        caseSize === "bulk" ? parseInt(bulkUnits, 10) : unitsPerCase,
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

  const parsedCase = parseFloat(casePrice) || 0;
  const parsedEach = parseFloat(priceEach) || 0;

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
      <VendorSelect
        value={vendor}
        onChange={setVendor}
        extraVendors={knownVendors}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Size *">
          <Input
            placeholder="8 oz, 16 oz, 750 ml"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            required
          />
        </Field>
        <Field label="Material *">
          <select
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={materialType}
            onChange={(e) =>
              setMaterialType(e.target.value as ContainerMaterialType)
            }
          >
            <option value="glass">Glass</option>
            <option value="plastic">Plastic</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Case size *">
          <select
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={caseSize}
            onChange={(e) =>
              setCaseSize(e.target.value as ContainerCaseSize)
            }
          >
            <option value="6pk">6pk</option>
            <option value="12pk">12pk</option>
            <option value="bulk">Bulk</option>
          </select>
        </Field>
        {caseSize === "bulk" ? (
          <Field label="Units in bulk case *">
            <Input
              type="number"
              min="1"
              step="1"
              value={bulkUnits}
              onChange={(e) => setBulkUnits(e.target.value)}
              required
            />
          </Field>
        ) : (
          <Field label="Units per case">
            <Input
              type="text"
              value={unitsPerCase.toLocaleString()}
              readOnly
              className="bg-stone-50 text-stone-600"
            />
          </Field>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Case price ($)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={casePrice}
            onChange={(e) => handleCasePriceChange(e.target.value)}
          />
        </Field>
        <Field label="Price per container ($)">
          <Input
            type="number"
            min="0"
            step="0.0001"
            value={priceEach}
            onChange={(e) => handlePriceEachChange(e.target.value)}
          />
        </Field>
      </div>
      <p className="mb-4 text-xs text-stone-500">
        Enter either field — the other updates from case size (
        {unitsPerCase.toLocaleString()} units).
      </p>
      {parsedCase > 0 && parsedEach > 0 && unitsPerCase > 0 && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <strong>{formatMoney(parsedCase)}</strong> per case →{" "}
          <strong>{formatPriceEach(parsedEach)}</strong>
        </p>
      )}
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
