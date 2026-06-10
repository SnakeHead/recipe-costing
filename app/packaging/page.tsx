import { ContainerProduct } from "@/lib/models/ContainerProduct";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { ContainerCatalog } from "@/components/ContainerCatalog";
import type { ContainerCaseSize, ContainerMaterialType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function PackagingPage({ searchParams }: Props) {
  const { q } = await searchParams;
  if (!(await ensureDb())) {
    return <SetupRequired />;
  }

  const containers = await ContainerProduct.find({})
    .sort({ name: 1, size: 1, priceEach: 1, vendor: 1 })
    .lean();

  const knownVendors = [
    ...new Set(containers.map((c) => c.vendor).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <ContainerCatalog
      knownVendors={knownVendors}
      initial={containers.map((c) => ({
        _id: String(c._id),
        name: c.name,
        vendor: c.vendor,
        size: c.size,
        materialType: (c.materialType ?? "glass") as ContainerMaterialType,
        caseSize: (c.caseSize ?? "bulk") as ContainerCaseSize,
        casePrice: c.casePrice ?? c.priceEach,
        unitsPerCase: c.unitsPerCase ?? 1,
        priceEach: c.priceEach,
        minOrderQty: c.minOrderQty,
        sku: c.sku ?? "",
        notes: c.notes ?? "",
      }))}
      initialQuery={q ?? ""}
    />
  );
}
