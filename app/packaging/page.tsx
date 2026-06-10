import { ContainerProduct } from "@/lib/models/ContainerProduct";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { ContainerCatalog } from "@/components/ContainerCatalog";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function ContainersPage({ searchParams }: Props) {
  const { q } = await searchParams;
  if (!(await ensureDb())) {
    return <SetupRequired />;
  }

  const containers = await ContainerProduct.find({})
    .sort({ name: 1, size: 1, priceEach: 1, vendor: 1 })
    .lean();

  return (
    <ContainerCatalog
      initial={containers.map((c) => ({
        _id: String(c._id),
        name: c.name,
        vendor: c.vendor,
        size: c.size,
        priceEach: c.priceEach,
        minOrderQty: c.minOrderQty,
        sku: c.sku ?? "",
        notes: c.notes ?? "",
      }))}
      initialQuery={q ?? ""}
    />
  );
}
