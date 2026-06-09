import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { IngredientCatalog } from "@/components/IngredientCatalog";
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function IngredientsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  if (!(await ensureDb())) {
    return <SetupRequired />;
  }

  const ingredients = await IngredientProduct.find({})
    .sort({ name: 1, vendor: 1 })
    .lean();

  return (
    <IngredientCatalog
      initial={ingredients.map((i) => ({
        _id: String(i._id),
        name: i.name,
        vendor: i.vendor,
        brand: i.brand ?? "",
        unitsPerPack: i.unitsPerPack,
        unitSize: i.unitSize ?? "",
        weightUnit: i.weightUnit as "lb" | "oz" | "kg" | "g",
        packPrice: i.packPrice,
        costPerPound: i.costPerPound ?? undefined,
      }))}
      initialQuery={q ?? ""}
    />
  );
}
