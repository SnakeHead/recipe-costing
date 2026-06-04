"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/costing";
import type { WeightUnit } from "@/lib/types";

interface ExtractedLine {
  productName: string;
  vendor?: string;
  unitsPerPack?: number;
  unitSize?: string;
  weightUnit?: WeightUnit;
  packPrice?: number;
  lineTotal?: number;
  applied?: boolean;
}

export function InvoiceReview({
  invoiceId,
  vendor,
  lines: initialLines,
}: {
  invoiceId: string;
  vendor: string;
  lines: ExtractedLine[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState(initialLines);
  const [selected, setSelected] = useState<Set<number>>(
    () =>
      new Set(
        initialLines
          .map((l, i) => (l.applied ? -1 : i))
          .filter((i) => i >= 0),
      ),
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function updateLine(index: number, patch: Partial<ExtractedLine>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  async function applySelected() {
    setLoading(true);
    setMessage("");

    const overrides = [...selected].map((index) => ({
      index,
      name: lines[index].productName,
      vendor: lines[index].vendor ?? vendor,
      unitsPerPack: lines[index].unitsPerPack,
      unitSize: lines[index].unitSize,
      weightUnit: lines[index].weightUnit,
      packPrice: lines[index].packPrice ?? lines[index].lineTotal,
    }));

    const res = await fetch(`/api/invoices/${invoiceId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineIndexes: [...selected],
        overrides,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to apply");
      return;
    }

    setMessage(`Updated ${data.created?.length ?? 0} ingredients.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-600">
            <tr>
              <th className="px-3 py-2" />
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Units/pack</th>
                <th className="px-3 py-2">Unit size</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-t border-stone-100">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(index)}
                    disabled={line.applied}
                    onChange={() => toggle(index)}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-full min-w-[140px] rounded border border-stone-200 px-2 py-1"
                    value={line.productName}
                    disabled={line.applied}
                    onChange={(e) =>
                      updateLine(index, { productName: e.target.value })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="w-20 rounded border border-stone-200 px-2 py-1"
                    value={line.unitsPerPack ?? ""}
                    disabled={line.applied}
                    onChange={(e) =>
                      updateLine(index, {
                        unitsPerPack: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <input
                      className="w-28 rounded border border-stone-200 px-2 py-1"
                      placeholder="#10 can"
                      value={line.unitSize ?? ""}
                      disabled={line.applied}
                      onChange={(e) =>
                        updateLine(index, {
                          unitSize: e.target.value,
                        })
                      }
                    />
                    <select
                      className="rounded border border-stone-200 px-1 py-1"
                      value={line.weightUnit ?? "lb"}
                      disabled={line.applied}
                      onChange={(e) =>
                        updateLine(index, {
                          weightUnit: e.target.value as WeightUnit,
                        })
                      }
                    >
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    className="w-24 rounded border border-stone-200 px-2 py-1"
                    value={line.packPrice ?? line.lineTotal ?? ""}
                    disabled={line.applied}
                    onChange={(e) =>
                      updateLine(index, {
                        packPrice: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2 text-stone-500">
                  {line.applied ? "Applied" : "Pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500">
        Example: 6 units × 10 lb @ {formatMoney(75.23)} →{" "}
        {formatMoney(75.23 / 60)}/lb
      </p>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <Button
        type="button"
        onClick={applySelected}
        disabled={loading || selected.size === 0}
      >
        {loading ? "Applying…" : `Apply ${selected.size} to ingredient database`}
      </Button>
    </div>
  );
}
