import { formatMoney } from "@/lib/costing";

export function formatPriceEach(price: number): string {
  return `${formatMoney(price)} each`;
}

export function containerGroupKey(name: string, size: string): string {
  return `${name.trim().toLowerCase()}|${size.trim().toLowerCase()}`;
}

export function capGroupKey(
  fitsContainerName: string,
  fitsContainerSize: string,
  color: string,
  materialType: string,
): string {
  return [
    fitsContainerName.trim().toLowerCase(),
    fitsContainerSize.trim().toLowerCase(),
    color.trim().toLowerCase(),
    materialType.trim().toLowerCase(),
  ].join("|");
}

export function groupByKey<T extends { priceEach: number }>(
  items: T[],
  keyFn: (item: T) => string,
): { key: string; items: T[]; bestPrice: number }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key);
    if (group) group.push(item);
    else map.set(key, [item]);
  }

  return [...map.entries()]
    .map(([key, groupItems]) => {
      const sorted = [...groupItems].sort((a, b) => a.priceEach - b.priceEach);
      return {
        key,
        items: sorted,
        bestPrice: sorted[0]?.priceEach ?? 0,
      };
    })
    .sort((a, b) => {
      const aLabel = keyFn(a.items[0]!);
      const bLabel = keyFn(b.items[0]!);
      return aLabel.localeCompare(bLabel);
    });
}

export function materialTypeLabel(type: string): string {
  return type === "metal" ? "Metal" : "Plastic";
}
