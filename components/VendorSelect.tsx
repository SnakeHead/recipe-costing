"use client";

import { useMemo } from "react";
import { Field, Input } from "@/components/ui";
import { DEFAULT_PACKAGING_VENDORS } from "@/lib/packaging-vendors";

const ADD_NEW_VALUE = "__new__";

export function VendorSelect({
  value,
  onChange,
  extraVendors = [],
  label = "Vendor *",
}: {
  value: string;
  onChange: (vendor: string) => void;
  extraVendors?: string[];
  label?: string;
}) {
  const options = useMemo(() => {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const vendor of [
      ...DEFAULT_PACKAGING_VENDORS,
      ...extraVendors,
    ]) {
      const trimmed = vendor.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      merged.push(trimmed);
    }
    return merged.sort((a, b) => a.localeCompare(b));
  }, [extraVendors]);

  const isPreset = options.includes(value);
  const selectValue = value && isPreset ? value : value ? ADD_NEW_VALUE : "";

  return (
    <div>
      <Field label={label}>
        <select
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          value={selectValue}
          onChange={(e) => {
            const next = e.target.value;
            if (next === ADD_NEW_VALUE) {
              onChange(isPreset ? "" : value);
              return;
            }
            onChange(next);
          }}
          required={!value}
        >
          <option value="">Select a vendor…</option>
          {options.map((vendor) => (
            <option key={vendor} value={vendor}>
              {vendor}
            </option>
          ))}
          <option value={ADD_NEW_VALUE}>Add new vendor…</option>
        </select>
      </Field>
      {(!isPreset || selectValue === ADD_NEW_VALUE) && (
        <Field label="New vendor name *">
          <Input
            placeholder="Vendor name"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
          />
        </Field>
      )}
    </div>
  );
}
