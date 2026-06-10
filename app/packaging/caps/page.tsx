import { CapProduct } from "@/lib/models/CapProduct";
import { ContainerProduct } from "@/lib/models/ContainerProduct";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { CapCatalog } from "@/components/CapCatalog";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function CapsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  if (!(await ensureDb())) {
    return <SetupRequired />;
  }

  const [caps, containers] = await Promise.all([
    CapProduct.find({})
      .sort({
        fitsContainerName: 1,
        fitsContainerSize: 1,
        color: 1,
        materialType: 1,
        priceEach: 1,
        vendor: 1,
      })
      .lean(),
    ContainerProduct.find({})
      .sort({ name: 1, size: 1 })
      .lean(),
  ]);

  return (
    <CapCatalog
      initial={caps.map((c) => ({
        _id: String(c._id),
        name: c.name,
        vendor: c.vendor,
        fitsContainerName: c.fitsContainerName,
        fitsContainerSize: c.fitsContainerSize,
        color: c.color,
        materialType: c.materialType as "metal" | "plastic",
        priceEach: c.priceEach,
        minOrderQty: c.minOrderQty,
        sku: c.sku ?? "",
        notes: c.notes ?? "",
      }))}
      containerOptions={containers.map((c) => ({
        name: c.name,
        size: c.size,
      }))}
      initialQuery={q ?? ""}
    />
  );
}
