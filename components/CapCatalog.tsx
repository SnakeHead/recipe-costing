"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CapForm, type ContainerOption } from "@/components/CapForm";
import { Button, Card, Field, Input } from "@/components/ui";
import { formatMoney } from "@/lib/costing";
import {
  capGroupKey,
  formatPriceEach,
  groupByKey,
  materialTypeLabel,
} from "@/lib/packaging";
import type { CapMaterialType } from "@/lib/types";

interface CapRow {
  _id: string;
  name: string;
  vendor: string;
  fitsContainerName: string;
  fitsContainerSize: string;
  color: string;
  materialType: CapMaterialType;
  priceEach: number;
  minOrderQty: number;
  sku?: string;
  notes?: string;
}

function filterCaps(items: CapRow[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.vendor.toLowerCase().includes(q) ||
      item.fitsContainerName.toLowerCase().includes(q) ||
      item.fitsContainerSize.toLowerCase().includes(q) ||
      item.color.toLowerCase().includes(q) ||
      item.materialType.toLowerCase().includes(q),
  );
}

export function CapCatalog({
  initial,
  containerOptions,
  initialQuery,
}: {
  initial: CapRow[];
  containerOptions: ContainerOption[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [editing, setEditing] = useState<CapRow | null>(null);

  const filtered = useMemo(() => filterCaps(initial, query), [initial, query]);

  const groups = useMemo(
    () =>
      groupByKey(filtered, (item) =>
        capGroupKey(
          item.fitsContainerName,
          item.fitsContainerSize,
          item.color,
          item.materialType,
        ),
      ),
    [filtered],
  );

  useEffect(() => {
    const q = query.trim();
    const url = q
      ? `/packaging/caps?q=${encodeURIComponent(q)}`
      : "/packaging/caps";
    window.history.replaceState(null, "", url);
  }, [query]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <Card className="mb-6">
          <Field label="Search caps & lids">
            <Input
              type="search"
              placeholder="Search by container, color, vendor…"
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

        <div className="space-y-4">
          {groups.length === 0 ? (
            <p className="text-sm text-stone-600">
              {initial.length === 0
                ? "No caps or lids yet. Add one manually →"
                : "No caps match your search."}
            </p>
          ) : (
            groups.map((group) => {
              const first = group.items[0]!;
              return (
                <Card key={group.key} className="!p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-stone-900">
                      {first.fitsContainerName} — {first.fitsContainerSize}
                    </h3>
                    <p className="text-sm text-stone-500">
                      {first.color} · {materialTypeLabel(first.materialType)}
                    </p>
                    {group.items.length > 1 && (
                      <p className="mt-1 text-xs text-emerald-800">
                        {group.items.length} vendors — best{" "}
                        {formatPriceEach(group.bestPrice)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isBest =
                        group.items.length > 1 &&
                        item.priceEach === group.bestPrice;
                      return (
                        <div
                          key={item._id}
                          className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 ${
                            isBest
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-stone-200 bg-stone-50"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-stone-800">
                              {item.vendor}
                              {isBest && (
                                <span className="ml-2 rounded bg-emerald-700 px-1.5 py-0.5 text-xs font-medium text-white">
                                  Best price
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-stone-600">{item.name}</p>
                            <p className="mt-0.5 text-xs text-stone-500">
                              {formatPriceEach(item.priceEach)} · min{" "}
                              {item.minOrderQty.toLocaleString()}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-stone-900">
                              {formatMoney(item.priceEach)}
                            </p>
                            <Button
                              type="button"
                              variant="secondary"
                              className="mt-1 !px-2 !py-1 text-xs"
                              onClick={() => setEditing(item)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">
          {editing ? `Edit — ${editing.name}` : "Add cap / lid pricing"}
        </h2>
        <CapForm
          key={editing?._id ?? "new"}
          capId={editing?._id}
          containerOptions={containerOptions}
          initial={
            editing
              ? {
                  name: editing.name,
                  vendor: editing.vendor,
                  fitsContainerName: editing.fitsContainerName,
                  fitsContainerSize: editing.fitsContainerSize,
                  color: editing.color,
                  materialType: editing.materialType,
                  priceEach: editing.priceEach,
                  minOrderQty: editing.minOrderQty,
                  sku: editing.sku ?? "",
                  notes: editing.notes ?? "",
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
